
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { parse } = require('csv-parse/sync');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

const pool = new Pool({ connectionString: process.env.CLIENTS_DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
    const file = path.join(__dirname, '../generated_data/unified_customers.csv');
    console.log(`📦 Debug Importing unified_customers from ${file}...`);

    const content = fs.readFileSync(file, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('   Truncating...');
        await client.query('TRUNCATE TABLE "unified_customers" CASCADE');

        console.log('   Inserting row 1...');
        const row = records[0];
        const cols = Object.keys(row);
        const query = `
            INSERT INTO "unified_customers" (${cols.map(c => `"${c}"`).join(', ')})
            VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})
        `;

        const values = cols.map(c => {
            let val = row[c];
            if (val === '' || val === 'null' || val === 'undefined') return null;
            return val;
        });

        await client.query(query, values);

        await client.query('COMMIT');
        console.log('✅ Success! (Transaction Committed)');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ ERROR:', e); // Full error object
    } finally {
        client.release();
        pool.end();
    }
}

run();
