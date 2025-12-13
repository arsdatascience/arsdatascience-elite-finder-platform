
const { Pool } = require('pg');

// Core DB
const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log('Connecting to CORE DB...');
        const client = await pool.connect();

        // Check row count
        const res = await client.query('SELECT COUNT(*) FROM projects');
        console.log(`Rows in CORE 'projects' table: ${res.rows[0].count}`);

        client.release();
    } catch (err) {
        if (err.code === '42P01') {
            console.log('Table "projects" does NOT exist in Core DB.');
        } else {
            console.error('Error:', err.message);
        }
    } finally {
        pool.end();
    }
}

inspect();
