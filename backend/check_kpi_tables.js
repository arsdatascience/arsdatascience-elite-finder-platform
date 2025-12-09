const path = require('path');
// Try loading from backend folder first
require('dotenv').config({ path: path.join(__dirname, '.env') });

const db = require('./database');
const pool = db;
const opsPool = db.opsPool;

async function checkTables() {
    const tables = [
        'nps_surveys',
        'csat_surveys',
        'client_health_metrics',
        'employee_happiness',
        'unified_customers'
    ];

    console.log('🔍 Checking KPI tables (Main DB)...');
    for (const table of tables) {
        try {
            const res = await pool.query(`SELECT count(*) FROM ${table}`);
            console.log(`✅ ${table}: ${res.rows[0].count} records`);
        } catch (e) {
            console.log(`❌ ${table}: FAILED - ${e.message}`);
        }
    }

    console.log('\n🔍 Checking OPS tables...');
    try {
        const res = await opsPool.query('SELECT count(*) FROM financial_transactions');
        console.log(`✅ financial_transactions: ${res.rows[0].count} records`);
    } catch (e) {
        console.log(`❌ financial_transactions: FAILED - ${e.message}`); // Fixed typo
    }

    process.exit(0);
}

checkTables();
