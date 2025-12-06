require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./database');

async function check() {
    try {
        console.log('Checking Projects...');
        const res = await pool.query('SELECT count(*) FROM projects');
        console.log('Projects count:', res.rows[0].count);

        const res2 = await pool.query('SELECT * FROM projects ORDER BY created_at DESC LIMIT 5');
        console.log('Latest Projects:', res2.rows);

        const user = await pool.query("SELECT id, email, tenant_id FROM users WHERE email LIKE 'admin%' OR email LIKE 'denis%'");
        console.log('Users:', user.rows);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

check();
