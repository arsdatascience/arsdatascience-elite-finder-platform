require('dotenv').config();
const { opsPool } = require('./database');

async function removeConstraints() {
    const client = await opsPool.connect();
    try {
        console.log('🔌 Connected to Operations DB. Removing Cross-DB Foreign Keys...');

        const queries = [
            // PROJECTS (ops) -> CLIENTS/USERS (core)
            "ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey",
            "ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey",

            // TASKS (ops) -> USERS (core)
            "ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey",
            "ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_reporter_id_fkey",

            // FINANCIAL (ops) -> CLIENTS/USERS (core)
            "ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_client_id_fkey",
            "ALTER TABLE financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_user_id_fkey"
        ];

        for (const query of queries) {
            try {
                await client.query(query);
                console.log(`✅ Success: ${query}`);
            } catch (err) {
                console.log(`⚠️  Warning (might not exist): ${query} - ${err.message}`);
            }
        }

        console.log('🎉 Finished removing cross-db constraints.');
    } catch (error) {
        console.error('❌ Critical Error:', error);
    } finally {
        client.release();
        process.exit();
    }
}

removeConstraints();
