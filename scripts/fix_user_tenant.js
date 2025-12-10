
require('dotenv').config({ path: './backend/.env' });
const pool = require('../backend/database');

async function fixTenant() {
    try {
        console.log('--- FIXING TENANT ID ---');

        // Check current status
        const users = await pool.query('SELECT id, email, tenant_id FROM users WHERE tenant_id IS NULL');
        console.log(`Users with NULL tenant: ${users.rows.length}`);

        if (users.rows.length > 0) {
            console.log('Updating users to tenant_id = "1"...');
            await pool.query("UPDATE users SET tenant_id = '1' WHERE tenant_id IS NULL");
            console.log('Update complete.');
        } else {
            console.log('No users to update.');
        }

        // Verify
        const updated = await pool.query('SELECT id, email, tenant_id FROM users LIMIT 1');
        console.log(`User Tenant is now: ${updated.rows[0].tenant_id}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

fixTenant();
