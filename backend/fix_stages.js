const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./database');
const pool = db;

async function fixStages() {
    try {
        console.log('🔄 Randomizing unified_customers stages...');

        await pool.query(`
            UPDATE unified_customers 
            SET current_stage = (ARRAY['awareness','consideration','decision','retention'])[floor(random()*4)+1]
            WHERE tenant_id = 1
        `);

        // Force some retention for metrics
        await pool.query(`
            UPDATE unified_customers 
            SET current_stage = 'retention', lifetime_value = (random() * 5000 + 1000)
            WHERE id IN (SELECT id FROM unified_customers ORDER BY random() LIMIT 50)
        `);

        console.log('✅ Stages updated.');

        const stages = await pool.query('SELECT current_stage, count(*) FROM unified_customers GROUP BY current_stage');
        console.table(stages.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

fixStages();
