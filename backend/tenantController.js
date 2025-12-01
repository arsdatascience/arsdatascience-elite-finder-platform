const db = require('./db');
const bcrypt = require('bcryptjs');

const getAllTenants = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, p.name as plan_name, 
            (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as user_count
            FROM tenants t
            LEFT JOIN plans p ON t.plan_id = p.id
            ORDER BY t.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar tenants:', error);
        res.status(500).json({ error: 'Erro ao buscar tenants' });
    }
};

const createTenant = async (req, res) => {
    const { name, cnpj, email, phone, address, plan_id, adminUser } = req.body;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Criar Tenant
        const tenantRes = await client.query(`
            INSERT INTO tenants (
                name, cnpj, email, phone, 
                address_street, address_number, address_complement, 
                address_district, address_city, address_state, address_zip, 
                plan_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
        `, [
            name, cnpj, email, phone,
            address?.street, address?.number, address?.complement,
            address?.district, address?.city, address?.state, address?.zip,
            plan_id || null
        ]);
        const tenantId = tenantRes.rows[0].id;

        // 2. Criar Admin User se fornecido
        if (adminUser) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(adminUser.password, salt);

            await client.query(`
                INSERT INTO users (name, email, password_hash, role, tenant_id)
                VALUES ($1, $2, $3, $4, $5)
            `, [adminUser.name, adminUser.email, hash, 'admin', tenantId]);
        }

        await client.query('COMMIT');
        res.json({ success: true, tenantId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar tenant:', error);
        if (error.code === '23505') return res.status(400).json({ error: 'CNPJ ou Email já cadastrado' });
        res.status(500).json({ error: 'Erro ao criar tenant' });
    } finally {
        client.release();
    }
};

const updateTenant = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address, plan_id, status } = req.body;

    try {
        await db.query(`
            UPDATE tenants SET 
            name=$1, email=$2, phone=$3, 
            address_street=$4, address_number=$5, address_complement=$6, 
            address_district=$7, address_city=$8, address_state=$9, address_zip=$10,
            plan_id=$11, status=$12, updated_at=NOW()
            WHERE id=$13
        `, [
            name, email, phone,
            address?.street, address?.number, address?.complement,
            address?.district, address?.city, address?.state, address?.zip,
            plan_id, status, id
        ]);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar tenant:', error);
        res.status(500).json({ error: 'Erro ao atualizar tenant' });
    }
};

const deleteTenant = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM tenants WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar tenant:', error);
        res.status(500).json({ error: 'Erro ao deletar tenant' });
    }
};

module.exports = { getAllTenants, createTenant, updateTenant, deleteTenant };
