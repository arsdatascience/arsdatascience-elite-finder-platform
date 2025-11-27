require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkStructure() {
    try {
        console.log('--- Checking "leads" table structure ---');
        const leadsRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'leads' AND column_name = 'id';
        `);
        if (leadsRes.rows.length > 0) {
            console.log('leads.id type:', leadsRes.rows[0].data_type);
        } else {
            console.log('Table "leads" does not exist.');
        }

        console.log('\n--- Checking available extensions ---');
        const extRes = await pool.query(`
            SELECT name, default_version, installed_version 
            FROM pg_available_extensions 
            WHERE name = 'vector';
        `);
        if (extRes.rows.length > 0) {
            console.log('pgvector extension status:', extRes.rows[0]);
        } else {
            console.log('pgvector extension NOT found in pg_available_extensions (Binaries missing).');
        }

        console.log('\n--- Checking installed extensions ---');
        const installedRes = await pool.query('SELECT extname, extversion FROM pg_extension;');
        installedRes.rows.forEach(row => {
            console.log(`- ${row.extname} (${row.extversion})`);
        });

    } catch (err) {
        console.error('Error checking DB:', err);
    } finally {
        await pool.end();
    }
}

checkStructure();
