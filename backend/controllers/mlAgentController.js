/**
 * ML Agent Controller
 * Handles API endpoints for ML analysis
 */

const mlIntentDetector = require('../services/mlIntentDetector');
const mlAnalysisService = require('../services/mlAnalysisService');
const mlResponseFormatter = require('../services/mlResponseFormatter');
const db = require('../database');

/**
 * Analyze a natural language message and return ML insights
 * POST /api/ml-agent/analyze
 */
const analyze = async (req, res) => {
    try {
        const { message, clientId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Use clientId from request or from authenticated user
        const targetClientId = clientId || req.user?.client_id || req.user?.id;

        if (!targetClientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        // 1. Detect intent
        const intentResult = mlIntentDetector.detectIntent(message);

        if (!intentResult.matched) {
            return res.json({
                success: false,
                message: 'Não consegui identificar uma análise específica na sua mensagem.',
                suggestions: [
                    'Quanto vou vender no próximo mês?',
                    'Como está meu Instagram?',
                    'Me dá um resumo geral',
                    'Por que minhas vendas caíram?'
                ]
            });
        }

        // 2. Extract parameters
        const params = mlIntentDetector.extractParameters(message, intentResult.intent);

        // 3. Get client name
        const clientResult = await db.query(
            'SELECT name FROM clients WHERE id = $1',
            [targetClientId]
        );
        const clientName = clientResult.rows[0]?.name || 'Cliente';

        // 4. Execute analysis based on intent
        let result;
        let formattedResponse;

        switch (intentResult.intent) {
            case 'sales_forecast':
                result = await mlAnalysisService.salesForecast(targetClientId, params);
                formattedResponse = mlResponseFormatter.formatSalesForecast(result, clientName);
                break;

            case 'instagram_analysis':
                result = await mlAnalysisService.instagramAnalysis(targetClientId, params);
                formattedResponse = mlResponseFormatter.formatInstagramAnalysis(result, clientName);
                break;

            case 'tiktok_analysis':
                result = await mlAnalysisService.tiktokAnalysis(targetClientId, params);
                formattedResponse = mlResponseFormatter.formatTiktokAnalysis(result, clientName);
                break;

            case 'anomaly_detection':
                result = await mlAnalysisService.anomalyDetection(targetClientId, params);
                formattedResponse = mlResponseFormatter.formatAnomalyDetection(result, clientName);
                break;

            case 'dashboard_summary':
                result = await mlAnalysisService.dashboardSummary(targetClientId);
                formattedResponse = mlResponseFormatter.formatDashboardSummary(result, clientName);
                break;

            case 'marketing_roi':
                result = await mlAnalysisService.marketingROI(targetClientId, params);
                formattedResponse = mlResponseFormatter.formatMarketingROI(result, clientName);
                break;

            case 'customer_segmentation':
                result = await mlAnalysisService.customerSegmentation(targetClientId);
                formattedResponse = mlResponseFormatter.formatCustomerSegmentation(result, clientName);
                break;

            case 'churn_prediction':
                result = await mlAnalysisService.churnPrediction(targetClientId, params);
                formattedResponse = mlResponseFormatter.formatChurnPrediction(result, clientName);
                break;

            default:
                formattedResponse = mlResponseFormatter.formatUnsupportedIntent(intentResult.intent);
                result = { success: false };
        }

        res.json({
            success: true,
            intent: intentResult.intent,
            intentDescription: mlIntentDetector.getIntentDescription(intentResult.intent),
            confidence: intentResult.confidence,
            parameters: params,
            response: formattedResponse,
            data: result,
            clientName
        });

    } catch (error) {
        console.error('ML Agent analyze error:', error);

        const errorResponse = mlResponseFormatter.formatError(error, 'unknown');

        res.status(500).json({
            success: false,
            error: error.message,
            response: errorResponse
        });
    }
};

/**
 * Get analysis history for a client
 * GET /api/ml-agent/history
 */
const getHistory = async (req, res) => {
    try {
        const clientId = req.query.clientId || req.user?.client_id || req.user?.id;
        const limit = parseInt(req.query.limit) || 20;

        const result = await db.opsQuery(`
      SELECT * FROM ml_sales_analytics 
      WHERE client_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [clientId, limit]);

        res.json({
            success: true,
            analyses: result.rows
        });

    } catch (error) {
        console.error('ML Agent history error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Test ML Service connection
 * GET /api/ml-agent/health
 */
const checkHealth = async (req, res) => {
    try {
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'https://arsanalytics.aiiam.com.br';
        const axios = require('axios');

        const response = await axios.get(`${mlServiceUrl}/health`, {
            timeout: 5000,
            headers: {
                'X-API-Key': process.env.ML_API_KEY
            }
        });

        res.json({
            success: true,
            mlService: {
                url: mlServiceUrl,
                status: response.data?.status || 'ok',
                timestamp: new Date()
            },
            backend: {
                status: 'ok',
                mlAgentEnabled: process.env.ENABLE_ML_AGENT === 'true'
            }
        });

    } catch (error) {
        res.json({
            success: false,
            mlService: {
                url: process.env.ML_SERVICE_URL,
                status: 'unreachable',
                error: error.message
            },
            backend: {
                status: 'ok',
                mlAgentEnabled: process.env.ENABLE_ML_AGENT === 'true'
            }
        });
    }
};

/**
 * Test intent detection
 * POST /api/ml-agent/test-intent
 */
const testIntent = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const intentResult = mlIntentDetector.detectIntent(message);
        const params = intentResult.matched
            ? mlIntentDetector.extractParameters(message, intentResult.intent)
            : {};

        res.json({
            message,
            ...intentResult,
            parameters: params,
            description: intentResult.matched
                ? mlIntentDetector.getIntentDescription(intentResult.intent)
                : null
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get available ML analysis types
 * GET /api/ml-agent/types
 */
const getAnalysisTypes = async (req, res) => {
    res.json({
        success: true,
        types: [
            { id: 'sales_forecast', name: 'Previsão de Vendas', description: 'Prevê vendas futuras usando XGBoost' },
            { id: 'instagram_analysis', name: 'Análise de Instagram', description: 'Métricas de performance do Instagram' },
            { id: 'tiktok_analysis', name: 'Análise de TikTok', description: 'Métricas de performance do TikTok' },
            { id: 'anomaly_detection', name: 'Detecção de Anomalias', description: 'Identifica padrões anormais nos dados' },
            { id: 'dashboard_summary', name: 'Resumo Executivo', description: 'Visão geral das métricas principais' },
            { id: 'marketing_roi', name: 'ROI de Marketing', description: 'Retorno sobre investimento em marketing' },
            { id: 'customer_segmentation', name: 'Segmentação de Clientes', description: 'Agrupa clientes por comportamento' },
            { id: 'churn_prediction', name: 'Predição de Churn', description: 'Identifica clientes em risco de cancelar' }
        ]
    });
};

module.exports = {
    analyze,
    getHistory,
    checkHealth,
    testIntent,
    getAnalysisTypes
};
