// Quick script to test template query against Maglev DB
require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

const opsPool = new Pool({
    connectionString: process.env.OPERATIONS_DB_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testTemplates() {
    try {
        console.log('🔄 Testing Templates Query...');
        console.log('📍 Using DB:', process.env.OPERATIONS_DB_URL ? 'OPERATIONS_DB_URL' : 'DATABASE_URL (fallback)');

        const result = await opsPool.query('SELECT COUNT(*) as count FROM templates WHERE is_active = true');
        console.log(`📊 Active Templates: ${result.rows[0].count}`);

        const sample = await opsPool.query('SELECT id, name, category FROM templates WHERE is_active = true LIMIT 5');
        console.log('🔖 Sample Templates:', sample.rows);
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await opsPool.end();
    }
}

testTemplates();
