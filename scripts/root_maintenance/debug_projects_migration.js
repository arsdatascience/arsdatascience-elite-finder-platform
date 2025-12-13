
const { Pool } = require('pg');

const corePool = new Pool({
    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
    ssl: { rejectUnauthorized: false }
});

const maglevPool = new Pool({
    connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
    ssl: { rejectUnauthorized: false }
});

async function debug() {
    console.log('🐞 Debugging Projects Migration...');
    const src = await corePool.connect();
    const dest = await maglevPool.connect();

    try {
        // Fetch source row
        const res = await src.query('SELECT * FROM projects');
        if (res.rows.length === 0) {
            console.log('No projects in source?');
            return;
        }
        const row = res.rows[0];
        console.log('Source Row:', row);

        // Try insert
        const columns = Object.keys(row);
        const values = Object.values(row);

        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const colsStr = columns.map(c => `"${c}"`).join(', ');

        try {
            await dest.query(
                `INSERT INTO projects (${colsStr}) VALUES (${placeholders})`,
                values
            );
            console.log('✅ Insert Successful!');
        } catch (err) {
            console.error('❌ Insert Failed:', err.message);
            // console.error('Details:', err);
        }

    } catch (e) {
        console.error(e);
    } finally {
        src.release();
        dest.release();
        corePool.end();
        maglevPool.end();
    }
}
debug();
