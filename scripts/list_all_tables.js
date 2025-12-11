
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), 'backend', '.env') });

const opsPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const clientsPool = new Pool({ connectionString: process.env.CLIENTS_DATABASE_URL || process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function listTables(pool, name) {
    try {
        console.log(`\n📋 Listing tables in ${name}...`);
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        if (res.rows.length === 0) console.log('   (No tables found)');
        res.rows.forEach(r => console.log(`   - ${r.table_name}`));
    } catch (e) {
        console.error(`❌ Error scanning ${name}:`, e.message);
    }
}

async function run() {
    await listTables(clientsPool, 'CLIENTS_POOL');
    await listTables(opsPool, 'OPS_POOL');
    process.exit(0);
}

run();
