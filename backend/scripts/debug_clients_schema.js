const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Connecting...');
        const res = await pool.query('SELECT * FROM clients LIMIT 1');
        console.log('Keys:', Object.keys(res.rows[0] || {}));

        // Also query information_schema to be sure
        const schemaRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'clients'");
        console.log('Schema Columns:', schemaRes.rows.map(r => r.column_name));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
