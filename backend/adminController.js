const db = require('./database');

const cleanupDatabase = async (req, res) => {
    try {
        console.log('Iniciando limpeza do banco de dados...');

        // 1. Limpar dependências de clientes com ID > 3 (caso CASCADE falhe)
        console.log('Removendo dependências...');
        await db.query('DELETE FROM campaigns WHERE client_id > 3');
        await db.query('DELETE FROM leads WHERE client_id > 3');
        await db.query('DELETE FROM social_posts WHERE client_id > 3');
        await db.query('DELETE FROM kpis WHERE client_id > 3');
        await db.query('DELETE FROM device_stats WHERE client_id > 3');

        // 2. Manter apenas clientes ID 1, 2, 3
        console.log('Removendo clientes duplicados/extras...');
        const deleteResult = await db.query('DELETE FROM clients WHERE id > 3');
        console.log(`Clientes removidos: ${deleteResult.rowCount}`);

        // 3. Deduplicação extra (caso IDs 1, 2, 3 também estejam duplicados ou fora de ordem)
        // Manter apenas o menor ID para cada nome
        await db.query(`
            DELETE FROM clients a USING clients b
            WHERE a.id > b.id AND a.name = b.name
        `);

        // 4. Resetar sequência de users
        const userCheck = await db.query('SELECT id FROM users ORDER BY id DESC LIMIT 1');
        if (userCheck.rows.length > 0) {
            await db.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
        }

        // 5. Resetar sequência de clients também
        await db.query(`SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients))`);

        res.json({
            success: true,
            message: `Limpeza concluída. ${deleteResult.rowCount} clientes removidos. Sequências ajustadas.`
        });

    } catch (error) {
        console.error('Erro na limpeza:', error);
        res.status(500).json({ error: 'Erro ao limpar banco: ' + error.message });
    }
};

const getSystemUsage = async (req, res) => {
    try {
        // Uso por Tenant (Total de Posts)
        const tenantsUsage = await db.query(`
            SELECT t.id, t.name, COUNT(sp.id) as total_posts
            FROM tenants t
            LEFT JOIN users u ON u.tenant_id = t.id
            LEFT JOIN social_posts sp ON sp.user_id = u.id
            GROUP BY t.id, t.name
            ORDER BY total_posts DESC
        `);

        // Uso por Usuário (Top 10)
        const usersUsage = await db.query(`
            SELECT u.id, u.name, t.name as tenant_name, COUNT(sp.id) as total_posts
            FROM users u
            LEFT JOIN tenants t ON u.tenant_id = t.id
            LEFT JOIN social_posts sp ON sp.user_id = u.id
            GROUP BY u.id, u.name, t.name
            ORDER BY total_posts DESC
            LIMIT 10
        `);

        res.json({
            tenants: tenantsUsage.rows,
            users: usersUsage.rows
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas do sistema:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
};

module.exports = {
    cleanupDatabase,
    getSystemUsage
};
