const axios = require('axios');
const n8nLogger = require('../utils/n8nLogger');
const { n8nMetrics } = require('../metrics/n8nMetrics'); // Será criado a seguir

// Configurações do n8n via Variáveis de Ambiente
const N8N_CONFIG = {
    baseUrl: process.env.N8N_WEBHOOK_URL || 'https://webhookn8n.aiiam.com.br',
    apiKey: process.env.N8N_WEBHOOK_API_KEY,
    maxRetries: parseInt(process.env.N8N_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.N8N_RETRY_DELAY || '1000'),
    timeout: parseInt(process.env.N8N_DEFAULT_TIMEOUT || '30000')
};

// Mapeamento de Eventos
const WEBHOOK_PATHS = {
    'USER_CREATED': '/webhook/user-created',
    'CAMPAIGN_CREATED': '/webhook/campaign-created',
    'LEAD_GENERATED': '/webhook/lead-generated'
};

const WebhookService = {
    async trigger(eventName, payload) {
        const path = WEBHOOK_PATHS[eventName];

        if (!path) {
            n8nLogger.warn(`Evento não mapeado: ${eventName}`);
            return;
        }

        const baseUrl = N8N_CONFIG.baseUrl.replace(/\/$/, '');
        const endpoint = path.startsWith('/') ? path : `/${path}`;
        const url = `${baseUrl}${endpoint}`;

        n8nLogger.info(`Iniciando disparo de webhook`, { event: eventName, url });

        const headers = {
            'Content-Type': 'application/json',
            'X-Elite-Source': 'backend',
            'X-Timestamp': new Date().toISOString()
        };

        if (N8N_CONFIG.apiKey) {
            headers['X-N8N-API-KEY'] = N8N_CONFIG.apiKey;
        }

        // Fire-and-forget com tratamento de erro em background
        this._sendWithRetry(url, eventName, payload, headers).catch(err => {
            n8nLogger.error(`Erro crítico não tratado no envio do webhook`, { error: err.message, event: eventName });
        });
    },

    async _sendWithRetry(url, eventName, payload, headers) {
        let attempt = 0;
        let success = false;

        while (attempt < N8N_CONFIG.maxRetries && !success) {
            const endTimer = n8nMetrics ? n8nMetrics.webhookDuration.startTimer({ event: eventName }) : () => { };

            try {
                attempt++;

                await axios.post(url, {
                    event: eventName,
                    timestamp: new Date().toISOString(),
                    data: payload
                }, {
                    timeout: N8N_CONFIG.timeout,
                    headers: headers
                });

                endTimer(); // Registra duração no Prometheus
                if (n8nMetrics) n8nMetrics.webhookCalls.inc({ event: eventName, status: 'success' });

                n8nLogger.info(`Webhook enviado com sucesso`, {
                    event: eventName,
                    attempt
                });
                success = true;

            } catch (err) {
                if (n8nMetrics) n8nMetrics.webhookCalls.inc({ event: eventName, status: 'error' });

                n8nLogger.warn(`Falha no envio do webhook`, {
                    event: eventName,
                    attempt,
                    error: err.message
                });

                if (attempt < N8N_CONFIG.maxRetries) {
                    if (n8nMetrics) n8nMetrics.retryAttempts.inc({ event: eventName });

                    // Exponential Backoff com Jitter
                    const baseDelay = N8N_CONFIG.retryDelay * Math.pow(2, attempt - 1);
                    const jitter = Math.random() * 0.2 * baseDelay; // 0-20% jitter
                    const delay = baseDelay + jitter;

                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        if (!success) {
            n8nLogger.error(`Falha permanente no webhook após ${N8N_CONFIG.maxRetries} tentativas`, { event: eventName });
            // Futuro: Enviar para Dead Letter Queue (DLQ)
        }
    }
};

module.exports = WebhookService;
