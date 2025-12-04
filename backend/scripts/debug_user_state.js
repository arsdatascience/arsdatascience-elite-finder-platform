const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function debugUser() {
    const client = await pool.connect();
    try {
        console.log('🔍 Debugging User State...');

        const res = await client.query(`
            SELECT id, name, email, role, role_id, tenant_id 
            FROM users 
            WHERE email = 'denismay@arsdatascience.com.br'
        `);

        console.log('User Record:', res.rows[0]);

        const roles = await client.query('SELECT * FROM roles');
        console.log('Roles Table:', roles.rows);

        const clients = await client.query('SELECT count(*) FROM clients');
        console.log('Total Clients in DB:', clients.rows[0].count);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

debugUser();
