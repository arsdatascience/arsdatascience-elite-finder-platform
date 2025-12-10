const { pool, opsPool } = require('../backend/database');

async function checkSchema() {
    try {
        console.log('--- TABLES IN OPSPOOL (MEGALEV) ---');
        const opsTables = await opsPool.query(`
            SELECT tablename FROM pg_catalog.pg_tables 
            WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
        `);
        console.log(opsTables.rows.map(r => r.tablename).join(', '));

        console.log('\n--- COLUMNS IN AI_INSIGHTS ---');
        const aiCols = await pool.query(`
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns 
            WHERE table_name = 'ai_insights';
        `);
        aiCols.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type} (${r.udt_name})`));

        console.log('\n--- COLUMNS IN USERS ---');
        const uCols = await pool.query(`
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        uCols.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type} (${r.udt_name})`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        // Force exit to ensure process ends
        setTimeout(() => process.exit(0), 100);
    }
}

checkSchema();
