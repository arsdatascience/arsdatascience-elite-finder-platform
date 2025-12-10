
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

const crossoverPool = new Pool({ connectionString: process.env.CLIENTS_DATABASE_URL, ssl: { rejectUnauthorized: false } });
const maglevPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL, ssl: { rejectUnauthorized: false } });

// Main Tables to Check
const TABLES = {
    Maglev: [
        'ml_algorithm_configs',
        'ml_datasets',
        'ml_predictions'
    ],
    Crossover: [
        'unified_customers',
        'customer_journeys',
        'customer_interactions',
        'conversion_events'
    ]
};

async function check(pool, dbName, tables) {
    console.log(`\n🔎 Checking ${dbName}...`);
    for (const t of tables) {
        try {
            const res = await pool.query(`SELECT COUNT(*) FROM "${t}"`);
            console.log(`   - ${t}: ${res.rows[0].count} rows`);
        } catch (e) {
            console.log(`   - ${t}: Error/Missing (${e.message})`);
        }
    }
}

async function run() {
    await check(maglevPool, 'Maglev (Ops)', TABLES.Maglev);
    await check(crossoverPool, 'Crossover (Core)', TABLES.Crossover);
    process.exit(0);
}

run();
