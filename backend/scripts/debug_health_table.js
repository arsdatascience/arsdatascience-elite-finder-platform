
// Hardcoded for debugging because local .env is missing/broken
const { Pool } = require('pg');

const coreString = 'postgres://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString: coreString,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    console.log('Checking client_health_metrics...');
    try {
        const res = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_name = 'client_health_metrics'");
        const exists = res.rows[0].count > 0;
        console.log(`Table 'client_health_metrics': ${exists ? '✅ EXISTS' : '❌ MISSING'}`);

        if (exists) {
            const count = await pool.query("SELECT count(*) FROM client_health_metrics");
            console.log(`Rows in 'client_health_metrics': ${count.rows[0].count}`);
        } else {
            // Try creating it if missing? 
            // Better to just report for now.
            console.log('Detected missing table.');
        }

    } catch (e) {
        console.error('Error checking table:', e);
    } finally {
        pool.end();
    }
}

check();
