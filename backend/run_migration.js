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
        console.log('🔄 Running migration...');
        const schemaPath = path.join(__dirname, 'migrations', '001_add_permissions_and_profile.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Simple split by semicolon for this migration file
        // Note: This simple split might fail if there are semicolons in strings, but for this specific file it's fine.
        // A better approach is to use the same parser as server.js, but let's try this first.

        // Actually, let's use the DO $$ blocks which are single statements in PG client usually? 
        // No, node-postgres query() usually expects a single statement unless configured otherwise.
        // Let's use the parser logic from server.js to be safe.

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
                console.log('✅ Executed statement.');
            } catch (error) {
                if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
                    console.log('⚠️  Skipped (already exists).');
                } else {
                    console.error('❌ Error executing statement:', error.message);
                }
            }
        }

        console.log('✅ Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
