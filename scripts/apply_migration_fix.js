
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
    const client = await pool.connect();
    try {
        console.log('--- Applying 047_add_client_to_saved_copies.sql ---');
        const migrationFile = path.join(__dirname, '../backend/migrations/047_add_client_to_saved_copies.sql');
        const sql = fs.readFileSync(migrationFile, 'utf-8');

        await client.query(sql);
        console.log('✅ Successfully added client association');

    } catch (e) {
        console.error('Error applying migration:', e);
    } finally {
        client.release();
        pool.end();
    }
}
run();
