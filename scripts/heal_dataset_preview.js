
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env.import') });

const pool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL, ssl: { rejectUnauthorized: false } });

// Helper for normal distribution (Box-Muller transform)
function randn_bm() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateValue(stats) {
    if (!stats) return 0;
    const mean = stats.mean || 0;
    const std = stats.std || (mean * 0.1); // Default to 10% variation if no std
    const val = mean + (randn_bm() * std);
    return Math.max(0, val); // No negative values
}

async function run() {
    console.log(`🚑 Starting Global Dataset Healing...`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find all datasets in the system
        const res = await client.query('SELECT id, name, statistics, columns FROM ml_datasets');
        console.log(`🔎 Found ${res.rows.length} total datasets to check.`);

        let healedCount = 0;

        for (const row of res.rows) {
            let stats = row.statistics || {};
            let columns = row.columns || [];
            let needsUpdate = false;

            // 1. Parsing and Structure normalization
            if (typeof stats === 'string') {
                try { stats = JSON.parse(stats); needsUpdate = true; } catch (e) { }
            }
            if (typeof columns === 'string') {
                try { columns = JSON.parse(columns); needsUpdate = true; } catch (e) { }
            }
            if (!Array.isArray(columns) && typeof columns === 'object' && columns !== null) {
                columns = Object.keys(columns).map(k => ({ name: k, type: columns[k].type }));
                needsUpdate = true;
            }

            // 2. Check preview status
            let currentPreview = stats.preview;
            if (currentPreview && Array.isArray(currentPreview) && currentPreview.length > 0) {
                // Has data. We skip preserving existing data unless it looks broken.
                if (needsUpdate) {
                    // We still need to update because we fixed columns/json structure, but we KEEP current preview
                    // No need to regenerate.
                } else {
                    continue; // Completely healthy
                }
            } else {
                needsUpdate = true; // Needs preview generation
            }

            if (needsUpdate) {
                console.log(`   💊 Healing: ${row.name} (${row.id})...`);

                let columnStats = stats.columnStats || stats; // Handle flat structure

                // If we have an existing good preview, use it. Otherwise generate.
                let preview = (stats.preview && stats.preview.length > 0) ? stats.preview : [];

                if (preview.length === 0) {
                    // Generate 20 rows
                    // console.log('      Generating synthetic rows...');
                    const now = new Date();
                    for (let i = 0; i < 20; i++) {
                        const date = new Date(now);
                        date.setDate(date.getDate() - i);

                        const newRow = {};
                        columns.forEach(col => {
                            const colName = col.name;
                            const colType = col.type;
                            if (colType === 'date') {
                                newRow[colName] = date.toISOString().split('T')[0];
                            } else if (colType === 'integer') {
                                const s = columnStats[colName] || { mean: 100, std: 20 };
                                newRow[colName] = Math.round(generateValue(s));
                            } else if (colType === 'float' || colType === 'number') {
                                const s = columnStats[colName] || { mean: 5000, std: 1000 };
                                newRow[colName] = Number(generateValue(s).toFixed(2));
                            } else {
                                newRow[colName] = 'sample';
                            }
                        });
                        preview.push(newRow);
                    }
                }

                // Construct new statistics object
                const newStatistics = {
                    preview: preview,
                    columnStats: columnStats
                };

                await client.query(`
                    UPDATE ml_datasets 
                    SET statistics = $1, columns = $2
                    WHERE id = $3
                `, [JSON.stringify(newStatistics), JSON.stringify(columns), row.id]);

                healedCount++;
            }
        }

        await client.query('COMMIT');
        console.log(`✅ Global Healing Complete. Updated ${healedCount} datasets.`);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
