
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

const pool = new Pool({
    connectionString: process.env.CLIENTS_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    console.log('🔧 Patching Crossover Schema...');

    try {
        // 1. conversion_events
        console.log('   - Patching conversion_events (value)...');
        await pool.query(`
            ALTER TABLE conversion_events 
            ADD COLUMN IF NOT EXISTS value NUMERIC(10,2) DEFAULT 0;
        `);

        // 2. customer_interactions
        console.log('   - Patching customer_interactions (content)...');
        await pool.query(`
            ALTER TABLE customer_interactions 
            ADD COLUMN IF NOT EXISTS content TEXT;
        `);

        // 3. identity_graph
        console.log('   - Patching identity_graph (tenant_id, last_seen_at)...');
        await pool.query(`
            ALTER TABLE identity_graph 
            ADD COLUMN IF NOT EXISTS tenant_id UUID,
            ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        `);

        console.log('✅ Schema Patched Successfully.');
    } catch (e) {
        console.error('❌ Schema Patch Failed:', e);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
