
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function run() {
    console.log('Applying migration...');
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL missing');
        }

        // Example usage: node run_migration_fix.js
        // Adjust path if needed or use arg
        const sqlPath = path.join(__dirname, '../migrations/045_fix_missing_financial_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);
        console.log('✅ Migration applied successfully!');

    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        pool.end();
    }
}

run();
