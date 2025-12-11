require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { opsPool } = require('./database');

async function check() {
    try {
        console.log('Checking templates active status...');
        const res = await opsPool.query('SELECT count(*) FROM templates WHERE is_active = true');
        console.log('Active templates:', res.rows[0].count);

        const sample = await opsPool.query('SELECT id, name, is_active FROM templates LIMIT 5');
        console.log('Sample data:', sample.rows);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await opsPool.end();
    }
}

check();
