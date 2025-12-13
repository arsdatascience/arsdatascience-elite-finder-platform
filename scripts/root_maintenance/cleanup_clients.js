const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function cleanup() {
    try {
        console.log('🧹 Removendo clientes criados indevidamente...');

        // IDs identificados anteriormente: 223, 224, 225
        // Primeiro remove campanhas associadas
        await pool.query('DELETE FROM campaigns WHERE client_id IN (223, 224, 225)');

        // Depois remove os clientes
        await pool.query('DELETE FROM clients WHERE id IN (223, 224, 225)');

        console.log('✅ Clientes removidos.');

        // Verificar se Ana Maria Silva tem campanhas
        const res = await pool.query('SELECT count(*) FROM campaigns WHERE client_id = 3');
        console.log(`📊 Campanhas para Ana Maria Silva (ID 3): ${res.rows[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

cleanup();
