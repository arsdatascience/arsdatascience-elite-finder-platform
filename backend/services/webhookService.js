const axios = require('axios');

// Configurações do n8n via Variáveis de Ambiente
const N8N_CONFIG = {
    baseUrl: process.env.N8N_WEBHOOK_URL || 'https://webhookn8n.aiiam.com.br',
    apiKey: process.env.N8N_WEBHOOK_API_KEY,
    maxRetries: parseInt(process.env.N8N_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.N8N_RETRY_DELAY || '1000'),
    timeout: parseInt(process.env.N8N_DEFAULT_TIMEOUT || '30000')
};

// Mapeamento de Eventos para Endpoints (Paths)
// Certifique-se de que estes endpoints existam nos seus workflows do n8n (Webhook Node)
const WEBHOOK_PATHS = {
    'USER_CREATED': '/webhook/user-created',
    'CAMPAIGN_CREATED': '/webhook/campaign-created',
    'LEAD_GENERATED': '/webhook/lead-generated'
};

const WebhookService = {
    /**
     * Dispara um evento para o n8n com retries e autenticação
     * @param {string} eventName - Nome do evento
     * @param {object} payload - Dados do evento
     */
    async trigger(eventName, payload) {
        const path = WEBHOOK_PATHS[eventName];

        if (!path) {
            console.warn(`[Webhook] Evento não mapeado: ${eventName}`);
            return;
        }

        // Remove barra duplicada se houver
        const baseUrl = N8N_CONFIG.baseUrl.replace(/\/$/, '');
        const endpoint = path.startsWith('/') ? path : `/${path}`;
        const url = `${baseUrl}${endpoint}`;

        console.log(`[Webhook] Disparando ${eventName} para ${url}...`);

        const headers = {
            'Content-Type': 'application/json',
            'X-Elite-Source': 'backend',
            'X-Timestamp': new Date().toISOString()
        };

        // Adiciona autenticação se configurada
        if (N8N_CONFIG.apiKey) {
            headers['X-N8N-API-KEY'] = N8N_CONFIG.apiKey;
        }

        // Executa de forma assíncrona (fire-and-forget do ponto de vista do controller)
        // mas mantemos a Promise interna para logar o resultado
        this._sendWithRetry(url, eventName, payload, headers).catch(err => {
            console.error(`[Webhook] Erro não tratado no envio: ${err.message}`);
        });
    },

    async _sendWithRetry(url, eventName, payload, headers) {
        let attempt = 0;
        let success = false;

        while (attempt < N8N_CONFIG.maxRetries && !success) {
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

                console.log(`[Webhook] Sucesso: ${eventName} (Tentativa ${attempt})`);
                success = true;

            } catch (err) {
                console.error(`[Webhook] Falha na tentativa ${attempt} para ${eventName}: ${err.message}`);

                if (attempt < N8N_CONFIG.maxRetries) {
                    // Backoff exponencial simples (1s, 2s, 3s...)
                    const delay = N8N_CONFIG.retryDelay * attempt;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        if (!success) {
            console.error(`[Webhook] Erro permanente ao enviar ${eventName} após ${N8N_CONFIG.maxRetries} tentativas.`);
        }
    }
};

module.exports = WebhookService;
