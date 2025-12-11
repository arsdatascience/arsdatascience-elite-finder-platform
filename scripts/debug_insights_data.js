
require('dotenv').config({ path: './backend/.env' });
const pool = require('../backend/database');
const opsPool = pool.opsPool;

async function debugData() {
    try {
        console.log('--- START DEBUG ---');

        // 1. List Users and their Tenants
        const users = await pool.query('SELECT id, email, tenant_id FROM users');
        console.log(`Total Users: ${users.rows.length}`);
        users.rows.forEach(u => console.log(`User: ${u.email} | Tenant: ${u.tenant_id}`));

        if (users.rows.length === 0) {
            console.log('NO USERS FOUND.');
            process.exit(0);
        }

        const targetTenant = users.rows[0].tenant_id;
        console.log(`\nChecking Data for Tenant: ${targetTenant}`);

        // 2. Check Unified Customers (Crossover)
        const allCustomers = await pool.query('SELECT COUNT(*) FROM unified_customers');
        const tenantCustomers = await pool.query('SELECT COUNT(*) FROM unified_customers WHERE tenant_id = $1', [targetTenant]);
        console.log(`Unified Customers (Total in DB): ${allCustomers.rows[0].count}`);
        console.log(`Unified Customers (For Tenant): ${tenantCustomers.rows[0].count}`);

        // 3. Check Interactions
        const allInteractions = await pool.query('SELECT COUNT(*) FROM customer_interactions');
        const tenantInteractions = await pool.query('SELECT COUNT(*) FROM customer_interactions WHERE tenant_id = $1', [targetTenant]);
        console.log(`Interactions (Total): ${allInteractions.rows[0].count}`);
        console.log(`Interactions (For Tenant): ${tenantInteractions.rows[0].count}`);

        // 4. Check Projects (Megalev) - Wrapped in try/catch for connection safety
        try {
            const allProjects = await opsPool.query('SELECT COUNT(*) FROM projects');
            const tenantProjects = await opsPool.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [targetTenant]);
            console.log(`Projects (Total): ${allProjects.rows[0].count}`);
            console.log(`Projects (For Tenant): ${tenantProjects.rows[0].count}`);
        } catch (e) {
            console.log(`Megalev Projects Error: ${e.message}`);
        }

        // 5. Check Insights
        const insights = await pool.query('SELECT id, created_at FROM ai_insights WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 3', [targetTenant]);
        console.log(`Recent Insights Found: ${insights.rows.length}`);
        insights.rows.forEach(i => console.log(`- Insight ${i.id} at ${i.created_at}`));

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    } finally {
        console.log('--- END DEBUG ---');
        process.exit();
    }
}

debugData();
