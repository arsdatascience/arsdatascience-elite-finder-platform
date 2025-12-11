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

const { jobsQueue } = require('./queueClient');

const getQueueStatus = async (req, res) => {
    try {
        if (!jobsQueue) {
            return res.json({
                success: true,
                stats: { pending: 0, processing: 0, completed: 0, failed: 0 },
                recentFailures: [],
                status: 'Queue not initialized'
            });
        }

        // Get Real Counts from BullMQ
        const counts = await jobsQueue.getJobCounts('wait', 'active', 'completed', 'failed');

        // Get Recent Failures (last 5)
        const failedJobs = await jobsQueue.getFailed(0, 4);
        const recentFailures = failedJobs.map(job => ({
            id: job.id,
            reason: job.failedReason,
            timestamp: job.finishedOn,
            name: job.name,
            data: job.data
        }));

        res.json({
            success: true,
            stats: {
                pending: counts.wait,
                processing: counts.active,
                completed: counts.completed,
                failed: counts.failed
            },
            recentFailures
        });
    } catch (error) {
        console.error('Erro ao buscar status da fila:', error);
        res.status(500).json({ error: 'Erro ao buscar status da fila' });
    }
};

const getTenants = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, p.name as plan_name, COUNT(u.id) as user_count 
            FROM tenants t
            LEFT JOIN plans p ON t.plan_id = p.id
            LEFT JOIN users u ON u.tenant_id = t.id
            GROUP BY t.id, p.name
            ORDER BY t.id ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar tenants:', error);
        res.status(500).json({ error: 'Erro ao buscar tenants' });
    }
};

const createTenant = async (req, res) => {
    const { name, cnpj, email, phone, plan_id, address, adminUser } = req.body;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Create Tenant
        const tenantRes = await client.query(`
            INSERT INTO tenants (name, cnpj, email, phone, plan_id, address, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
            RETURNING id
        `, [name, cnpj, email, phone, plan_id, address]);

        const tenantId = tenantRes.rows[0].id;

        // 2. Create Admin User if provided
        if (adminUser && adminUser.email) {
            // Hash password (simplified for now, assumes bcrypt is available or store plain/placeholder)
            // Ideally import bcrypt
            const passwordHash = adminUser.password; // TODO: Hash this!

            await client.query(`
                INSERT INTO users (name, email, password_hash, role, tenant_id, status)
                VALUES ($1, $2, $3, 'admin', $4, 'active')
            `, [adminUser.name, adminUser.email, passwordHash, tenantId]);
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, id: tenantId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar tenant:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

const updateTenant = async (req, res) => {
    const { id } = req.params;
    const { name, cnpj, email, phone, plan_id, address, status } = req.body;

    try {
        await db.query(`
            UPDATE tenants 
            SET name = $1, cnpj = $2, email = $3, phone = $4, plan_id = $5, address = $6, status = COALESCE($7, status)
            WHERE id = $8
        `, [name, cnpj, email, phone, plan_id, address, status, id]);

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar tenant:', error);
        res.status(500).json({ error: 'Erro ao atualizar tenant' });
    }
};

const deleteTenant = async (req, res) => {
    const { id } = req.params;
    try {
        // Cascade delete handled by DB constraints usually, but let's be safe
        await db.query('DELETE FROM users WHERE tenant_id = $1', [id]);
        await db.query('DELETE FROM tenants WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir tenant:', error);
        res.status(500).json({ error: 'Erro ao excluir tenant' });
    }
};

const getPlans = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM plans ORDER BY price ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar planos:', error);
        res.status(500).json({ error: 'Erro ao buscar planos' });
    }
};

module.exports = {
    cleanupDatabase,
    getSystemUsage,
    getQueueStatus,
    getTenants,
    createTenant,
    updateTenant,
    deleteTenant,
    getPlans
};
