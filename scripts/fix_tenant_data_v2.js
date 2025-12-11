
require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixDataV2() {
    try {
        console.log('--- FIXING TENANT DATA V2 ---');

        // Target Tenant UUID (Valid UUID v4)
        const targetTenantId = 'a1b2c3d4-e5f6-4a5b-8c9d-1234567890ab';

        // 1. Update Admin User (ID 1)
        console.log('Updating Admin User...');
        const userUpdate = await pool.query(
            "UPDATE users SET tenant_id = $1 WHERE id = 1 RETURNING email, tenant_id",
            [targetTenantId]
        );
        console.log('  User Updated:', userUpdate.rows[0]);

        // 2. Update Unified Customers
        console.log('Updating Unified Customers...');
        const customersCount = await pool.query("SELECT COUNT(*) FROM unified_customers WHERE tenant_id IS NULL");
        console.log(`  Found ${customersCount.rows[0].count} orphan customers.`);

        if (parseInt(customersCount.rows[0].count) > 0) {
            const res = await pool.query(
                "UPDATE unified_customers SET tenant_id = $1 WHERE tenant_id IS NULL",
                [targetTenantId]
            );
            console.log(`  Updated ${res.rowCount} unified_customers.`);
        }

        // 3. Update Projects
        const projectsRes = await pool.query(
            "UPDATE projects SET tenant_id = $1 WHERE tenant_id IS NULL",
            [targetTenantId]
        );
        console.log(`  Updated ${projectsRes.rowCount} projects.`);

        // 4. Update AI Insights (if any exist)
        const aiRes = await pool.query(
            "UPDATE ai_insights SET tenant_id = $1 WHERE tenant_id IS NULL",
            [targetTenantId]
        );
        console.log(`  Updated ${aiRes.rowCount} ai_insights.`);

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        process.exit();
    }
}

fixDataV2();
