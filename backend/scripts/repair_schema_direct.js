const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('🔄 Repairing Schema...');

        await pool.query(`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS document VARCHAR(20),
            ADD COLUMN IF NOT EXISTS address_street VARCHAR(255),
            ADD COLUMN IF NOT EXISTS address_number VARCHAR(20),
            ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100),
            ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100),
            ADD COLUMN IF NOT EXISTS address_city VARCHAR(100),
            ADD COLUMN IF NOT EXISTS address_state CHAR(2),
            ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10),
            ADD COLUMN IF NOT EXISTS foundation_date DATE,
            ADD COLUMN IF NOT EXISTS triggers TEXT,
            ADD COLUMN IF NOT EXISTS steps_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS enrolled_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS conversion_rate VARCHAR(50),
            ADD COLUMN IF NOT EXISTS flow_data JSONB;
            
            -- Widen columns for encryption
            ALTER TABLE clients ALTER COLUMN phone TYPE VARCHAR(255);
            ALTER TABLE clients ALTER COLUMN whatsapp TYPE VARCHAR(255);
            ALTER TABLE clients ALTER COLUMN document TYPE VARCHAR(255);
            ALTER TABLE clients ALTER COLUMN address_zip TYPE VARCHAR(255);
            ALTER TABLE clients ALTER COLUMN address_zip TYPE VARCHAR(255);
            ALTER TABLE clients ALTER COLUMN address_number TYPE VARCHAR(255);
            ALTER TABLE clients ALTER COLUMN bank_account TYPE VARCHAR(255);
            ALTER TABLE clients ALTER COLUMN legal_rep_cpf TYPE VARCHAR(255);
            ALTER TABLE clients ALTER COLUMN pix_key TYPE VARCHAR(255);
        `);

        console.log('✅ Schema Repaired.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error repairing schema:', e);
        process.exit(1);
    }
}

run();
