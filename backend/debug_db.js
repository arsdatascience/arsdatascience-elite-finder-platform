const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const debugTable = async () => {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'agent_parameter_groups';
        `);
        console.log('Columns in agent_parameter_groups:', res.rows);
    } catch (err) {
        console.error('Error debugging table:', err);
    } finally {
        await pool.end();
    }
};

debugTable();
