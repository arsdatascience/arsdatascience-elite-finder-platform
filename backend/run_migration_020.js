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
        console.log('🔄 Running migration 020...');
        const schemaPath = path.join(__dirname, 'migrations', '020_add_calendar_fields_to_social_posts.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

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

        console.log('✅ Migration 020 completed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
