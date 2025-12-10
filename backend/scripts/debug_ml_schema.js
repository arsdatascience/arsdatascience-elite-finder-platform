
// Hardcoded for debugging because local .env is missing/broken
const { Pool } = require('pg');

const coreString = 'postgres://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString: coreString,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    console.log('Checking ml_datasets columns...');
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ml_datasets'
        `);

        console.log('Columns:', res.rows);

        // Also check one row's statistics format
        const row = await pool.query('SELECT statistics FROM ml_datasets LIMIT 1');
        if (row.rows.length > 0) {
            console.log('Sample Statistics Type:', typeof row.rows[0].statistics);
            console.log('Sample Statistics Content (keys):', Object.keys(row.rows[0].statistics || {}));
        } else {
            console.log('No data in ml_datasets');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

check();
