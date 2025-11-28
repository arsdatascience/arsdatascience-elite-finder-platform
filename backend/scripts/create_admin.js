const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Conexão direta com o banco Railway
const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function createAdmin() {
    const userData = {
        username: 'denismay',
        email: 'denismay@arsdatascienci.com.br',
        password: 'C4rn31r0$425#',
        firstName: 'Denis',
        lastName: 'May',
        role: 'admin'
    };

    console.log(`👤 Gerenciando usuário admin: ${userData.username} (${userData.email})`);

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(userData.password, salt);
        const fullName = `${userData.firstName} ${userData.lastName}`;

        // Tenta inserir na tabela 'users'
        try {
            console.log('Tentando tabela "users"...');
            const query = `
                INSERT INTO users (
                    username, first_name, last_name, email, 
                    password_hash, role, status, name, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW(), NOW())
                RETURNING id, username, email, role;
            `;
            const result = await pool.query(query, [
                userData.username, userData.firstName, userData.lastName,
                userData.email, passwordHash, userData.role, fullName
            ]);
            console.log('✅ Usuário Admin criado na tabela "users"!');
            console.log(result.rows[0]);
            return;
        } catch (err) {
            console.log('⚠️ Falha no INSERT em "users":', err.message);

            if (err.message.includes('duplicate key')) {
                console.log('🔄 Usuário já existe. Atualizando senha e permissões...');
                const updateQuery = `
                    UPDATE users 
                    SET password_hash = $1, role = $2, updated_at = NOW()
                    WHERE username = $3 OR email = $4
                    RETURNING id, username, email, role;
                `;
                const updateResult = await pool.query(updateQuery, [
                    passwordHash, userData.role, userData.username, userData.email
                ]);
                console.log('✅ Usuário atualizado com sucesso!');
                console.log(updateResult.rows[0]);
                return;
            }
        }

    } catch (error) {
        console.error('❌ Erro geral:', error);
    } finally {
        pool.end();
    }
}

createAdmin();
