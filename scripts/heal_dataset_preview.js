
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
    const id = '363a33a7-cd17-47cb-b626-5d5864cfc2e1';
    console.log(`🚑 Healing Dataset ${id}...`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const res = await client.query('SELECT * FROM ml_datasets WHERE id = $1', [id]);
        if (res.rows.length === 0) {
            console.log('❌ Dataset NOT FOUND');
            return;
        }

        const row = res.rows[0];
        let stats = row.statistics || {};
        let columns = row.columns || [];

        // Parse if string
        if (typeof stats === 'string') try { stats = JSON.parse(stats); } catch (e) { }
        if (typeof columns === 'string') try { columns = JSON.parse(columns); } catch (e) { } // Assuming columns is JSON string in DB? 
        // Actually columns might be object in JSONB, but if it was legacy string it's processed in controller.
        // In seed CSV it looks like a string "{...}". In DB it's JSONB.
        // However, the seed CSV had columns as OBJECT `{"date":...}` but frontend expects ARRAY.
        // The previous re-import script imported it as is.
        // Let's normalize `columns` to Array if it's an object
        if (!Array.isArray(columns) && typeof columns === 'object') {
            console.log('   Converting columns object to array...');
            columns = Object.keys(columns).map(k => ({ name: k, type: columns[k].type }));
        }

        console.log('   Statistics:', JSON.stringify(stats).substring(0, 100));

        // Detect structure: Flat vs Nested
        let columnStats = stats.columnStats || stats;
        if (stats.preview && Array.isArray(stats.preview)) {
            // It's already nested, but preview is empty?
            if (stats.preview.length > 0) {
                console.log('   Preview already exists (length ' + stats.preview.length + '). Skipping? No, forcing regeneration.');
            }
        }

        // Generate 20 rows
        console.log('   Generating 20 synthetic rows...');
        const preview = [];
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
                    const s = columnStats[colName] || { mean: 100, std: 20 }; // Fallback defaults
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

        // Construct new statistics object
        const newStatistics = {
            preview: preview,
            columnStats: columnStats
        };

        // Update DB
        // Also update columns to be the array version if we fixed it
        await client.query(`
            UPDATE ml_datasets 
            SET statistics = $1, columns = $2
            WHERE id = $3
        `, [JSON.stringify(newStatistics), JSON.stringify(columns), id]);

        await client.query('COMMIT');
        console.log('✅ Dataset Healed Successfully.');
        console.log(`   Sample Row:`, JSON.stringify(preview[0]));

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
