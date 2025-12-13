
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const client = await pool.connect();

        const tables = ['financial_transactions', 'financial_categories'];
        for (const t of tables) {
            console.log(`\nTABLE: ${t}`);
            const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1`, [t]);
            res.rows.forEach(r => console.log(`${r.column_name} ${r.data_type}`));
        }
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
