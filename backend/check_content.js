const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./database');
const pool = db;
const opsPool = db.opsPool;

async function check() {
    try {
        console.log('--- STAGE DISTRIBUTION ---');
        const stages = await pool.query(`
            SELECT current_stage, count(*) 
            FROM unified_customers 
            GROUP BY current_stage
        `);
        console.table(stages.rows);

        console.log('\n--- FINANCIAL DATES ---');
        const dates = await opsPool.query(`
            SELECT MIN(date) as min_date, MAX(date) as max_date, COUNT(*) 
            FROM financial_transactions
        `);
        console.log(dates.rows[0]);

        // Check if any financials in current month (Dec 2025 based on system time? User says 2025-12-09)
        const currentMonth = await opsPool.query(`
            SELECT COUNT(*), SUM(amount)
            FROM financial_transactions
            WHERE date >= '2025-12-01' AND date <= '2025-12-31'
        `);
        console.log('Current Month (Dec 2025):', currentMonth.rows[0]);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
