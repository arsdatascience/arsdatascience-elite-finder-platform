const { Pool } = require('pg');
const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const checkTable = async () => {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'integrations'
        `);
        console.log('Table exists:', res.rows.length > 0);

        if (res.rows.length > 0) {
            const columns = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'integrations'
            `);
            console.log('Columns:', columns.rows);
        }
    } catch (err) {
        console.error('Error checking table:', err);
    } finally {
        await pool.end();
    }
};

checkTable();
