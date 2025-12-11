
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

const crossoverPool = new Pool({ connectionString: process.env.CLIENTS_DATABASE_URL, ssl: { rejectUnauthorized: false } });
const maglevPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL, ssl: { rejectUnauthorized: false } });

// Full Verification List (Layers 0-6)
const TABLES = {
    Maglev: [
        // Layer 1
        'ml_industry_segments',
        'ml_prophet_holidays',
        'ml_datasets',
        // Layer 2
        'ml_experiments',
        'ml_algorithm_configs',
        // Layer 3 (Results)
        'ml_predictions',
        'ml_regression_results',
        'ml_classification_results',
        'ml_clustering_results',
        'ml_timeseries_results',
        // Layer 3 (Analytics)
        'ml_sales_analytics',
        'ml_marketing_analytics',
        'ml_customer_analytics',
        'ml_financial_analytics',
        'ml_segment_analytics',
        // Layer 4 (Viz)
        'ml_viz_regression',
        'ml_viz_classification',
        'ml_viz_clustering',
        'ml_viz_timeseries',
        'ml_algorithm_config_history'
    ],
    Crossover: [
        // Layer 0
        'tenants',
        'projects',
        // Layer 1
        'unified_customers',
        // Layer 5
        'customer_journeys',
        'customer_interactions',
        'identity_graph',
        'journey_step_templates',
        // Layer 6
        'conversion_events'
    ]
};

async function check(pool, dbName, tables) {
    console.log(`\n🔎 Checking ${dbName}...`);
    let missing = 0;
    for (const t of tables) {
        try {
            const res = await pool.query(`SELECT COUNT(*) FROM "${t}"`);
            const count = parseInt(res.rows[0].count);
            const status = count > 0 ? '✅' : '⚠️';
            const color = count > 0 ? '' : ' (EMPTY)';
            console.log(`   ${status} ${t}: ${count} rows${color}`);
            if (count === 0) missing++;
        } catch (e) {
            console.log(`   ❌ ${t}: ERROR (${e.message})`);
            missing++;
        }
    }
    return missing;
}

async function run() {
    console.log('🚀 Starting Final Full System Verification...');

    const missingMaglev = await check(maglevPool, 'Maglev (Ops)', TABLES.Maglev);
    const missingCrossover = await check(crossoverPool, 'Crossover (Core)', TABLES.Crossover);

    console.log('\n-----------------------------------');
    if (missingMaglev === 0 && missingCrossover === 0) {
        console.log('🎉 SUCCESS: All 28 tables are populated and accessible!');
    } else {
        console.log(`⚠️ ALERTS: Found empty tables or errors. Please review the list above.`);
    }

    process.exit(0);
}

run();
