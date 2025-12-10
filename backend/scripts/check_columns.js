
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkColumns() {
    try {
        const tables = ['unified_customers', 'client_health_metrics'];

        console.log('--- Checking Columns ---');
        for (const table of tables) {
            const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
        `, [table]);

            console.log(`\nTable: ${table}`);
            res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
        }
    } catch (err) {
        console.error('Error', err);
    } finally {
        await pool.end();
    }
}

checkColumns();
