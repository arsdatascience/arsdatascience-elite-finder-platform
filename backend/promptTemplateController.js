const pool = require('./database');

const createTemplate = async (req, res) => {
    try {
        const { name, description, prompt, negativePrompt, category, isPublic } = req.body;
        const userId = req.user.id;

        if (!name || !prompt || !category) {
            return res.status(400).json({ error: 'Nome, prompt e categoria são obrigatórios.' });
        }

        const result = await pool.query(
            `INSERT INTO prompt_templates (user_id, name, description, prompt, negative_prompt, category, is_public)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [userId, name, description, prompt, negativePrompt, category, isPublic || false]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar template:', error);
        res.status(500).json({ error: 'Erro interno ao criar template.' });
    }
};

const listTemplates = async (req, res) => {
    try {
        const userId = req.user.id;
        // Retorna templates do usuário OU templates públicos (se houver sistema de compartilhamento futuro)
        // Por enquanto, apenas do usuário
        const result = await pool.query(
            `SELECT * FROM prompt_templates WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar templates:', error);
        res.status(500).json({ error: 'Erro interno ao listar templates.' });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `DELETE FROM prompt_templates WHERE id = $1 AND user_id = $2 RETURNING id`,
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Template não encontrado ou sem permissão.' });
        }

        res.json({ success: true, id });
    } catch (error) {
        console.error('Erro ao deletar template:', error);
        res.status(500).json({ error: 'Erro interno ao deletar template.' });
    }
};

module.exports = {
    createTemplate,
    listTemplates,
    deleteTemplate
};
