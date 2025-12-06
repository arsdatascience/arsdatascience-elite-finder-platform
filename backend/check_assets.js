require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./database'); // Core
const { opsPool } = require('./database'); // Ops

async function check() {
    try {
        console.log('--- Checking Core DB ---');
        try {
            const res = await pool.query('SELECT count(*) FROM asset_folders');
            console.log('Core: asset_folders count:', res.rows[0].count);
        } catch (e) {
            console.log('Core: asset_folders table NOT found (' + e.message + ')');
        }

        console.log('--- Checking Ops DB ---');
        try {
            const res = await opsPool.query('SELECT count(*) FROM asset_folders');
            console.log('Ops: asset_folders count:', res.rows[0].count);
        } catch (e) {
            console.log('Ops: asset_folders table NOT found (' + e.message + ')');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
        await opsPool.end();
    }
}

check();
