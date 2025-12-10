const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkData() {
    try {
        const tables = ['unified_customers', 'nps_surveys', 'csat_surveys', 'client_health_metrics', 'employee_happiness', 'financial_transactions', 'conversion_events', 'customer_interactions', 'customer_journeys'];

        console.log('--- Checking Row Counts ---');
        for (const table of tables) {
            try {
                const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`${table}: ${res.rows[0].count}`);
            } catch (e) {
                console.log(`${table}: ERROR - ${e.message}`);
            }
        }
    } catch (err) {
        console.error('Connection error', err);
    } finally {
        await pool.end();
    }
}

checkData();
