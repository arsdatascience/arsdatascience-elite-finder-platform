
const { Pool } = require('pg');

const maglevPool = new Pool({
    connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
    ssl: { rejectUnauthorized: false }
});

async function repair() {
    console.log('🔧 Repairing Financial Schema in Maglev...');
    const client = await maglevPool.connect();
    try {
        // 1. Add recurrence to financial_transactions
        try {
            await client.query(`ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS recurrence VARCHAR(50)`);
            console.log('✅ Added recurrence to financial_transactions');
        } catch (e) {
            console.log('⚠️  Failed to add recurrence: ' + e.message);
        }

        // 2. Add is_default to financial_categories
        try {
            await client.query(`ALTER TABLE financial_categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE`);
            console.log('✅ Added is_default to financial_categories');
        } catch (e) {
            console.log('⚠️  Failed to add is_default: ' + e.message);
        }

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    } finally {
        client.release();
        maglevPool.end();
    }
}

repair();
