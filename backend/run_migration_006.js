require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    try {
        console.log('🔄 Running migration 006: Agent Advanced Parameters...');
        const schemaPath = path.join(__dirname, 'migrations', '006_agent_advanced_params.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        const statements = [];
        let currentStatement = '';
        let inDollarQuote = false;
        let inBlockComment = false;

        const lines = schema.split('\n');
        for (let line of lines) {
            const trimmedLine = line.trim();

            // Skip single-line comments
            if (trimmedLine.startsWith('--')) continue;

            // Handle block comments
            if (trimmedLine.includes('/*')) inBlockComment = true;
            if (trimmedLine.includes('*/')) {
                inBlockComment = false;
                continue;
            }
            if (inBlockComment) continue;

            // Handle DO $$ blocks
            if (trimmedLine.includes('DO $$') || trimmedLine.includes('$$')) {
                inDollarQuote = !inDollarQuote;
            }

            currentStatement += line + '\n';

            if (trimmedLine.endsWith(';') && !inDollarQuote) {
                const stmt = currentStatement.trim();
                if (stmt.length > 0) statements.push(stmt);
                currentStatement = '';
            }
        }

        if (currentStatement.trim().length > 0) {
            statements.push(currentStatement.trim());
        }

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const statement of statements) {
            try {
                await pool.query(statement);
                successCount++;
                console.log('✅ Statement executed');
            } catch (error) {
                if (error.message.includes('already exists') ||
                    error.message.includes('duplicate key') ||
                    error.message.includes('does not exist')) {
                    skipCount++;
                    console.log('⚠️  Skipped (already exists or dependency issue)');
                } else {
                    errorCount++;
                    console.error('❌ Error:', error.message.substring(0, 200));
                }
            }
        }

        console.log(`\n✅ Migration 006 completed!`);
        console.log(`   - ${successCount} statements executed`);
        console.log(`   - ${skipCount} statements skipped`);
        console.log(`   - ${errorCount} errors`);

        await pool.end();
        process.exit(errorCount > 0 ? 1 : 0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
