
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

const pool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL, ssl: { rejectUnauthorized: false } });

async function run() {
    const id = '363a33a7-cd17-47cb-b626-5d5864cfc2e1';
    console.log(`🔎 Inspecting Dataset ${id}...`);

    try {
        const res = await pool.query('SELECT * FROM ml_datasets WHERE id = $1', [id]);
        if (res.rows.length === 0) {
            console.log('❌ Dataset NOT FOUND in DB');
        } else {
            const row = res.rows[0];
            console.log('✅ Found:');
            console.log(`   Name: ${row.name}`);
            console.log(`   Preview Length: ${row.statistics?.preview?.length || 0}`);
            console.log(`   Preview Key Exists: ${'preview' in (row.statistics || {})}`);
            console.log(`   Raw Statistics: ${JSON.stringify(row.statistics).substring(0, 200)}...`);
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

run();
