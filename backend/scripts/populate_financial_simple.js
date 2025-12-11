
require('dotenv').config();
const { Pool } = require('pg');

// Using standard environment variable or fallback
const coreString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: coreString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const seedFinancialData = async () => {
    console.log('🌱 Starting Financial Data Population (Simple Mode)...');

    try {
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL is missing in .env');
            process.exit(1);
        }

        // 1. Get Tenant
        let tenantRes = await pool.query('SELECT id FROM tenants LIMIT 1');
        let tenantId;
        if (tenantRes.rows.length === 0) {
            console.log('Creating dummy tenant...');
            const newTenant = await pool.query("INSERT INTO tenants (name) VALUES ('Demo Agency') RETURNING id");
            tenantId = newTenant.rows[0].id;
        } else {
            tenantId = tenantRes.rows[0].id;
        }
        console.log(`Using Tenant ID: ${tenantId}`);

        // 2. Get Clients
        let clientsRes = await pool.query(`SELECT id, name FROM clients WHERE tenant_id = $1`, [tenantId]);
        let clientIds = clientsRes.rows.map(c => c.id);

        if (clientIds.length === 0) {
            console.log('No clients found. Creating demo clients...');
            const demos = ['Tech Corp', 'Health Clinic', 'Retail Store'];
            for (const name of demos) {
                const newC = await pool.query("INSERT INTO clients (tenant_id, name) VALUES ($1, $2) RETURNING id", [tenantId, name]);
                clientIds.push(newC.rows[0].id);
            }
        }
        console.log(`Clients available: ${clientIds.length}`);

        // 3. Define Categories (Strings)
        const incomeCats = ['Receita de Serviços (Fee)', 'Setup & Onboarding', 'Desenvolvimento Web', 'Consultoria'];
        const expenseCats = ['Ferramentas & Software', 'Impostos', 'Mídia Paga (Ads)', 'Pessoal & Salários', 'Aluguel & Escritório'];

        // 4. Generate Transactions
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);

        const randomDate = (start, end) => {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        };

        // ... (Logic remains the same, omitted for brevity in sanitized version if file is just for record)
        // Actually, better to keep the logic for future use.
        // Simplified generation loop:

        // Generate Income
        for (const clientId of clientIds) {
            for (let i = 0; i < 3; i++) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                date.setDate(5);
                await pool.query(`INSERT INTO financial_transactions (tenant_id, description, amount, type, category, client_id, date, status) VALUES ($1, $2, $3, 'income', $4, $5, $6, 'paid')`, [tenantId, 'Fee Mensal', 3500 + Math.random() * 1000, 'Receita de Serviços (Fee)', clientId, date]);
            }
        }

        // Generate Expenses
        for (const clientId of clientIds) {
            for (let i = 0; i < 4; i++) {
                await pool.query(`INSERT INTO financial_transactions (tenant_id, description, amount, type, category, client_id, date, status) VALUES ($1, $2, $3, 'expense', $4, $5, $6, 'paid')`, [tenantId, 'Ads Spend', 500 + Math.random() * 1500, 'Mídia Paga (Ads)', clientId, randomDate(startDate, today)]);
            }
        }

        console.log('✅ Financial Data Populated Successfully!');

    } catch (e) {
        console.error('Error populating data:', e);
    } finally {
        pool.end();
    }
};

seedFinancialData();
