
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

const pool = new Pool({ connectionString: process.env.CLIENTS_DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
    const client = await pool.connect();
    try {
        const tables = ['identity_graph', 'customer_interactions', 'customer_journeys'];
        for (const table of tables) {
            console.log(`\n--- ${table.toUpperCase()} Schema ---`);
            const res = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);
            console.table(res.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}
run();
