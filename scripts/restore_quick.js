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

async function importFile(pool, filepath, tableName) {
    if (!fs.existsSync(filepath)) {
        console.log(`❌ File not found: ${filepath}`);
        return;
    }
    console.log(`🚀 Importing ${tableName} from ${filepath}...`);

    const content = fs.readFileSync(filepath, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true });

    if (records.length === 0) {
        console.log(`⚠️ File is empty.`);
        return;
    }

    const client = await pool.connect();
    try {
        const cols = Object.keys(records[0]);
        // Quote column names to handle special chars or keywords
        const query = `
            INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(', ')})
            VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})
        `;

        let success = 0;
        let failed = 0;

        for (const row of records) {
            const values = cols.map(c => {
                let val = row[c];
                if (val === '' || val === 'null' || val === 'undefined') return null;
                return val;
            });

            try {
                await client.query(query, values);
                success++;
            } catch (err) {
                // Ignore duplicate key errors if we run this multiple times
                if (err.code === '23505') {
                    // duplicate key, ignore
                } else {
                    failed++;
                    console.error(`   ❌ Row Failed: ${err.message}`);
                }
            }
        }
        console.log(`✅ ${tableName}: Imported ${success} rows. (Failed: ${failed})`);
    } finally {
        client.release();
    }
}

async function run() {
    console.log('⚡ STARTING EMERGENCY RESTORE ⚡');

    // 1. Projects (Megalev) - Synthetic Data
    await importFile(maglevPool, path.join(__dirname, '../synthetic_data/projects.csv'), 'projects');

    // 2. Customers (Crossover) - Generated Data
    await importFile(crossoverPool, path.join(__dirname, '../generated_data/unified_customers.csv'), 'unified_customers');

    console.log('🏁 RESTORE COMPLETE.');
    process.exit(0);
}

run();
