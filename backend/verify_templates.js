require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { opsPool } = require('./database');

async function check() {
    try {
        console.log('Checking templates table...');
        const res = await opsPool.query('SELECT count(*) FROM templates');
        console.log('✅ Templates table exists! Row count:', res.rows[0].count);

        const res2 = await opsPool.query('SELECT count(*) FROM template_items');
        console.log('✅ Template Items table exists! Row count:', res2.rows[0].count);
    } catch (e) {
        console.error('❌ Error querying templates:', e.message);
    } finally {
        await opsPool.end();
    }
}

check();
