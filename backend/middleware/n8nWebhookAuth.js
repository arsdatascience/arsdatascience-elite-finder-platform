const n8nLogger = require('../utils/n8nLogger');

const n8nWebhookAuth = (req, res, next) => {
    // Permite bypass se estiver em ambiente de teste local e sem chave configurada (opcional)
    if (process.env.NODE_ENV === 'development' && !process.env.N8N_WEBHOOK_API_KEY) {
        return next();
    }

    const apiKey = req.header('X-N8N-API-KEY');
    const validApiKey = process.env.N8N_WEBHOOK_API_KEY;

    if (!validApiKey) {
        n8nLogger.error('N8N_WEBHOOK_API_KEY not configured in environment');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiKey || apiKey !== validApiKey) {
        n8nLogger.warn('Invalid API Key attempt', {
            ip: req.ip,
            providedKey: apiKey ? '***' : 'none',
            path: req.path
        });
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    next();
};

module.exports = n8nWebhookAuth;
