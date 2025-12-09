require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./database');

async function getClientIds() {
    try {
        const res = await pool.query('SELECT id, name FROM clients ORDER BY id');
        console.log(JSON.stringify(res.rows));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

getClientIds();
