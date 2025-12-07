const { Pool } = require('pg');

async function findUsersTable() {
    const maglev = new Pool({
        connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
        ssl: { rejectUnauthorized: false }
    });

    const crossover = new Pool({
        connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('=== MAGLEV TABLES ===');
        const mTables = await maglev.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log(mTables.rows.map(r => r.table_name).join('\n'));

        // Check for user-like tables
        const userLike = mTables.rows.filter(r => r.table_name.includes('user'));
        console.log('\nUser-like tables in maglev:', userLike.map(r => r.table_name));

        console.log('\n=== CROSSOVER TABLES ===');
        const cTables = await crossover.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log(cTables.rows.map(r => r.table_name).join('\n'));

        const userLikeC = cTables.rows.filter(r => r.table_name.includes('user'));
        console.log('\nUser-like tables in crossover:', userLikeC.map(r => r.table_name));

        // Check if "user" (singular) exists in maglev
        if (mTables.rows.find(r => r.table_name === 'user')) {
            console.log('\n=== FOUND "user" TABLE (SINGULAR) IN MAGLEV ===');
            const cols = await maglev.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user'`);
            console.log(cols.rows.map(c => `${c.column_name}: ${c.data_type}`).join('\n'));
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await maglev.end();
        await crossover.end();
    }
}

findUsersTable();
