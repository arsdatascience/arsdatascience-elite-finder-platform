const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// New Database Connection
const connectionString = 'postgresql://postgres:aWJhKDgggywYLGhvZUrPFuDoVZxQNYLb@turntable.proxy.rlwy.net:49681/railway';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function runAllMigrations() {
    try {
        console.log('Connecting to NEW database (Turntable)...');
        await client.connect();
        console.log('Connected.');

        // Get all SQL files
        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Ensure order by filename (001, 002, etc.)

        console.log(`Found ${files.length} migrations.`);

        for (const file of files) {
            console.log(`Executing ${file}...`);
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
            try {
                await client.query(sql);
                console.log(`✅ ${file} applied.`);
            } catch (e) {
                console.error(`❌ Error in ${file}:`, e.message);
                // Don't stop, some might be "Relation already exists" if run before
            }
        }

        console.log('All migrations executed.');
    } catch (err) {
        console.error('Migration Master Error:', err);
    } finally {
        await client.end();
    }
}

runAllMigrations();
