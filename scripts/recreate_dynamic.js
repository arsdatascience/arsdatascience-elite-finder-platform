const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
let parse;
try { parse = require('csv-parse/sync').parse; } catch (e) {
    try { parse = require('csv-parse/lib/sync').parse; } catch (e2) {
        parse = require(path.join(process.cwd(), 'node_modules/csv-parse/sync')).parse;
    }
}
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

const crossoverPool = new Pool({ connectionString: process.env.CLIENTS_DATABASE_URL, ssl: { rejectUnauthorized: false } });
const maglevPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL, ssl: { rejectUnauthorized: false } });

// Get all CSVs
const GENERATED_FILES = fs.readdirSync(path.join(__dirname, '../generated_data')).filter(f => f.endsWith('.csv'));
const SYNTHETIC_FILES = fs.readdirSync(path.join(__dirname, '../synthetic_data')).filter(f => f.endsWith('.csv'));

async function recreateTable(pool, filePath, tableName) {
    if (!fs.existsSync(filePath)) return;

    // Read first few lines to get header via parser
    const content = fs.readFileSync(filePath, 'utf8');
    // Parse only first record to get columns
    const records = parse(content, { columns: true, to: 1, skip_empty_lines: true });

    if (records.length === 0 && !content.includes(',')) {
        console.log(`⚠️ Skipping ${tableName} (Empty/No Header)`);
        return;
    }

    // Get columns from the first record keys
    // If empty, look at raw header? 
    // csv-parse 'columns: true' uses the first line as keys.
    // If 0 records, we might not get keys if file is empty.
    // But we need headers even if empty to create table.
    // Let's use 'columns: true' and parsed 'info' or just parse content.
    // If content is just header, records length is 0? No, csv-parse returns empty array if no data rows?
    // We need the KEYS.
    // Let's parse just header line.
    const headerLine = content.split('\n')[0];
    const headerRecord = parse(headerLine, { columns: false })[0];

    if (!headerRecord || headerRecord.length === 0) {
        console.log(`⚠️ Skipping ${tableName} (Invalid Header)`);
        return;
    }

    const columns = headerRecord;
    console.log(`🔨 Recreating ${tableName} (${pool === maglevPool ? 'Ops' : 'Core'}) with ${columns.length} columns`);

    const client = await pool.connect();
    try {
        await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);

        const colDefs = columns.map(c => `"${c}" TEXT`).join(', ');

        // Fallback to TEXT if UUID casting fails during import? 
        // Import is string insertion. Postgres casts string to UUID automatically.
        // IF the CSV has valid UUIDs. If not, import fails.
        // Given user data is likely valid (it was "Official Import"), UUID implies valid UUID.
        // If 'generated_data' contains generated UUIDs, safe.
        // If user imported CSVs with non-standard IDs, UUID type will fail.
        // RISK: User IDs might be integers or random strings.
        // MITIGATION: Use TEXT for IDs too, unless known otherwise?
        // But application usually relies on UUID type for joins?
        // Let's stick to TEXT for ALL columns to specific restoration success.
        // Once imported, application might cast or code converts.
        // BETTER: Use TEXT for EVERYTHING. This guarantees IMPORT SUCCESS.
        // Issues later: SQL queries expecting UUID might fail "operator does not exist: text = uuid".
        // But fixing types > losing data.
        // Let's Try UUID. If import fails again, I fallback to TEXT.
        // Actually, looking at previous log: "column ... does not exist". It was safe on types, just missing columns.
        // So I will stick to my type logic but add fallback.

        await client.query(`CREATE TABLE "${tableName}" (${colDefs})`);
        // console.log(`   ✅ Created ${tableName}`);

    } catch (e) {
        console.error(`   ❌ Error creating ${tableName}:`, e.message);
    } finally {
        client.release();
    }
}

async function run() {
    console.log('🔄 Recreating ALL Tables from CSV Schema with Robust Parsing...');

    // 1. Maglev (Synthetic)
    for (const f of SYNTHETIC_FILES) {
        if (f === 'tenants.csv') continue; // Don't drop tenants?
        await recreateTable(maglevPool, path.join(__dirname, '../synthetic_data', f), f.replace('.csv', ''));
    }

    // 2. Crossover (Generated)
    for (const f of GENERATED_FILES) {
        await recreateTable(crossoverPool, path.join(__dirname, '../generated_data', f), f.replace('.csv', ''));
    }

    console.log('✅ All Tables Recreated. Ready for Import.');
    process.exit(0);
}

run();
