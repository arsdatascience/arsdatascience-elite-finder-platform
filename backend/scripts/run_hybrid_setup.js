const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const opsPool = new Pool({
    connectionString: process.env.OPERATIONS_DB_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runHybridSetup() {
    const client = await opsPool.connect();
    try {
        console.log('🏗️ Setting up Hybrid Architecture on Operations DB...');
        console.log('URL:', process.env.OPERATIONS_DB_URL);

        const sqlPath = path.join(__dirname, 'setup_ops_db_hybrid.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);

        console.log('✅ Hybrid Schema applied successfully!');
        console.log('Modules: Projects, Tasks, Finance, SOPs, Services, Assets.');
    } catch (err) {
        console.error('❌ Error applying schema:', err.message);
        console.error(err);
    } finally {
        client.release();
        await opsPool.end();
    }
}

runHybridSetup();
