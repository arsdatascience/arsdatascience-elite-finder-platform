require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    try {
        console.log('🔄 Running migration 002...');
        const schemaPath = path.join(__dirname, 'migrations', '002_fix_permissions.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Use the same robust parser logic as server.js
        const statements = [];
        let currentStatement = '';
        let inDollarQuote = false;

        const lines = schema.split('\n');
        for (let line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('--')) continue;
            if (trimmedLine.includes('DO $$') || trimmedLine.includes('$$')) inDollarQuote = !inDollarQuote;
            currentStatement += line + '\n';
            if (trimmedLine.endsWith(';') && !inDollarQuote) {
                const stmt = currentStatement.trim();
                if (stmt.length > 0) statements.push(stmt);
                currentStatement = '';
            }
        }
        if (currentStatement.trim().length > 0) statements.push(currentStatement.trim());

        for (const statement of statements) {
            try {
                await pool.query(statement);
            } catch (error) {
                if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
                    console.error('❌ Error executing statement:', error.message);
                }
            }
        }

        console.log('✅ Migration 002 completed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
