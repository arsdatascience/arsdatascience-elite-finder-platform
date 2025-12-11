
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.import' });

const clientsPool = new Pool({ connectionString: process.env.CLIENTS_DATABASE_URL });
const opsPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL });

const DATA_DIR = path.join(__dirname, '../synthetic_data');

// Manual CSV Stringifier
function toCSV(data) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const headerLine = headers.join(',');
    const rows = data.map(row => {
        return headers.map(fieldName => {
            let val = row[fieldName];
            if (val === null || val === undefined) return '';
            val = String(val);
            // Escape quotes and wrap in quotes if contains comma or quote
            if (val.includes(',') || val.includes('"')) {
                val = `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(',');
    });
    return [headerLine, ...rows].join('\n');
}

async function generateData() {
    console.log('🔄 Fetching customers...');
    const customersRes = await clientsPool.query('SELECT id, tenant_id FROM unified_customers');
    const customers = customersRes.rows;
    console.log(`✅ Found ${customers.length} customers`);

    if (customers.length === 0) {
        console.error('❌ No customers found! Cannot generate data.');
        process.exit(1);
    }

    const tasks = [];
    const transactions = [];
    const satisfactionScores = [];

    // Helper to random date
    const randomDate = (start, end) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    console.log('🔄 Generating synthetic data...');

    // Check for existing projects or create dummy project IDs if table is empty
    let projectIds = [];
    try {
        const projRes = await opsPool.query('SELECT id FROM projects');
        projectIds = projRes.rows.map(r => r.id);
    } catch (e) { console.log('⚠️ Could not fetch projects, using synthetic IDs'); }

    if (projectIds.length === 0) {
        // If no projects, we assume we need to generate tasks linked to effectively "new" projects or just match tenant
        // For simplicity, we'll generate tasks linked to project_id 1..100 randomly
        projectIds = Array.from({ length: 50 }, (_, i) => i + 1);
    }

    for (const customer of customers) {
        const tenantId = customer.tenant_id || 1;

        // 1. Transactions (Inc/Exp) - 2 to 5 per customer
        const numTrans = Math.floor(Math.random() * 4) + 2;
        for (let i = 0; i < numTrans; i++) {
            const isIncome = Math.random() > 0.3;
            transactions.push({
                tenant_id: tenantId,
                description: isIncome ? 'Service Payment' : 'Operational Cost',
                amount: (Math.random() * 1000 + 100).toFixed(2),
                type: isIncome ? 'income' : 'expense',
                date: randomDate(new Date(2025, 0, 1), new Date()).toISOString().split('T')[0],
                status: 'paid',
                client_id: null // Simplified
            });
        }

        // 2. Satisfaction Scores - 50% chance
        if (Math.random() > 0.5) {
            satisfactionScores.push({
                tenant_id: tenantId,
                score: Math.floor(Math.random() * 3) + 8, // Mostly happy (8-10)
                created_at: randomDate(new Date(2025, 0, 1), new Date()).toISOString()
            });
        }
    }

    // 3. Tasks - Global generation (not per customer strictly, but per tenant/project)
    // Generate 200 tasks distributed across projects
    const statuses = ['todo', 'in_progress', 'done'];
    for (let i = 0; i < 200; i++) {
        tasks.push({
            tenant_id: 1, // Default tenant
            project_id: projectIds[Math.floor(Math.random() * projectIds.length)],
            title: `Task ${i + 1} - ${['Analysis', 'Development', 'Testing', 'Review'][Math.floor(Math.random() * 4)]}`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            priority: 'medium',
            created_at: new Date().toISOString()
        });
    }

    // Save CSVs
    fs.writeFileSync(path.join(DATA_DIR, 'transactions.csv'), toCSV(transactions));
    fs.writeFileSync(path.join(DATA_DIR, 'satisfaction_scores.csv'), toCSV(satisfactionScores));
    fs.writeFileSync(path.join(DATA_DIR, 'tasks.csv'), toCSV(tasks));

    console.log(`✅ Saved CSVs: 
    - transactions.csv (${transactions.length})
    - satisfaction_scores.csv (${satisfactionScores.length})
    - tasks.csv (${tasks.length})`);

    // Create Tables and Import
    console.log('🔄 Creating tables and importing data...');

    // TASKS
    await opsPool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER,
            project_id INTEGER,
            title VARCHAR(255),
            status VARCHAR(50),
            priority VARCHAR(20),
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // TRANSACTIONS (Matches insightsController query: select type, amount...)
    await opsPool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER,
            description TEXT,
            amount DECIMAL(10,2),
            type VARCHAR(20),
            date DATE,
            status VARCHAR(20),
            client_id INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // SATISFACTION SCORES
    await opsPool.query(`
        CREATE TABLE IF NOT EXISTS satisfaction_scores (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER,
            score INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // Import Helper - Using INSERT directly to ensure simple types match
    async function importCsv(pool, tableName, data) {
        if (data.length === 0) return;
        const keys = Object.keys(data[0]);
        // Simple sanitization for column names
        const cols = keys.map(k => `"${k}"`).join(',');

        // Batch insert could be faster but let's do row by row for simplicity/safety against failures
        let success = 0;
        let fail = 0;
        for (const row of data) {
            const vals = keys.map(k => row[k]);
            const placeholders = vals.map((_, i) => `$${i + 1}`).join(',');
            try {
                await pool.query(`INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders})`, vals);
                success++;
            } catch (e) {
                fail++;
                if (fail < 5) console.error(`Failed row in ${tableName}: ${e.message}`);
            }
        }
        console.log(`✅ Imported ${success} rows into ${tableName} (Failed: ${fail})`);
    }

    await importCsv(opsPool, 'tasks', tasks);
    await importCsv(opsPool, 'transactions', transactions);
    await importCsv(opsPool, 'satisfaction_scores', satisfactionScores);

    console.log('🎉 Done!');
    await clientsPool.end();
    await opsPool.end();
}

generateData().catch(err => {
    console.error(err);
    process.exit(1);
});
