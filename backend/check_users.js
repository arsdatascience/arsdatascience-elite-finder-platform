const { Pool } = require('pg');
const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const checkUsers = async () => {
    try {
        const res = await pool.query('SELECT * FROM users');
        console.log('Users:', res.rows);
    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        await pool.end();
    }
};

checkUsers();
