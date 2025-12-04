const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixData() {
    try {
        console.log('--- Fixing Data ---');

        // 1. Normalize Statuses
        console.log('Normalizing statuses...');
        await pool.query("UPDATE leads SET status = 'closed_lost' WHERE status = 'lost'");
        await pool.query("UPDATE leads SET status = 'in_progress' WHERE status = 'proposal'");
        await pool.query("UPDATE leads SET status = 'new' WHERE status = 'qualified'");
        console.log('Statuses normalized.');

        // 2. Fix Tenant IDs (Link Leads to Client's Tenant)
        console.log('Linking leads to client tenants...');
        const res = await pool.query(`
            UPDATE leads l
            SET tenant_id = c.tenant_id
            FROM clients c
            WHERE l.client_id = c.id
            AND l.tenant_id IS NULL
        `);
        console.log(`Updated ${res.rowCount} leads with correct tenant_id.`);

        pool.end();
    } catch (error) {
        console.error('Error fixing data:', error);
        pool.end();
    }
}

fixData();
