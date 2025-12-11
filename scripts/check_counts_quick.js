
const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.import' });

const opsPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL });

async function check() {
    try {
        const tObj = await opsPool.query('SELECT count(*) FROM transactions');
        console.log(`Transactions: ${tObj.rows[0].count}`);
    } catch (e) { console.log(e.message); }
    process.exit(0);
}
check();
