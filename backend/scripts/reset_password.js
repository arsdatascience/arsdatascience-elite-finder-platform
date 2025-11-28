const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Conexão direta com o banco Railway fornecido
const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Necessário para conexões externas seguras
});

const USER_ID = 76;
const NEW_PASSWORD = 'Elite@2025';

async function resetPassword() {
    try {
        console.log(`🔄 Conectando ao Railway...`);
        console.log(`🔄 Resetando senha para o usuário ID: ${USER_ID}`);

        // 1. Check if user exists (using table "user" singular)
        const userRes = await pool.query('SELECT * FROM "user" WHERE id = $1', [USER_ID]);

        if (userRes.rows.length === 0) {
            console.log('❌ Usuário ID 76 não encontrado na tabela "user".');
            process.exit(1);
        }

        const currentUser = userRes.rows[0];
        console.log(`✅ Usuário encontrado: ${currentUser.email || currentUser.name}`);

        // 2. Update password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(NEW_PASSWORD, salt);

        await pool.query('UPDATE "user" SET password_hash = $1 WHERE id = $2', [hash, USER_ID]);

        console.log(`✅ Senha atualizada com sucesso para: ${NEW_PASSWORD}`);
        console.log(`📧 Email do usuário: ${currentUser.email}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao resetar senha:', error);
        process.exit(1);
    }
}

resetPassword();
