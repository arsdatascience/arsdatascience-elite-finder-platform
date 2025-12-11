
require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixData() {
    try {
        console.log('--- FIXING TENANT DATA ---');

        // 1. Ensure Admin has a valid Tenant UUID
        // We use a fixed UUID for consistency: '11111111-1111-1111-1111-111111111111' 
        // OR checks if one exists.

        const adminEmail = 'admin@bypass.com';
        const targetTenantId = '11111111-1111-1111-1111-111111111111';

        console.log(`Setting Tenant ID for ${adminEmail} to ${targetTenantId}...`);

        // Ensure tenant exists in tenants table (if it exists)
        try {
            await pool.query(`
                INSERT INTO tenants (id, name, created_at, updated_at)
                VALUES ($1, 'Main Tenant', NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            `, [targetTenantId]);
            console.log('  Tenant record ensured.');
        } catch (e) {
            console.log('  (tenants table might not exist or verify failed):', e.message);
        }

        // Update User
        await pool.query("UPDATE users SET tenant_id = $1 WHERE email = $2", [targetTenantId, adminEmail]);
        console.log('  User Updated.');

        // 2. Update Orphan Data (NULL tenant_id)
        const tables = ['unified_customers', 'projects', 'tasks', 'leads', 'ai_insights'];

        for (const table of tables) {
            try {
                const res = await pool.query(`
                    UPDATE ${table} 
                    SET tenant_id = $1 
                    WHERE tenant_id IS NULL OR tenant_id::text = '1'
                `, [targetTenantId]);
                console.log(`  Updated ${res.rowCount} rows in ${table}`);
            } catch (e) {
                console.log(`  Error updating ${table}: ${e.message}`);
            }
        }

        // 3. Restore Transactions Table (if missing)
        console.log('\n--- RESTORING TRANSACTIONS TABLE ---');
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS transactions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID,
                    type VARCHAR(50), -- income/expense
                    amount DECIMAL(10, 2),
                    category VARCHAR(100),
                    description TEXT,
                    date TIMESTAMP DEFAULT NOW(),
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);
            console.log('  Transactions table verified/created.');

            // Seed some dummy financial data if empty
            const count = await pool.query('SELECT COUNT(*) FROM transactions');
            if (parseInt(count.rows[0].count) === 0) {
                console.log('  Seeding dummy financial data...');
                await pool.query(`
                    INSERT INTO transactions (tenant_id, type, amount, category, description, date)
                    VALUES 
                    ($1, 'income', 15000.00, 'Sales', 'Project Alpha', NOW() - INTERVAL '2 days'),
                    ($1, 'income', 22000.00, 'Retainer', 'Client Beta', NOW() - INTERVAL '5 days'),
                    ($1, 'expense', 5000.00, 'Software', 'AWS Bill', NOW() - INTERVAL '10 days'),
                    ($1, 'expense', 2000.00, 'Office', 'Rent', NOW() - INTERVAL '15 days')
                 `, [targetTenantId]);
                console.log('  Seeded 4 transactions.');
            }

        } catch (e) {
            console.error('  Failed to create transactions table:', e.message);
        }

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        process.exit();
    }
}

fixData();
