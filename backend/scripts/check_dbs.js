const { Pool } = require('pg');

async function checkDatabases() {
    // Check MAGLEV (main app DB)
    const maglev = new Pool({
        connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
        ssl: { rejectUnauthorized: false }
    });

    // Check CROSSOVER (clients DB)
    const crossover = new Pool({
        connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('=== MAGLEV DB ===');
        const mTables = await maglev.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
        console.log('Tables:', mTables.rows.map(r => r.table_name).join(', '));

        // Check for users table
        const usersCheck = await maglev.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`);
        console.log('\nUsers columns:', usersCheck.rows.map(r => r.column_name).join(', '));

        console.log('\n=== CROSSOVER DB ===');
        const cTables = await crossover.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
        console.log('Tables:', cTables.rows.map(r => r.table_name).join(', '));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await maglev.end();
        await crossover.end();
    }
}

checkDatabases();
