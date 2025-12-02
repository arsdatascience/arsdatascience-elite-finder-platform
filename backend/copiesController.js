const express = require('express');
const router = express.Router();
const db = require('./db');
const authenticateToken = require('./middleware/auth');

// Salvar uma nova copy
router.post('/', authenticateToken, async (req, res) => {
    const { topic, platform, tone, content } = req.body;
    const userId = req.user.id;

    try {
        const result = await db.query(
            'INSERT INTO saved_copies (user_id, topic, platform, tone, content) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, topic, platform, tone, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao salvar copy:', error);
        res.status(500).json({ error: 'Erro ao salvar copy' });
    }
});

// Listar histórico de copys do usuário
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.query(
            'SELECT * FROM saved_copies WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar copys:', error);
        res.status(500).json({ error: 'Erro ao listar histórico' });
    }
});

// Deletar uma copy
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        await db.query('DELETE FROM saved_copies WHERE id = $1 AND user_id = $2', [id, userId]);
        res.json({ message: 'Copy deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar copy:', error);
        res.status(500).json({ error: 'Erro ao deletar copy' });
    }
});

module.exports = router;
