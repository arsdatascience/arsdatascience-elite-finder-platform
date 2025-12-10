const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

let parse;
try {
    parse = require('csv-parse/sync').parse;
} catch (e) {
    try {
        parse = require('csv-parse/lib/sync').parse;
    } catch (e2) {
        try {
            // Try explicit root path
            parse = require(path.join(process.cwd(), 'node_modules/csv-parse/sync')).parse;
        } catch (e3) {
            console.error('❌ Could not load csv-parse library. Install with npm install csv-parse');
            process.exit(1);
        }
    }
}
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

// Configs
const crossoverPool = new Pool({ connectionString: process.env.CLIENTS_DATABASE_URL, ssl: { rejectUnauthorized: false } });
const maglevPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL, ssl: { rejectUnauthorized: false } });

// Import Lists (Based on Analysis)
const MAGLEV_FILES = fs.readdirSync(path.join(__dirname, '../synthetic_data'))
    .filter(f => f.startsWith('ml_') && f.endsWith('.csv'));

// Layered Order for Crossover
const CROSSOVER_ORDER = [
    'unified_customers.csv',
    'customer_journeys.csv',
    'journey_step_templates.csv',
    'customer_interactions.csv',
    'conversion_events.csv',
    'identity_graph.csv'
];

async function importTable(pool, filePath, tableName) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${tableName}: File not found.`);
        return;
    }

    console.log(`📦 Importing ${tableName}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true });

    if (records.length === 0) {
        console.log(`   (Empty file)`);
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Truncate (Cascade) to clear old data
        // Only if it exists
        try {
            await client.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
        } catch (e) {
            if (e.code === '42P01') { // Undefined table
                console.log(`   ❌ Table ${tableName} does not exist in DB. Skipping.`);
                await client.query('ROLLBACK');
                return;
            }
            throw e;
        }

        // 2. Prepare Insert
        const cols = Object.keys(records[0]);
        const query = `
            INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(', ')})
            VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})
        `;

        // 3. Batch Insert
        for (const row of records) {
            const values = cols.map(c => {
                let val = row[c];
                if (val === '' || val === 'null' || val === 'undefined') return null;
                // Basic type fixes if needed
                return val;
            });
            await client.query(query, values);
        }

        await client.query('COMMIT');
        console.log(`   ✅ Imported ${records.length} rows.`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Failed to import ${tableName}:`, e.message);
    } finally {
        client.release();
    }
}

async function run() {
    console.log('🚀 Starting Full Re-import...\n');

    // 1. Maglev Imports (ML Tables)
    console.log(`🔵 Maglev (Ops) Import [${MAGLEV_FILES.length} files]...`);
    for (const file of MAGLEV_FILES) {
        const tableName = file.replace('.csv', '');
        await importTable(maglevPool, path.join(__dirname, '../synthetic_data', file), tableName);
    }

    console.log('\n-----------------------------------\n');

    // 2. Crossover Imports (Layered)
    console.log(`🟣 Crossover (Core) Import [${CROSSOVER_ORDER.length} files]...`);
    for (const file of CROSSOVER_ORDER) {
        const tableName = file.replace('.csv', '');
        await importTable(crossoverPool, path.join(__dirname, '../generated_data', file), tableName);
    }

    console.log('\n✅ All Imports Completed.');
    process.exit(0);
}

run();
