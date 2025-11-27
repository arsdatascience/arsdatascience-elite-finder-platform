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
        console.log('🔄 Running migration fix for Chatbots...');
        const schemaPath = path.join(__dirname, 'migrations', '003_create_chatbots_fix.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        const statements = [];
        let currentStatement = '';
        let inDollarQuote = false;

        const lines = schema.split('\n');
        for (let line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('--')) continue; // Skip comments
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
                console.error('❌ Error executing statement:', error.message);
                console.error('Statement:', statement);
            }
        }

        console.log('✅ Migration Fix completed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
