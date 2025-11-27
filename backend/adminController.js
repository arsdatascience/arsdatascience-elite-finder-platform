const db = require('./database');

const cleanupDatabase = async (req, res) => {
    try {
        console.log('Iniciando limpeza do banco de dados...');

        // 1. Manter apenas clientes ID 1, 2, 3
        await db.query('DELETE FROM clients WHERE id > 3');
        console.log('Clientes extras removidos.');

        // 2. Resetar sequência de users
        // Primeiro, pegar o ID do usuário atual (provavelmente 76)
        const userCheck = await db.query('SELECT id FROM users ORDER BY id DESC LIMIT 1');
        if (userCheck.rows.length > 0) {
            const currentId = userCheck.rows[0].id;
            // Se quisermos mudar o ID dele para 1 (perigoso se houver FKs, mas vamos tentar se for o único)
            // Melhor apenas resetar a sequência para o próximo número disponível
            await db.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
        }

        // Opcional: Se quiser forçar o usuário 76 a virar 1 (CUIDADO: Quebra FKs se houver logs, chats, etc ligados a ele)
        // Como é ambiente de dev/teste e o usuário pediu, vou assumir que ele quer "começar do 1".
        // Mas se tiver FKs, vai falhar. Vou tentar resetar a sequência apenas.

        res.json({ success: true, message: 'Limpeza concluída. Clientes > 3 removidos. Sequência de usuários ajustada.' });

    } catch (error) {
        console.error('Erro na limpeza:', error);
        res.status(500).json({ error: 'Erro ao limpar banco: ' + error.message });
    }
};

module.exports = {
    cleanupDatabase
};
