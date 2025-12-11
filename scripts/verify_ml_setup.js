const { opsPool } = require('../backend/database');
require('dotenv').config({ path: './backend/.env' });

async function verify() {
    console.log('--- Verifying ML Setup ---');
    console.log('Database Config checking...');
    console.log('DATA_BASE_URL2 present:', !!process.env.DATA_BASE_URL2);

    try {
        const client = await opsPool.connect();
        console.log('Connected.');

        // List Tables
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'ml_%'
            ORDER BY table_name;
        `);
        console.log('ML Tables found:', tables.rows.map(t => t.table_name));

        // Check Count
        if (tables.rows.some(t => t.table_name === 'ml_algorithm_configs')) {
            const count = await client.query('SELECT count(*) FROM ml_algorithm_configs');
            console.log('ml_algorithm_configs count:', count.rows[0].count);
        } else {
            console.error('❌ ml_algorithm_configs table MISSING!');
        }

        client.release();
    } catch (err) {
        console.error('Verification Failed:', err);
    } finally {
        await opsPool.end();
    }
}

verify();
