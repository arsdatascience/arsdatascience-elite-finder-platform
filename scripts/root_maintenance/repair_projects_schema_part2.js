
const { Pool } = require('pg');

const maglevPool = new Pool({
    connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
    ssl: { rejectUnauthorized: false }
});

const COLUMNS = [
    { name: 'marketing_objectives', type: 'TEXT' },
    { name: 'target_audience', type: 'TEXT' },
    { name: 'value_proposition', type: 'TEXT' },
    { name: 'brand_positioning', type: 'TEXT' },
    { name: 'marketing_channels', type: 'JSONB' },
    { name: 'timeline_activities', type: 'TEXT' },
    { name: 'dependencies', type: 'TEXT' },
    { name: 'key_milestones', type: 'JSONB' },
    { name: 'team_structure', type: 'JSONB' }
];

async function repair() {
    console.log('🔧 Repairing Projects Schema (Part 2) in Maglev...');
    const client = await maglevPool.connect();
    try {
        for (const col of COLUMNS) {
            try {
                await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
                console.log(`✅ Added ${col.name}`);
            } catch (e) {
                console.log(`⚠️  Failed to add ${col.name}: ${e.message}`);
            }
        }
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    } finally {
        client.release();
        maglevPool.end();
    }
}

repair();
