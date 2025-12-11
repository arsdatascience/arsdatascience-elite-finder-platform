
const { Pool } = require('pg');

const maglevPool = new Pool({
    connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
    ssl: { rejectUnauthorized: false }
});

const COLUMNS = [
    { name: 'objectives', type: 'TEXT' }, // INFERRED
    { name: 'tools_platforms', type: 'TEXT' },
    { name: 'external_suppliers', type: 'TEXT' },
    { name: 'creative_assets', type: 'TEXT' },
    { name: 'kpis', type: 'TEXT' },
    { name: 'goals', type: 'TEXT' },
    { name: 'analysis_tools', type: 'TEXT' },
    { name: 'reporting_frequency', type: 'VARCHAR(100)' },
    { name: 'budget_media', type: 'NUMERIC' },
    { name: 'budget_production', type: 'NUMERIC' },
    { name: 'budget_contingency', type: 'NUMERIC' },
    { name: 'budget_breakdown', type: 'JSONB' },
    { name: 'risks', type: 'TEXT' },
    { name: 'mitigation_plan', type: 'TEXT' },
    { name: 'approval_status', type: 'VARCHAR(50)' },
    { name: 'creative_brief_link', type: 'TEXT' },
    { name: 'assets_link', type: 'TEXT' }
];

async function repair() {
    console.log('🔧 Repairing Projects Schema in Maglev...');
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
