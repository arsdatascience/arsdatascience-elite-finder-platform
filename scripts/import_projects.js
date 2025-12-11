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

const maglevPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL, ssl: { rejectUnauthorized: false } });

async function importTable(pool, filePath, tableName) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Skipping ${tableName} (File not found)`);
        return;
    }
    console.log(`📦 Importing ${tableName}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true });

    if (records.length === 0) return;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const cols = Object.keys(records[0]);
        const query = `
            INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(', ')})
            VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})
        `;

        for (const row of records) {
            const values = cols.map(c => {
                let val = row[c];
                if (val === '') return null;
                return val;
            });
            await client.query(query, values);
        }
        await client.query('COMMIT');
        console.log(`   ✅ Imported ${records.length} rows into ${tableName}.`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Failed to import ${tableName}:`, e.message);
    } finally {
        client.release();
    }
}

async function run() {
    await importTable(maglevPool, path.join(__dirname, '../synthetic_data/projects.csv'), 'projects');
    await importTable(maglevPool, path.join(__dirname, '../synthetic_data/tasks.csv'), 'tasks');
    process.exit(0);
}

run();
