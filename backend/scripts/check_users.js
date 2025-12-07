const { Pool } = require('pg');

async function checkUsersTable() {
    const maglev = new Pool({
        connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('=== USERS TABLE COLUMNS ===');
        const cols = await maglev.query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        cols.rows.forEach(c => {
            console.log(`${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`);
        });

        console.log('\n=== TEST: Can we insert with required fields? ===');
        console.log('Required: name, email, password_hash, username');

        // Check if username column exists
        const hasUsername = cols.rows.find(c => c.column_name === 'username');
        console.log('Has username column:', !!hasUsername);

        const hasPasswordHash = cols.rows.find(c => c.column_name === 'password_hash');
        console.log('Has password_hash column:', !!hasPasswordHash);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await maglev.end();
    }
}

checkUsersTable();
