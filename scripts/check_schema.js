
const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.import' });

const opsPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL });

async function checkSchema() {
    try {
        const res = await opsPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'transactions';
        `);
        console.log('--- Transactions Schema ---');
        console.table(res.rows);
    } catch (e) {
        console.log('Error checking schema:', e.message);
    }
    await opsPool.end();
}

checkSchema();
