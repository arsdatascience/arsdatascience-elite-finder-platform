const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/elite_finder_db';
const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const EMAIL = 'denismay@arsdatascience.com.br';
const PASSWORD = 'Elite@2025';

async function testLogin() {
    try {
        console.log(`🕵️ Testando login para: ${EMAIL}`);
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [EMAIL]);

        if (res.rows.length === 0) {
            console.log('❌ Usuário NÃO encontrado no banco.');
            process.exit(1);
        }

        const user = res.rows[0];
        console.log(`✅ Usuário encontrado. ID: ${user.id}, Role: ${user.role}`);
        console.log(`🔑 Hash no banco: ${user.password_hash.substring(0, 20)}...`);

        const isMatch = await bcrypt.compare(PASSWORD, user.password_hash);

        if (isMatch) {
            console.log('✅ SUCESSO! A senha corresponde ao hash.');
        } else {
            console.log('❌ FALHA! A senha NÃO corresponde ao hash.');

            // Tentar gerar novo hash e comparar na hora para ver se o bcrypt está consistente
            const newHash = await bcrypt.hash(PASSWORD, 10);
            console.log(`ℹ️ Novo hash gerado agora: ${newHash.substring(0, 20)}...`);
            const matchNew = await bcrypt.compare(PASSWORD, newHash);
            console.log(`ℹ️ Comparação com novo hash: ${matchNew ? 'OK' : 'FALHA'}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

testLogin();
