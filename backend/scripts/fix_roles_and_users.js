const { Pool } = require('pg');

// Credentials provided by user
const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function fixRolesAndUsers() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting Role and User Fixes...');

        // 1. Ensure super_admin role exists with ID 5
        console.log('Checking roles table...');
        // First check if ID 5 exists
        const roleCheck = await client.query('SELECT id, name FROM roles WHERE id = 5');

        if (roleCheck.rows.length === 0) {
            console.log('Creating super_admin role with ID 5...');
            // We need to be careful with auto-increment. 
            // If we force ID 5, we might need to adjust sequence if it's serial, 
            // but for now let's just insert.
            await client.query(`
                INSERT INTO roles (id, name, description) 
                VALUES (5, 'super_admin', 'Super Administrator with full access')
                ON CONFLICT (id) DO UPDATE SET name = 'super_admin';
            `);
        } else {
            console.log('Role ID 5 already exists:', roleCheck.rows[0]);
            if (roleCheck.rows[0].name !== 'super_admin') {
                console.log('Updating Role ID 5 name to super_admin...');
                await client.query("UPDATE roles SET name = 'super_admin' WHERE id = 5");
            }
        }

        // 2. Update User 79 to role_id 5 (super_admin)
        console.log('Updating User 79 to super_admin...');
        await client.query(`
            UPDATE users 
            SET role_id = 5, role = 'super_admin', tenant_id = NULL 
            WHERE id = 79;
        `);

        // 3. Update User 76 and 80 to role_id 1 (assuming 1 is 'admin' or 'user' as per request)
        // User said: "user id 76 e 80 sao role_id 1"
        console.log('Updating Users 76 and 80 to role_id 1...');
        await client.query(`
            UPDATE users 
            SET role_id = 1 
            WHERE id IN (76, 80);
        `);

        // Also update the string 'role' column for consistency if needed
        // Assuming role_id 1 maps to 'admin' or 'user'. 
        // Let's check what role_id 1 is first to be safe.
        const role1 = await client.query('SELECT name FROM roles WHERE id = 1');
        if (role1.rows.length > 0) {
            const roleName = role1.rows[0].name;
            console.log(`Syncing string role for users 76, 80 to '${roleName}'...`);
            await client.query(`
                UPDATE users 
                SET role = $1 
                WHERE id IN (76, 80);
            `, [roleName]);
        }

        console.log('✅ Fixes applied successfully!');

    } catch (error) {
        console.error('❌ Error applying fixes:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixRolesAndUsers();
