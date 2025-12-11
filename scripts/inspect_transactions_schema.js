
const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env.import' });

const opsPool = new Pool({ connectionString: process.env.OPERATIONS_DB_URL });

async function inspect() {
    try {
        console.log("Connectng...");
        const res = await opsPool.query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name IN ('transactions', 'tasks', 'satisfaction_scores')
            ORDER BY table_name, ordinal_position;
        `);
        // Group by table
        const tables = {};
        for (const row of res.rows) {
            if (!tables[row.table_name]) tables[row.table_name] = [];
            tables[row.table_name].push(row);
        }
        const fs = require('fs');
        const path = require('path');
        fs.writeFileSync(path.join(__dirname, 'schema_dump.json'), JSON.stringify(tables, null, 2));
        console.log("Schema dumped to schema_dump.json");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
inspect();
