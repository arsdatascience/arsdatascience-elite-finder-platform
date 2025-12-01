const db = require('./db');

const getAllPlans = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM plans ORDER BY price ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar planos:', error);
        res.status(500).json({ error: 'Erro ao buscar planos' });
    }
};

const getPlanById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM plans WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Plano não encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePlan = async (req, res) => {
    const { id } = req.params;
    const { name, price, limits, features } = req.body;

    // Validar JSON de limits e features se necessário

    try {
        const result = await db.query(
            'UPDATE plans SET name = $1, price = $2, limits = $3, features = $4 WHERE id = $5 RETURNING *',
            [name, price, limits, features, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Plano não encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar plano:', error);
        res.status(500).json({ error: 'Erro ao atualizar plano' });
    }
};

const createPlan = async (req, res) => {
    const { name, price, limits, features } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO plans (name, price, limits, features) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, price, limits || {}, features || []]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar plano:', error);
        res.status(500).json({ error: 'Erro ao criar plano' });
    }
};

const deletePlan = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar se há usuários usando o plano antes de deletar?
        // Por simplicidade, vamos permitir deletar, mas o banco pode reclamar de FK se não tiver cascade.
        // Idealmente, faríamos soft delete.
        await db.query('DELETE FROM plans WHERE id = $1', [id]);
        res.json({ message: 'Plano removido com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllPlans, getPlanById, updatePlan, createPlan, deletePlan };
