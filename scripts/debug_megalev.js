
require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

async function debugMegalev() {
    console.log('--- DEBUG Megalev/Maglev Connection ---');

    const dbUrl = process.env.DATA_BASE_URL2 || process.env.OPERATIONS_DB_URL;
    const coreUrl = process.env.DATABASE_URL;

    console.log('ENV Configuration:');
    console.log('  DATABASE_URL (Core):', coreUrl ? 'Present' : 'MISSING');
    console.log('  DATA_BASE_URL2 (Maglev):', process.env.DATA_BASE_URL2 ? 'Present' : 'Missing');
    console.log('  OPERATIONS_DB_URL:', process.env.OPERATIONS_DB_URL ? 'Present' : 'Missing');

    if (!dbUrl && !coreUrl) {
        console.error('CRITICAL: No Database URL found.');
        process.exit(1);
    }

    const targetUrl = dbUrl || coreUrl;
    console.log(`Connecting to: ${dbUrl ? 'Secondary DB (Maglev)' : 'Fallback to Core DB'}`);

    const pool = new Pool({
        connectionString: targetUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        const client = await pool.connect();
        console.log('✅ Connection Successful!');

        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log(`\nTables found (${res.rowCount}):`);
        if (res.rowCount === 0) {
            console.log('  (No tables found in public schema)');
        } else {
            console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
            const hasTransactions = res.rows.some(r => r.table_name === 'transactions');
            console.log(`\nHas 'transactions' table? ${hasTransactions ? 'YES' : 'NO'}`);

            if (!hasTransactions) {
                console.log('  Creating transactions table in Maglev...');
                await client.query(`
                    CREATE TABLE IF NOT EXISTS transactions (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        tenant_id UUID,
                        type VARCHAR(50),
                        amount DECIMAL(10, 2),
                        category VARCHAR(100),
                        description TEXT,
                        date TIMESTAMP DEFAULT NOW(),
                        created_at TIMESTAMP DEFAULT NOW()
                    );
                `);
                console.log('  Transactions table created. Seeding data...');
                // Seed 
                await client.query(`
                    INSERT INTO transactions (tenant_id, type, amount, category, description, date)
                    VALUES 
                    ('11111111-1111-1111-1111-111111111111', 'income', 15000.00, 'Sales', 'Project Alpha', NOW() - INTERVAL '2 days'),
                    ('11111111-1111-1111-1111-111111111111', 'expense', 5000.00, 'Software', 'AWS Bill', NOW() - INTERVAL '10 days')
                 `);
                console.log('  Seeded transactions.');
            }
        }

        client.release();
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

debugMegalev();
