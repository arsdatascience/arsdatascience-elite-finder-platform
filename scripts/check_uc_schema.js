require('dotenv').config({ path: './backend/.env' });
const { pool } = require('./backend/database');

async function checkSchema() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('unified_customers', 'tenants')
            ORDER BY table_name, ordinal_position;
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        client.release();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

checkSchema();
