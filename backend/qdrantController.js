const express = require('express');
const router = express.Router();
const qdrantService = require('./services/qdrantService');

/**
 * GET /api/qdrant/test
 * Testa a conexão com o Qdrant
 */
router.get('/test', async (req, res) => {
    try {
        const result = await qdrantService.testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao testar conexão: ' + error.message
        });
    }
});

/**
 * GET /api/qdrant/collections
 * Lista todas as coleções disponíveis
 */
router.get('/collections', async (req, res) => {
    try {
        const result = await qdrantService.getCollections();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar coleções: ' + error.message,
            collections: []
        });
    }
});

/**
 * GET /api/qdrant/collections/:name
 * Obtém informações detalhadas de uma coleção
 */
router.get('/collections/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const result = await qdrantService.getCollectionInfo(name);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar informações da coleção: ' + error.message
        });
    }
});

/**
 * POST /api/qdrant/collections
 * Cria uma nova coleção
 * Body: { name, vectorSize, distance }
 */
router.post('/collections', async (req, res) => {
    try {
        const { name, vectorSize, distance } = req.body;

        if (!name || !vectorSize) {
            return res.status(400).json({
                success: false,
                error: 'Nome e tamanho do vetor são obrigatórios'
            });
        }

        const result = await qdrantService.createCollection(
            name,
            parseInt(vectorSize),
            distance || 'Cosine'
        );

        res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao criar coleção: ' + error.message
        });
    }
});

/**
 * DELETE /api/qdrant/collections/:name
 * Deleta uma coleção
 */
router.delete('/collections/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const result = await qdrantService.deleteCollection(name);

        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao deletar coleção: ' + error.message
        });
    }
});

/**
 * POST /api/qdrant/search
 * Busca vetores similares em uma coleção
 * Body: { collectionName, queryVector, limit, filter }
 */
router.post('/search', async (req, res) => {
    try {
        const { collectionName, queryVector, limit, filter } = req.body;

        if (!collectionName || !queryVector) {
            return res.status(400).json({
                success: false,
                error: 'Nome da coleção e vetor de busca são obrigatórios'
            });
        }

        const result = await qdrantService.searchVectors(
            collectionName,
            queryVector,
            limit || 5,
            filter
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar vetores: ' + error.message,
            results: []
        });
    }
});

/**
 * POST /api/qdrant/upsert
 * Adiciona ou atualiza pontos em uma coleção
 * Body: { collectionName, points: [{ id, vector, payload }] }
 */
router.post('/upsert', async (req, res) => {
    try {
        const { collectionName, points } = req.body;

        if (!collectionName || !points || !Array.isArray(points)) {
            return res.status(400).json({
                success: false,
                error: 'Nome da coleção e array de pontos são obrigatórios'
            });
        }

        const result = await qdrantService.upsertPoints(collectionName, points);

        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao adicionar pontos: ' + error.message
        });
    }
});

module.exports = router;
