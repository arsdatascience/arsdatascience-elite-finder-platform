const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log('🔍 Inspecting database tables...');

        const tables = ['leads', 'automation_workflows'];

        for (const table of tables) {
            console.log(`\nChecking table: ${table}`);
            const res = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);

            if (res.rows.length === 0) {
                console.log(`⚠️ Table ${table} does not exist.`);
            } else {
                res.rows.forEach(row => {
                    console.log(` - ${row.column_name} (${row.data_type})`);
                });
            }
        }

    } catch (err) {
        console.error('❌ Error inspecting DB:', err);
    } finally {
        await pool.end();
    }
}

inspect();
