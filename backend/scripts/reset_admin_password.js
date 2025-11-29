const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

// Tenta pegar do env, senão usa a string do Railway (se você tiver ela fácil, senão o usuário terá que rodar onde tem o env)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ ERRO: DATABASE_URL não definida no .env ou ambiente.');
    console.log('Certifique-se de rodar este script onde as variáveis de ambiente do Railway estão carregadas.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Necessário para Railway
});

const EMAIL = 'denismay@arsdatascience.com.br';
const NEW_PASSWORD = 'Elite@2025';

async function resetPassword() {
    try {
        console.log(`🔄 Conectando ao banco para resetar senha de: ${EMAIL}`);

        // 1. Gerar Hash
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(NEW_PASSWORD, salt);

        // 2. Verificar se usuário existe
        const checkRes = await pool.query('SELECT id FROM users WHERE email = $1', [EMAIL]);

        if (checkRes.rows.length > 0) {
            // Atualizar
            await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, EMAIL]);
            console.log(`✅ Senha ATUALIZADA com sucesso para ${EMAIL}`);
        } else {
            // Criar
            console.log(`⚠️ Usuário não encontrado. Criando novo admin...`);
            await pool.query(
                `INSERT INTO users (name, email, password_hash, role, created_at) 
                 VALUES ($1, $2, $3, 'admin', NOW())`,
                ['Denis May', EMAIL, passwordHash]
            );
            console.log(`✅ Usuário CRIADO com sucesso: ${EMAIL}`);
        }

        console.log(`🔑 Nova senha: ${NEW_PASSWORD}`);

    } catch (err) {
        console.error('❌ Erro ao resetar senha:', err);
    } finally {
        await pool.end();
    }
}

resetPassword();
