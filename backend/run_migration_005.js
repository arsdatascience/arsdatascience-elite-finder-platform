const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Iniciando migração 005...');

        const migrationPath = path.join(__dirname, 'migrations', '005_normalize_agent_configs.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        await client.query('BEGIN');
        await client.query(migrationSql);
        await client.query('COMMIT');

        console.log('Migração 005 concluída com sucesso!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro na migração:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
