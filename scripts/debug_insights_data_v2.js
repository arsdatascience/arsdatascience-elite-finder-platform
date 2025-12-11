
require('dotenv').config({ path: './backend/.env' });
const pool = require('../backend/database');

async function debugData() {
    try {
        console.log('--- TENANT CHECK ---');

        const users = await pool.query('SELECT email, tenant_id FROM users LIMIT 1');
        if (users.rows.length) {
            console.log(`User Tenant: ${users.rows[0].tenant_id}`);
        } else {
            console.log('No Users.');
        }

        const distinctTenants = await pool.query('SELECT DISTINCT tenant_id, COUNT(*) as count FROM unified_customers GROUP BY tenant_id');
        console.log('Data Tenants:');
        distinctTenants.rows.forEach(r => console.log(`- ${r.tenant_id}: ${r.count} rows`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

debugData();
