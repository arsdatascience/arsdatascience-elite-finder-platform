
const { Pool } = require('pg');

const maglevPool = new Pool({
    connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
    ssl: { rejectUnauthorized: false }
});

const EXPECTED_TABLES = [
    'projects', 'project_members', 'tasks', 'task_comments', 'project_activity_log',
    'asset_folders', 'assets', 'approval_requests',
    'project_templates', 'service_catalog',
    'templates', 'template_items',
    'financial_transactions', 'financial_categories', 'suppliers', 'services'
];

async function check() {
    try {
        const client = await maglevPool.connect();
        console.log('Checking Maglev Tables...');

        let missing = [];
        for (const t of EXPECTED_TABLES) {
            try {
                await client.query(`SELECT 1 FROM ${t} LIMIT 1`);
                console.log(`✅ ${t} exists`);
            } catch (err) {
                if (err.code === '42P01') {
                    console.log(`❌ ${t} MISSING`);
                    missing.push(t);
                } else {
                    console.log(`⚠️  ${t} Error: ${err.message}`);
                }
            }
        }

        if (missing.length === 0) {
            console.log('ALL TABLES READY!');
        } else {
            console.log(`MISSING TABLES: ${missing.join(', ')}`);
        }

        client.release();
    } catch (err) {
        console.error('Conn Error:', err);
    } finally {
        maglevPool.end();
    }
}

check();
