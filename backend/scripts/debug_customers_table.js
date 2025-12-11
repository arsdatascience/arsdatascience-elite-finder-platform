
// Hardcoded for debugging because local .env is missing/broken
const { Pool } = require('pg');

const coreString = 'postgres://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString: coreString,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    console.log('Checking unified_customers columns...');
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'unified_customers'
        `);

        const cols = res.rows.map(r => r.column_name);
        console.log('Columns found:', cols);

        // Check for specific columns used in kpiController
        const needed = ['lifetime_value', 'current_stage', 'created_at', 'last_interaction', 'tenant_id', 'client_id'];
        const missing = needed.filter(c => !cols.includes(c));

        if (missing.length > 0) {
            console.log('❌ MISSING COLUMNS:', missing);
        } else {
            console.log('✅ All critical columns present.');
        }

    } catch (e) {
        console.error('Error checking columns:', e);
    } finally {
        pool.end();
    }
}

check();
