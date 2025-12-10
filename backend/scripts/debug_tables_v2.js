
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function check() {
    console.log('Checking tables...');
    try {
        if (!process.env.DATABASE_URL) {
            console.log('❌ DATABASE_URL missing, cannot check remote DB.');
            return;
        }

        const tables = ['nps_surveys', 'financial_transactions'];
        for (const t of tables) {
            const res = await pool.query(`SELECT count(*) FROM information_schema.tables WHERE table_name = '${t}'`);
            console.log(`Table ${t}: ${res.rows[0].count > 0 ? 'Exists' : 'Missing'}`);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

check();
