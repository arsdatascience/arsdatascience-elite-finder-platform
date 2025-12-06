const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { opsPool } = require('./database');
const fs = require('fs');


async function runMigration() {
    try {
        console.log('🔄 Connecting to Operations Database...');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', '025_create_sop_templates.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log(`📜 Running migration: ${path.basename(migrationPath)}`);

        // Connect and execute
        const client = await opsPool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');
            console.log('✅ Migration applied successfully!');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        // Close pool to allow script to exit
        await opsPool.end();
    }
}

runMigration();
