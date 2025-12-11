require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

const opsPool = new Pool({
    connectionString: process.env.OPERATIONS_DB_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixTemplates() {
    const client = await opsPool.connect();
    try {
        console.log('🔄 Checking Template Status...');

        // 1. Check Totals
        const total = await client.query('SELECT COUNT(*) FROM templates');
        const active = await client.query('SELECT COUNT(*) FROM templates WHERE is_active = true');
        const inactive = await client.query('SELECT COUNT(*) FROM templates WHERE is_active = false OR is_active IS NULL');

        console.log(`📊 Statistics:
    - Total: ${total.rows[0].count}
    - Active: ${active.rows[0].count}
    - Inactive: ${inactive.rows[0].count}
        `);

        // 2. Fix Inactive
        if (parseInt(inactive.rows[0].count) > 0) {
            console.log('🛠️ Fixing inactive templates...');
            const updateRes = await client.query('UPDATE templates SET is_active = true WHERE is_active IS NULL OR is_active = false');
            console.log(`✅ Fixed ${updateRes.rowCount} templates.`);
        } else {
            console.log('✅ All templates are already active.');
        }

        // 3. Verify Items
        const items = await client.query('SELECT COUNT(*) FROM template_items');
        console.log(`📦 Template Items Count: ${items.rows[0].count}`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.release();
        await opsPool.end();
    }
}

fixTemplates();
