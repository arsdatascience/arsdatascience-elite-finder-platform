const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/.env' }); // Ajuste o path se necessário

// Fallback para DATABASE_URL se não estiver no .env local (ex: rodando da raiz)
const connectionString = process.env.DATABASE_PUBLIC_URL || "postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway";

const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'backend', 'migrations', '014_create_generated_images.sql');
        console.log(`Lendo migração de: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executando migração...');
        await pool.query(sql);
        console.log('Migração concluída com sucesso!');
    } catch (error) {
        console.error('Erro na migração:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
