require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const opsPool = process.env.OPS_DATABASE_URL ? new Pool({ connectionString: process.env.OPS_DATABASE_URL }) : pool;

async function check() {
    try {
        console.log('--- UNIFIED CUSTOMERS ---');
        const cust = await pool.query('SELECT count(*) FROM unified_customers');
        console.log('Total Count:', cust.rows[0].count);

        const tenantDist = await pool.query(`
            SELECT tenant_id, count(*), 
                   SUM(CASE WHEN current_stage IS NOT NULL THEN 1 ELSE 0 END) as with_stage
            FROM unified_customers 
            GROUP BY tenant_id
        `);
        console.log('Tenant Distribution:');
        console.table(tenantDist.rows);

        console.log('\n--- FINANCIAL TRANSACTIONS ---');
        const fin = await opsPool.query(`
            SELECT count(*), MIN(date) as min_date, MAX(date) as max_date 
            FROM financial_transactions
        `);
        console.log('Financial Summary:', fin.rows[0]);

        console.log('\n--- TENANTS ---');
        const tenants = await pool.query('SELECT id, name FROM tenants');
        console.table(tenants.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        if (opsPool !== pool) await opsPool.end();
    }
}

check();
