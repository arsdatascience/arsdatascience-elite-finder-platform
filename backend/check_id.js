require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./database');

const TARGET_ID = '884b8639-66c8-47c0-a905-2df4d8583fb9';

async function checkId() {
    try {
        console.log(`Checking existence of ID: ${TARGET_ID}`);

        const res = await pool.query('SELECT * FROM unified_customers WHERE id = $1', [TARGET_ID]);

        if (res.rows.length > 0) {
            console.log('✅ FOUND! Customer exists.');
            console.log('   Tenant ID:', res.rows[0].tenant_id);
            console.log('   Client ID:', res.rows[0].client_id);
        } else {
            console.log('❌ NOT FOUND. This ID is missing from unified_customers.');

            // Debug: Last 5 inserted
            const last = await pool.query('SELECT id, created_at FROM unified_customers ORDER BY created_at DESC LIMIT 5');
            console.log('   Latest 5 IDs in DB:', last.rows.map(r => r.id));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkId();
