
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.import' });

const opsPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL });
const DATA_DIR = path.join(__dirname, '../synthetic_data');

async function fixTables() {
    console.log('🔧 Fixing tables in Ops DB (Optimized)...');

    // 1. ENSURE SCHEMAS (Idempotent)
    await opsPool.query(`
        CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY);
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER;
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title VARCHAR(255);
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(50);
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20);
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

        CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY);
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type VARCHAR(20);
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS date DATE;
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20);
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_id INTEGER;
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

        CREATE TABLE IF NOT EXISTS satisfaction_scores (id SERIAL PRIMARY KEY);
        ALTER TABLE satisfaction_scores ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
        ALTER TABLE satisfaction_scores ADD COLUMN IF NOT EXISTS score INTEGER;
        ALTER TABLE satisfaction_scores ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    `);
    console.log('✅ Schemas ensured.');

    // 2. IMPORT DATA (Batch)
    async function importTable(tableName, fileName) {
        const filePath = path.join(DATA_DIR, fileName);
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ File ${fileName} not found, skipping.`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        if (lines.length < 2) return;

        const headers = lines[0].trim().split(',');
        const cols = headers.map(h => `"${h}"`).join(',');

        // Prepare chunks
        let rowsToInsert = [];
        const BATCH_SIZE = 500;
        let totalInserted = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple split - Assuming generated data is clean (no commas in values)
            // If quotes exist, strip them
            const values = line.split(',').map(v => {
                if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
                return v;
            });

            if (values.length === headers.length) {
                rowsToInsert.push(values);
            }

            if (rowsToInsert.length >= BATCH_SIZE || i === lines.length - 1) {
                if (rowsToInsert.length > 0) {
                    try {
                        // Construct batch insert query
                        // VALUES ($1, $2...), ($3, $4...), ...
                        const valueStrings = [];
                        const flatParams = [];
                        let pIdx = 1;

                        rowsToInsert.forEach(row => {
                            const placeholders = row.map(() => `$${pIdx++}`).join(',');
                            valueStrings.push(`(${placeholders})`);
                            row.forEach(v => flatParams.push(v));
                        });

                        const query = `INSERT INTO "${tableName}" (${cols}) VALUES ${valueStrings.join(',')}`;
                        await opsPool.query(query, flatParams);
                        totalInserted += rowsToInsert.length;
                        process.stdout.write(`.`); // Progress indicator
                    } catch (e) {
                        console.error(`\n❌ Batch error in ${tableName}: ${e.message}`);
                    }
                    rowsToInsert = [];
                }
            }
        }
        console.log(`\n✅ Imported ${totalInserted} rows into ${tableName}`);
    }

    await importTable('tasks', 'tasks.csv');
    await importTable('transactions', 'transactions.csv');
    await importTable('satisfaction_scores', 'satisfaction_scores.csv');

    await opsPool.end();
}

fixTables().catch(console.error);
