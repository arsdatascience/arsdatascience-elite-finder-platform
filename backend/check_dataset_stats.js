require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./database');

async function checkStats() {
    try {
        console.log('🔍 Checking ml_datasets statistics...');
        const res = await pool.opsPool.query('SELECT name, statistics FROM ml_datasets ORDER BY created_at DESC LIMIT 1');

        if (res.rows.length === 0) {
            console.log('❌ No datasets found.');
        } else {
            const ds = res.rows[0];
            console.log(`✅ Dataset Found: ${ds.name}`);
            console.log('📊 Statistics:', ds.statistics ? JSON.stringify(ds.statistics, null, 2).substring(0, 200) + '...' : 'NULL');
        }
    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        // Pool cleanup might hang if not handled, but script exit is fine
        process.exit(0);
    }
}

checkStats();
