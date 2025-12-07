
const { Pool } = require('pg');

// Maglev DB (Ops)
const connectionString = 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function inspectMaglev() {
    try {
        console.log('Connecting to MAGLEV DB...');
        const client = await pool.connect();

        const tables = ['users', 'clients', 'tenants'];

        for (const table of tables) {
            try {
                const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`${table}: ${res.rows[0].count} rows`);
            } catch (err) {
                console.log(`${table}: [Error/Missing] ${err.message}`);
            }
        }

        client.release();
    } catch (err) {
        console.error('Connection Error:', err.message);
    } finally {
        pool.end();
    }
}

inspectMaglev();
