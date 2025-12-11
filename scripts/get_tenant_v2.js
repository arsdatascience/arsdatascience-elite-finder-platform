const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { pool } = require('../backend/database');

async function getTenant() {
    console.log('--- Fetching Tenant ---');
    try {
        const client = await pool.connect();
        console.log('Connected to Core DB');

        const res = await client.query('SELECT id, name FROM tenants LIMIT 1');
        if (res.rows.length > 0) {
            console.log('TENANT_ID:', res.rows[0].id);
        } else {
            console.log('No tenants found in tenants table. Checking users...');
            const res2 = await client.query('SELECT tenant_id FROM users LIMIT 1');
            if (res2.rows.length > 0) {
                console.log('TENANT_ID:', res2.rows[0].tenant_id);
            } else {
                console.log('No tenant ID found in users table.');
            }
        }
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Connection Failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

getTenant();
