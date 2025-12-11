const { pool } = require('../backend/database');
require('dotenv').config({ path: './backend/.env' });

async function getTenant() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT id, name FROM tenants LIMIT 1');
        if (res.rows.length > 0) {
            console.log('Tenant Found:', res.rows[0]);
        } else {
            console.log('No tenants found. Checking users...');
            const res2 = await client.query('SELECT tenant_id FROM users LIMIT 1');
            if (res2.rows.length > 0) {
                console.log('Tenant ID from User:', res2.rows[0]);
            } else {
                console.log('No tenant ID found.');
            }
        }
        client.release();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getTenant();
