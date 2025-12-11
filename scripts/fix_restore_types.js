const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

const crossoverPool = new Pool({ connectionString: process.env.CLIENTS_DATABASE_URL, ssl: { rejectUnauthorized: false } });
const maglevPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL, ssl: { rejectUnauthorized: false } });

async function fixTypes() {
    console.log('🔧 Relaxing types to TEXT to allow Import...');
    try {
        const client = await crossoverPool.connect();
        await client.query(`ALTER TABLE unified_customers ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::text`);
        client.release();

        const clientOps = await maglevPool.connect();
        await clientOps.query(`ALTER TABLE projects ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::text`);
        clientOps.release();

        console.log('✅ Types Fixed.');
        process.exit(0);
    } catch (e) {
        console.log('⚠️ Error fixing types (ignoring):', e.message);
        process.exit(0);
    }
}

fixTypes();
