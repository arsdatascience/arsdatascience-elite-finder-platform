
const { Pool } = require('pg');

// User provided credentials
const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();
        console.log('Connected!');

        // Check Projects Table Columns
        console.log('--- Checking "projects" columns ---');
        const res = await client.query(`
      SELECT column_name, data_type, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `);

        if (res.rows.length === 0) {
            console.log('❌ Table "projects" does NOT exist in information_schema.');

            // Check if table exists in any schema
            const resTables = await client.query(`
            SELECT * FROM pg_catalog.pg_tables WHERE tablename = 'projects';
        `);
            console.log('Check pg_tables for "projects":', JSON.stringify(resTables.rows, null, 2));

        } else {
            console.log('✅ Table "projects" exists with columns:');
            console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));

            const hasClientId = res.rows.some(r => r.column_name === 'client_id');
            console.log(`Has client_id? ${hasClientId}`);
        }

        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

inspect();
