const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkData() {
    try {
        console.log('--- Database Check ---');

        // Count Clients
        const clientsRes = await pool.query('SELECT COUNT(*) FROM clients');
        console.log(`Total Clients: ${clientsRes.rows[0].count}`);

        // Count Leads
        const leadsRes = await pool.query('SELECT COUNT(*) FROM leads');
        console.log(`Total Leads: ${leadsRes.rows[0].count}`);

        // Check Orphaned Leads (leads with client_id that doesn't exist in clients)
        const orphansRes = await pool.query(`
            SELECT COUNT(*) 
            FROM leads l 
            LEFT JOIN clients c ON l.client_id = c.id 
            WHERE c.id IS NULL
        `);
        console.log(`Orphaned Leads (invalid client_id): ${orphansRes.rows[0].count}`);

        // Check Leads with NULL client_id
        const nullClientRes = await pool.query('SELECT COUNT(*) FROM leads WHERE client_id IS NULL');
        console.log(`Leads with NULL client_id: ${nullClientRes.rows[0].count}`);

        // Check Tenant ID distribution
        const tenantRes = await pool.query('SELECT tenant_id, COUNT(*) FROM leads GROUP BY tenant_id');
        console.log('Leads by Tenant ID:', tenantRes.rows);

        // Check Distinct Statuses
        const statusRes = await pool.query('SELECT status, COUNT(*) FROM leads GROUP BY status');
        console.log('Distinct Statuses:', statusRes.rows);

        // Sample Leads
        const sampleRes = await pool.query('SELECT id, name, client_id, tenant_id, status FROM leads LIMIT 5');
        console.log('Sample Leads:', sampleRes.rows);

        pool.end();
    } catch (error) {
        console.error('Error checking DB:', error);
        pool.end();
    }
}

checkData();
