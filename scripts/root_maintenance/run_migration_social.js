const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// String de conexão do usuário
const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    try {
        console.log('Conectando ao banco de dados...');
        const client = await pool.connect();
        console.log('Conectado!');

        const sqlPath = path.join(__dirname, 'backend', 'migrations', '013_create_social_posts.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executando migração social_posts...');
        await client.query(sql);
        console.log('Migração concluída com sucesso!');

        client.release();
    } catch (err) {
        console.error('Erro ao executar migração:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
