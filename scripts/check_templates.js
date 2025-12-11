require('dotenv').config({ path: 'backend/.env' });
const { opsPool } = require('../backend/database');

async function checkTemplates() {
    console.log('--- Checking MAGLEV DB (via opsPool) ---');
    try {
        const client = await opsPool.connect();
        const resTemplates = await client.query('SELECT COUNT(*) FROM templates');
        const resItems = await client.query('SELECT COUNT(*) FROM template_items');
        console.log(`Maglev Templates: ${resTemplates.rows[0].count}`);
        console.log(`Maglev Items: ${resItems.rows[0].count}`);

        if (parseInt(resTemplates.rows[0].count) > 0) {
            const templates = await client.query('SELECT id, name FROM templates LIMIT 5');
            console.log('Maglev Sample:', templates.rows);
        }
        client.release();
    } catch (err) {
        console.error('Maglev Error:', err.message);
    } finally {
        process.exit();
    }
}

checkTemplates();
