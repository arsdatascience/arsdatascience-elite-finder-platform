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

async function importTable(pool, filePath, tableName) {
    if (!fs.existsSync(filePath)) return;

    console.log(`📦 Importing ${tableName}...`);
    const content = fs.readFileSync(filePath, 'utf8');

    let records = [];
    try {
        records = parse(content, { columns: true, skip_empty_lines: true });
    } catch (e) {
        console.error(`   ❌ Parse Error ${tableName}: ${e.message}`);
        return;
    }

    if (records.length === 0) {
        console.log(`   (Empty)`);
        return;
    }

    const client = await pool.connect();
    try {
        // Remove Transaction to allow partial success
        // await client.query('BEGIN');

        // Get columns from first record to ensure match
        const cols = Object.keys(records[0]);
        const query = `
            INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(', ')})
            VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})
        `;

        let count = 0;
        for (const row of records) {
            const values = cols.map(c => {
                let val = row[c];
                if (val === '' || val === 'null' || val === 'undefined') return null;
                return val;
            });
            try {
                await client.query(query, values);
                count++;
            } catch (err) {
                // Log specific error for this row
                // console.error(`   ⚠️ Row Error ${tableName}: ${err.message}`);
            }
        }

        // await client.query('COMMIT');
        console.log(`   ✅ Imported ${count} / ${records.length} rows into ${tableName}`);
    } catch (e) {
        // await client.query('ROLLBACK');
        console.error(`   ❌ Table Error ${tableName}:`, e.message);
    } finally {
        client.release();
    }
}

async function run() {
    console.log('🚀 Starting Universal Restoration...');

    console.log('--- Maglev (Ref) ---');
    for (const f of SYNTHETIC_FILES) {
        if (f === 'tenants.csv') continue;
        await importTable(maglevPool, path.join(__dirname, '../synthetic_data', f), f.replace('.csv', ''));
    }

    console.log('--- Crossover (Main) ---');
    for (const f of GENERATED_FILES) {
        await importTable(crossoverPool, path.join(__dirname, '../generated_data', f), f.replace('.csv', ''));
    }

    console.log('✅ Final Restoration Complete.');
    process.exit(0);
}

run();
