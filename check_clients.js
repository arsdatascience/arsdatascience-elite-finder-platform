const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function listClients() {
    try {
        const res = await pool.query('SELECT id, name FROM clients');
        console.log('Clientes encontrados:', res.rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listClients();
