
const { Pool } = require('pg');

// Core DB
const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const tablesToCheck = [
    // Projects
    'projects', 'project_members', 'tasks', 'task_comments', 'project_activity_log',
    // Assets
    'asset_folders', 'assets',
    // Approvals
    'approval_requests',
    // Services
    'services', 'service_catalog',
    // Processes (Templates)
    'templates', 'template_items', 'project_templates',
    // Financial
    'financial_transactions', 'financial_categories', 'suppliers'
];

async function inspect() {
    try {
        console.log('Connecting to CORE DB...');
        const client = await pool.connect();

        for (const table of tablesToCheck) {
            try {
                const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`${table}: ${res.rows[0].count} rows`);
            } catch (err) {
                if (err.code === '42P01') {
                    console.log(`${table}: [Does not exist]`);
                } else {
                    console.error(`${table}: Error - ${err.message}`);
                }
            }
        }

        client.release();
    } catch (err) {
        console.error('Connection Error:', err.message);
    } finally {
        pool.end();
    }
}

inspect();
