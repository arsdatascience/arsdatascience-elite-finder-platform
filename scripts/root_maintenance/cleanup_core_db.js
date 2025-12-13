
const { Pool } = require('pg');

const corePool = new Pool({
    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
    ssl: { rejectUnauthorized: false }
});

const TABLES_TO_DROP = [
    // Verify referencing tables first? Postgres handles CASCADE if we want, or we delete strictly.
    // Order matters if CASCADE is not used. Leaf nodes first.
    
    'project_activity_log',
    'project_members',
    'tasks',
    'task_comments',
    'assets',
    'asset_folders',
    'approval_requests',
    'template_items',
    'templates',
    'project_templates',
    'services',
    'service_catalog',
    'financial_transactions',
    'financial_categories',
    'suppliers',
    
    // Parents last
    'projects' 
];

async function cleanup() {
    console.log('⚠️  STARTING CLEANUP: DROPPING TABLES FROM CORE DB ⚠️');
    console.log('Use Ctrl+C to abort in 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));

    const client = await corePool.connect();
    try {
        for (const table of TABLES_TO_DROP) {
            console.log(`🗑️  Dropping ${table}...`);
            try {
                // CASCADE needed if hidden dependencies exist
                await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
                console.log(`   ✅ Dropped.`);
            } catch (err) {
                console.error(`   ❌ Error dropping ${table}: ${err.message}`);
            }
        }
        console.log('\n✨ Cleanup Complete. Core DB is now clean of migrated tables.');
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        corePool.end();
    }
}

cleanup();
