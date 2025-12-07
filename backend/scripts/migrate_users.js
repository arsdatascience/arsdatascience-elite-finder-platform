const { Pool } = require('pg');

async function runMigration() {
    const maglev = new Pool({
        connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('=== MIGRATING USERS TABLE ===');

        // Add missing columns if they don't exist
        const migrations = [
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(14)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS address_district VARCHAR(100)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state CHAR(2)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10)`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS openai_key TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_key TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS anthropic_key TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id INTEGER`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
        ];

        for (const sql of migrations) {
            try {
                await maglev.query(sql);
                console.log('✅', sql.substring(0, 60) + '...');
            } catch (err) {
                console.log('⚠️', sql.substring(0, 40), '-', err.message);
            }
        }

        console.log('\n=== VERIFYING ===');
        const cols = await maglev.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' ORDER BY ordinal_position
        `);
        console.log('Users columns now:', cols.rows.map(c => c.column_name).join(', '));

    } catch (err) {
        console.error('Migration Error:', err.message);
    } finally {
        await maglev.end();
    }
}

runMigration();
