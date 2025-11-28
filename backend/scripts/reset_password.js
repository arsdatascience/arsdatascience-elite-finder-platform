const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

// Tenta carregar .env do diretório atual (backend)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Fallback connection string (tenta 'postgres' se 'elite_finder_db' falhar)
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const EMAIL = 'arsdatascience@gmail.com';
const NEW_PASSWORD = 'Elite@2025';

async function resetPassword() {
    try {
        console.log(`🔄 Resetando senha para: ${EMAIL}`);

        // 1. Check if user exists
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [EMAIL]);

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(NEW_PASSWORD, salt);

        if (userRes.rows.length === 0) {
            console.log('⚠️ Usuário não encontrado. Criando novo usuário admin...');
            await pool.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                ['Denis May', EMAIL, hash, 'admin']
            );
            console.log(`✅ Usuário criado!`);
        } else {
            await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, EMAIL]);
            console.log(`✅ Senha atualizada!`);
        }

        console.log(`\n🔐 Novas credenciais:`);
        console.log(`Email: ${EMAIL}`);
        console.log(`Senha: ${NEW_PASSWORD}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao resetar senha:', error);
        process.exit(1);
    }
}

resetPassword();
