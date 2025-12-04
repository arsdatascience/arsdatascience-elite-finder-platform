const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const runMigration = async () => {
    try {
        const sqlPath = path.join(__dirname, 'migrations', '017_create_sales_coaching_template.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running migration 017...');
        await pool.query(sql);
        console.log('Migration 017 applied successfully.');
    } catch (err) {
        console.error('Error running migration:', err);
    } finally {
        await pool.end();
    }
};

runMigration();
