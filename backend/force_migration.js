const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

async function runConstraintFix() {
    try {
        console.log('🔄 Force Applying Migration 057 (Update User Constraint)...');
        const migrationPath = path.join(__dirname, 'migrations', '057_update_user_status_constraint.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolon to ensure all statements run
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (const stmt of statements) {
            console.log(`Executing: ${stmt.substring(0, 50)}...`);
            await db.query(stmt);
        }

        console.log('✅ Migration 057 successfully applied!');
    } catch (err) {
        console.error('❌ Error applying migration:', err.message);
    } finally {
        process.exit(0);
    }
}

runConstraintFix();
