const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Tenta conectar no banco padrão 'postgres' para listar outros bancos
const connectionString = 'postgresql://postgres:postgres@localhost:5432/postgres';

const client = new Client({
    connectionString: process.env.DATABASE_URL || connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function check() {
    try {
        await client.connect();
        console.log('✅ Conectado ao banco:', client.database);

        // Listar tabelas no banco atual
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('📋 Tabelas no banco atual:', res.rows.map(r => r.table_name).join(', ') || 'Nenhuma');

        // Listar todos os bancos de dados
        const dbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false");
        console.log('\n🗄️ Bancos de dados disponíveis no servidor:');
        dbs.rows.forEach(row => console.log(` - ${row.datname}`));

        await client.end();
    } catch (err) {
        console.error('❌ Erro de conexão:', err.message);
        if (err.message.includes('password authentication failed')) {
            console.log('💡 Dica: Verifique se a senha do banco no arquivo .env está correta.');
        }
    }
}

check();
