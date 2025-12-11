const { Client } = require('pg');

const databases = [
    'Hub Marketing',
    'neondb_local',
    'postgres',
    'Agrario-Pro-Barufaldi'
];

async function checkDb(dbName) {
    const encodedDbName = encodeURIComponent(dbName);
    const connectionString = `postgresql://postgres:postgres@localhost:5432/${encodedDbName}`;
    const client = new Client({ connectionString });

    try {
        await client.connect();
        // Check if leads table exists
        const res = await client.query("SELECT to_regclass('public.leads')");
        if (res.rows[0].to_regclass) {
            // Count leads
            const countRes = await client.query('SELECT COUNT(*) FROM leads');
            console.log(`✅ Database "${dbName}" has 'leads' table with ${countRes.rows[0].count} rows.`);
            return true;
        } else {
            console.log(`❌ Database "${dbName}" does NOT have 'leads' table.`);
        }
    } catch (err) {
        console.log(`❌ Could not connect to "${dbName}": ${err.message}`);
    } finally {
        await client.end();
    }
    return false;
}

async function find() {
    console.log('Searching for database with leads table...');
    for (const db of databases) {
        await checkDb(db);
    }
}

find();
