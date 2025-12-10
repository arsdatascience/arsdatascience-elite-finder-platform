
// Hardcoded for debugging because local .env is missing/broken
const { Pool } = require('pg');

const coreString = 'postgres://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString: coreString,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    console.log('Checking Bind Parameters sensitivity...');
    try {
        // Query uses $1. We pass [$1, $2].
        // Expectation: Error 'bind message supplies 2 parameters...'
        console.log('Test 1: Extra unused param');
        await pool.query('SELECT $1::text as val', ['test', 'unused']);
        console.log('✅ Test 1 Passed (Driver allows extra params)');
    } catch (e) {
        console.log('❌ Test 1 FAILED (Strict params):', e.message);
    }

    try {
        console.log('Test 2: Perfect match');
        await pool.query('SELECT $1::text as val', ['test']);
        console.log('✅ Test 2 Passed');
    } catch (e) {
        console.log('❌ Test 2 FAILED:', e.message);
    }

    pool.end();
}

check();
