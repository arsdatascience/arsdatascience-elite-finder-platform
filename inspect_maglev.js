
const { Pool } = require('pg');

// User provided credentials for MAGLEV (New/Ops DB?)
const connectionString = 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log('Connecting to MAGLEV DB...');
        const client = await pool.connect();
        console.log('Connected to Maglev!');

        // Check Projects Table Columns
        console.log('--- Checking "projects" columns in MAGLEV ---');
        const res = await client.query(`
      SELECT column_name, data_type, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `);

        if (res.rows.length === 0) {
            console.log('❌ Table "projects" does NOT exist in Maglev.');
        } else {
            console.log('✅ Table "projects" exists in Maglev with columns:');
            console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));

            const hasClientId = res.rows.some(r => r.column_name === 'client_id');
            console.log(`Has client_id? ${hasClientId}`);

            if (!hasClientId) console.log('⚠️  THIS CONFIRMS ERRORS WOULD HAPPEN HERE.');
        }

        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

inspect();
