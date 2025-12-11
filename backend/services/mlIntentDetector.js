/**
 * ML Intent Detector Service
 * Detects ML/Analytics intents from natural language messages
 */

const intentPatterns = {
    sales_forecast: [
        /quanto.*vou.*vender/i,
        /previs[ãa]o.*venda/i,
        /vendas.*pr[óo]ximo/i,
        /faturamento.*futuro/i,
        /meta.*venda/i,
        /projeção.*vendas/i,
        /estimar.*vendas/i
    ],

    churn_prediction: [
        /risco.*churn/i,
        /clientes.*risco/i,
        /quem.*vai.*cancelar/i,
        /clientes.*perdendo/i,
        /risco.*perda/i,
        /prever.*cancelamento/i,
        /taxa.*churn/i
    ],

    instagram_analysis: [
        /como.*est[áa].*instagram/i,
        /performance.*insta/i,
        /an[áa]lise.*instagram/i,
        /instagram.*indo/i,
        /m[ée]tricas.*instagram/i,
        /dados.*instagram/i,
        /insta.*crescendo/i
    ],

    tiktok_analysis: [
        /como.*est[áa].*tiktok/i,
        /performance.*tiktok/i,
        /an[áa]lise.*tiktok/i,
        /tiktok.*indo/i,
        /m[ée]tricas.*tiktok/i,
        /videos.*tiktok/i
    ],

    marketing_roi: [
        /roi.*marketing/i,
        /retorno.*marketing/i,
        /performance.*ads/i,
        /investimento.*marketing/i,
        /custo.*aquisi[çc][ãa]o/i,
        /cac/i,
        /ltv/i,
        /retorno.*investimento/i
    ],

    anomaly_detection: [
        /por.*que.*caiu/i,
        /o.*que.*aconteceu/i,
        /problema.*em/i,
        /queda.*em/i,
        /anomalia/i,
        /algo.*errado/i,
        /vendas.*cairam/i,
        /performance.*ruim/i
    ],

    customer_segmentation: [
        /segmenta[çc][ãa]o/i,
        /tipos.*cliente/i,
        /perfis.*cliente/i,
        /clusters/i,
        /segmentar/i,
        /grupos.*cliente/i
    ],

    dashboard_summary: [
        /resumo/i,
        /relat[óo]rio/i,
        /dashboard/i,
        /vis[ãa]o.*geral/i,
        /panorama/i,
        /como.*estou/i,
        /situa[çc][ãa]o.*atual/i,
        /me.*atualiza/i
    ]
};

class MLIntentDetector {
    /**
     * Detecta intenção ML na mensagem
     * @param {string} message - Mensagem do usuário
     * @returns {Object} { intent, confidence, matched }
     */
    detectIntent(message) {
        if (!message || typeof message !== 'string') {
            return { intent: null, confidence: 0, matched: false };
        }

        const lowerMessage = message.toLowerCase();

        for (const [intent, patterns] of Object.entries(intentPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(lowerMessage)) {
                    return {
                        intent,
                        confidence: 0.9,
                        matched: true,
                        pattern: pattern.toString()
                    };
                }
            }
        }

        return {
            intent: null,
            confidence: 0,
            matched: false
        };
    }

    /**
     * Extrai parâmetros da mensagem
     * @param {string} message - Mensagem do usuário
     * @param {string} intent - Intenção detectada
     * @returns {Object} Parâmetros extraídos
     */
    extractParameters(message, intent) {
        const params = {};

        // Extrair timeframe futuro
        if (/pr[óo]ximo.*(\d+).*dia/i.test(message)) {
            const match = message.match(/(\d+).*dia/i);
            params.days = parseInt(match[1]);
        } else if (/pr[óo]ximo.*m[êe]s/i.test(message)) {
            params.days = 30;
        } else if (/pr[óo]xima.*semana/i.test(message)) {
            params.days = 7;
        } else if (/pr[óo]ximo.*trimestre/i.test(message)) {
            params.days = 90;
        }

        // Extrair período histórico
        if (/[úu]ltimo.*(\d+).*dia/i.test(message)) {
            const match = message.match(/(\d+).*dia/i);
            params.historyDays = parseInt(match[1]);
        } else if (/[úu]ltim[ao].*semana/i.test(message)) {
            params.historyDays = 7;
        } else if (/[úu]ltimo.*m[êe]s/i.test(message)) {
            params.historyDays = 30;
        }

        // Parâmetros padrão baseados na intent
        if (!params.days) {
            switch (intent) {
                case 'sales_forecast':
                    params.days = 30;
                    break;
                case 'instagram_analysis':
                case 'tiktok_analysis':
                    params.period = 7;
                    break;
                case 'dashboard_summary':
                    params.period = 7;
                    break;
                case 'anomaly_detection':
                    params.days = 30;
                    break;
            }
        }

        return params;
    }

    /**
     * Verifica se mensagem é sobre ML
     * @param {string} message - Mensagem do usuário
     * @returns {boolean}
     */
    isMLIntent(message) {
        return this.detectIntent(message).matched;
    }

    /**
     * Retorna descrição do intent para logging
     * @param {string} intent - Nome do intent
     * @returns {string}
     */
    getIntentDescription(intent) {
        const descriptions = {
            sales_forecast: 'Previsão de Vendas',
            churn_prediction: 'Predição de Churn',
            instagram_analysis: 'Análise de Instagram',
            tiktok_analysis: 'Análise de TikTok',
            marketing_roi: 'ROI de Marketing',
            anomaly_detection: 'Detecção de Anomalias',
            customer_segmentation: 'Segmentação de Clientes',
            dashboard_summary: 'Resumo do Dashboard'
        };
        return descriptions[intent] || intent;
    }
}

module.exports = new MLIntentDetector();
