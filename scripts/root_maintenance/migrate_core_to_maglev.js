
const { Pool } = require('pg');

// 1. Connection Pools
// Core DB (Source)
const corePool = new Pool({
    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
    ssl: { rejectUnauthorized: false }
});

// Maglev DB (Destination)
const maglevPool = new Pool({
    connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
    ssl: { rejectUnauthorized: false }
});

const TABLES_TO_MIGRATE = [
    // --- FINANCIAL ---
    { name: 'financial_categories', id: 'id' },
    { name: 'suppliers', id: 'id' },
    { name: 'financial_transactions', id: 'id' },
    { name: 'services', id: 'id' },            // Note: services might be separate from catalog in some schemas, check existence
    { name: 'service_catalog', id: 'id' },

    // --- OPERATIONS & ASSETS ---
    { name: 'asset_folders', id: 'id' },
    { name: 'assets', id: 'id' },
    { name: 'project_templates', id: 'id' },
    { name: 'templates', id: 'id' },             // Check overlap with project_templates
    { name: 'template_items', id: 'id' },
    { name: 'approval_requests', id: 'id' },

    // --- PROJECTS & TASKS ---
    { name: 'projects', id: 'id' },
    { name: 'project_members', id: 'project_id' },  // Composite PK usually, but just copying rows
    { name: 'tasks', id: 'id' },
    { name: 'task_comments', id: 'id' },
    { name: 'project_activity_log', id: 'id' },
    // { name: 'content_batches', id: 'id' } // If exists
];

async function migrate() {
    console.log('🚀 Starting Migration: Core -> Maglev');
    const source = await corePool.connect();
    const dest = await maglevPool.connect();

    try {
        for (const table of TABLES_TO_MIGRATE) {
            console.log(`\n📦 Processing ${table.name}...`);

            // 1. Check if source table exists
            try {
                await source.query(`SELECT 1 FROM ${table.name} LIMIT 1`);
            } catch (err) {
                console.log(`   ⚠️  Source table '${table.name}' does not exist. Skipping.`);
                continue;
            }

            // 2. Fetch Source Data
            const { rows } = await source.query(`SELECT * FROM ${table.name}`);
            if (rows.length === 0) {
                console.log(`   ℹ️  Source table empty.`);
                continue;
            }
            console.log(`   ✅ Fetched ${rows.length} rows.`);

            // 3. Simple Insert (Assuming schema matches due to our server.js fixes + previous migrations)
            // Use explicit INSERT with column names to avoid mismatched column content if order differs
            // BUT, retrieving column names dynamically is safer.

            let insertedDocs = 0;
            let skippedDocs = 0;
            let errorDocs = 0;

            for (const row of rows) {
                const columns = Object.keys(row);
                const values = Object.values(row);

                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                const colsStr = columns.map(c => `"${c}"`).join(', '); // quote columns for safety

                try {
                    const conflictAction = (table.id && row[table.id])
                        ? `ON CONFLICT ("${table.id}") DO NOTHING`
                        : 'ON CONFLICT DO NOTHING';

                    // Note: project_members might need composite constraint, but DO NOTHING usually works if constraint exists
                    // If no constraint, duplicates might happen. We'll assume ID or UNIQUE constraints exist.

                    // Specific fix for project_members conflict (composite key)
                    let conflictClause = 'ON CONFLICT DO NOTHING';
                    if (table.name === 'project_members') {
                        conflictClause = 'ON CONFLICT (project_id, user_id) DO NOTHING';
                    } else if (table.id) {
                        conflictClause = `ON CONFLICT ("${table.id}") DO NOTHING`;
                    }

                    await dest.query(
                        `INSERT INTO ${table.name} (${colsStr}) VALUES (${placeholders}) ${conflictClause}`,
                        values
                    );
                    insertedDocs++;
                } catch (err) {
                    // Check if table missing in dest
                    if (err.code === '42P01') {
                        console.error(`   ❌ Destination table '${table.name}' MISSING! Did migrations run?`);
                        // Attempt to continue to next table
                        break; // break inner loop, go to next table
                    }
                    console.error(`   ❌ Error inserting row ${row[table.id] || '?'}: ${err.message}`);
                    errorDocs++;
                }
            }
            console.log(`   Result: ${insertedDocs} inserted/${rows.length}, ${errorDocs} errors.`);

            // 4. Update Sequence (if serial id)
            if (table.id && table.name !== 'project_members') {
                try {
                    await dest.query(`SELECT setval(pg_get_serial_sequence('${table.name}', '${table.id}'), (SELECT MAX("${table.id}") FROM ${table.name}) + 1)`);
                    console.log(`   🔄 Sequence reset.`);
                } catch (seqErr) {
                    // Ignore, might be UUID or explicit ID
                }
            }
        }

        console.log('\n🏁 Migration Complete!');

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    } finally {
        source.release();
        dest.release();
        await corePool.end();
        await maglevPool.end();
    }
}

migrate();
