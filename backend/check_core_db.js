require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./database'); // Default export is 'pool' (Core)

async function checkCore() {
    try {
        console.log('Checking CORE DB templates table...');
        // pool is the default export
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT count(*) FROM templates');
            console.log('CORE DB Templates count:', res.rows[0].count);
        } catch (e) {
            console.error('CORE DB Error:', e.message);
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Connection Error:', e);
    } finally {
        await pool.end();
    }
}

checkCore();
