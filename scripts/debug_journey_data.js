
require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugData() {
    try {
        console.log('--- DEBUG USER vs DATA TENANT ---');

        // 1. Users
        console.log('\n--- USERS ---');
        const users = await pool.query("SELECT id, email, role, tenant_id FROM users");
        users.rows.forEach(u => console.log(`User: ${u.email} | ID: ${u.id} | Tenant: ${u.tenant_id} | Role: ${u.role}`));

        // 2. Data Counts by Tenant
        const tables = ['unified_customers', 'projects', 'ai_insights']; // Excluding problematic tables for now

        for (const table of tables) {
            console.log(`\n--- TABLE: ${table} ---`);
            try {
                // Using COALESCE to make NULL visible in output
                const res = await pool.query(`
                    SELECT 
                        COALESCE(tenant_id::text, 'NULL') as tenant, 
                        COUNT(*) as count 
                    FROM ${table} 
                    GROUP BY tenant_id
                `);

                if (res.rows.length === 0) console.log('  (Table empty)');
                else res.rows.forEach(r => console.log(`  Tenant: ${r.tenant} | Count: ${r.count}`));

            } catch (e) {
                console.log(`  Error querying ${table}: ${e.message}`);
            }
        }

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        process.exit();
    }
}

debugData();
