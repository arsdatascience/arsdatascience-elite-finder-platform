const { opsPool } = require('../backend/database');
require('dotenv').config({ path: './backend/.env' });

async function inspectTable() {
    console.log('--- Inspecting ml_algorithm_configs ---');
    try {
        const client = await opsPool.connect();

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ml_algorithm_configs';
        `);

        console.log('Columns:', res.rows);

        client.release();
    } catch (err) {
        console.error('Inspection Failed:', err);
    } finally {
        await opsPool.end();
    }
}

inspectTable();
