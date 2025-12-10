
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Mock opsPool for this test (using same DB unless different URL)
const opsPool = new Pool({
    connectionString: process.env.DATA_BASE_URL2 || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runQueries() {
    console.log('--- DEBUGGING KPI QUERIES ---');

    const tenantId = 1; // Assuming tenant 1 exisits or null
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    const params = [tenantId, startDate, endDate, null, null]; // Matching kpiController structure

    // 1. NPS
    try {
        await pool.query(`SELECT AVG(score) FROM nps_surveys`);
        console.log('✅ NPS Query: OK');
    } catch (e) {
        console.log('❌ NPS Query FAILED:', e.message);
    }

    // 2. CSAT
    try {
        await pool.query(`SELECT AVG(score) FROM csat_surveys`);
        console.log('✅ CSAT Query: OK');
    } catch (e) {
        console.log('❌ CSAT Query FAILED:', e.message);
    }

    // 3. Client Health (Retention)
    try {
        await pool.query(`SELECT DISTINCT client_id FROM client_health_metrics WHERE period_year = 2025`);
        console.log('✅ Retention Query: OK');
    } catch (e) {
        console.log('❌ Retention Query FAILED:', e.message);
    }

    // 4. Financial (CORE vs OPS check)
    try {
        await opsPool.query(`SELECT SUM(amount) FROM financial_transactions`);
        console.log('✅ Financial Query: OK');
    } catch (e) {
        console.log('❌ Financial Query FAILED:', e.message);
    }

    // 5. CLV (Unified Customers)
    try {
        await pool.query(`SELECT AVG(lifetime_value) FROM unified_customers`);
        console.log('✅ CLV Query: OK');
    } catch (e) {
        console.log('❌ CLV Query FAILED:', e.message);
    }

    // 6. Journey Stage
    try {
        await pool.query(`SELECT current_stage, COUNT(*) FROM unified_customers GROUP BY current_stage`);
        console.log('✅ Journey Stage Query: OK');
    } catch (e) {
        console.log('❌ Journey Stage Query FAILED:', e.message);
    }

    // 7. Employee Happiness
    try {
        await pool.query(`SELECT AVG(happiness_score) FROM employee_happiness`);
        console.log('✅ Employee Happiness Query: OK');
    } catch (e) {
        console.log('❌ Employee Happiness Query FAILED:', e.message);
    }

    // 8. Unified Customers Detailed List (CustomerJourneyList)
    try {
        await pool.query(`SELECT * FROM unified_customers LIMIT 1`);
        console.log('✅ Unified Customers List Query: OK');
    } catch (e) {
        console.log('❌ Unified Customers List Query FAILED:', e.message);
    }

    await pool.end();
    await opsPool.end();
}

runQueries();
