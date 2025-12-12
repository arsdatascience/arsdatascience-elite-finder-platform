const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

async function check() {
    try {
        console.log('Checking Users Table...');
        const result = await db.query('SELECT id, name, email, role, status, tenant_id, updated_at FROM users WHERE id = 1 ORDER BY id ASC');
        result.rows.forEach(row => {
            console.log('------------------------------------------------');
            console.log(`ID: ${row.id}`);
            console.log(`Name: ${row.name}`);
            console.log(`Role: ${row.role}`);
            console.log(`Status: ${row.status}`);
            console.log(`TenantID: ${row.tenant_id}`);
            console.log(`Updated At: ${row.updated_at}`); // Check if this matches "now"
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        // Force exit as pool might keep open
        process.exit(0);
    }
}

check();
