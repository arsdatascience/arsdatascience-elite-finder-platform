// Script to run the ML schema migration
require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const opsPool = new Pool({
    connectionString: process.env.OPERATIONS_DB_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    const client = await opsPool.connect();
    try {
        console.log('🔄 Running ML Schema Migration (033)...');

        const migrationPath = path.join(__dirname, '..', 'backend', 'migrations', '033_create_ml_schema.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        await client.query(sql);

        console.log('✅ Migration 033_create_ml_schema.sql applied successfully!');

        // Verify tables were created
        const tables = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('datasets', 'model_experiments', 'custom_predictions')
        `);
        console.log('📊 Tables created:', tables.rows.map(r => r.table_name).join(', '));

    } catch (err) {
        console.error('❌ Migration Error:', err.message);
    } finally {
        client.release();
        await opsPool.end();
    }
}

runMigration();
