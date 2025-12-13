
const { Pool } = require('pg');

const corePool = new Pool({
    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
    ssl: { rejectUnauthorized: false }
});

const TABLES = ['projects'];

async function inspect() {
    try {
        const client = await corePool.connect();

        for (const table of TABLES) {
            console.log(`\nTable: ${table}`);
            const res = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default 
                FROM information_schema.columns 
                WHERE table_name = '${table}'
                ORDER BY ordinal_position
            `);
            const colNames = res.rows.map(r => ({ name: r.column_name, type: r.data_type }));
            require('fs').writeFileSync('schema_dump.json', JSON.stringify(colNames, null, 2));
            console.log('Schema dumped to schema_dump.json');
        }
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        corePool.end();
    }
}

inspect();
