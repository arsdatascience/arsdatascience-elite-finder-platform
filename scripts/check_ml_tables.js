const { opsPool } = require('../backend/database');
require('dotenv').config({ path: '../backend/.env' });

async function checkTables() {
    try {
        console.log('Checking tables in Operations DB...');
        const res = await opsPool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'ml_%'
            ORDER BY table_name;
        `);

        console.log('Found ML tables:', res.rows.map(r => r.table_name));
        process.exit(0);
    } catch (error) {
        console.error('Error checking tables:', error);
        process.exit(1);
    }
}

checkTables();
