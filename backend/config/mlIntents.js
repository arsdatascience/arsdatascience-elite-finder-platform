/**
 * ML Intents Configuration
 * Centralized configuration for ML intent patterns, parameters, and descriptions
 */

/**
 * Intent patterns for natural language detection
 * Each intent has an array of regex patterns that trigger it
 */
const intentPatterns = {
    sales_forecast: [
        /quanto.*vou.*vender/i,
        /previs[ãa]o.*venda/i,
        /vendas.*pr[óo]ximo/i,
        /faturamento.*futuro/i,
        /meta.*venda/i,
        /projeção.*vendas/i,
        /estimar.*vendas/i,
        /quanto.*vender/i,
        /previsão.*faturamento/i
    ],

    churn_prediction: [
        /risco.*churn/i,
        /clientes.*risco/i,
        /quem.*vai.*cancelar/i,
        /clientes.*perdendo/i,
        /risco.*perda/i,
        /prever.*cancelamento/i,
        /taxa.*churn/i,
        /cliente.*cancelar/i,
        /risco.*evas[ãa]o/i
    ],

    instagram_analysis: [
        /como.*est[áa].*instagram/i,
        /performance.*insta/i,
        /an[áa]lise.*instagram/i,
        /instagram.*indo/i,
        /m[ée]tricas.*instagram/i,
        /dados.*instagram/i,
        /insta.*crescendo/i,
        /relat[óo]rio.*instagram/i,
        /instagram.*hoj[eé]/i
    ],

    tiktok_analysis: [
        /como.*est[áa].*tiktok/i,
        /performance.*tiktok/i,
        /an[áa]lise.*tiktok/i,
        /tiktok.*indo/i,
        /m[ée]tricas.*tiktok/i,
        /videos.*tiktok/i,
        /relat[óo]rio.*tiktok/i
    ],

    marketing_roi: [
        /roi.*marketing/i,
        /retorno.*marketing/i,
        /performance.*ads/i,
        /investimento.*marketing/i,
        /custo.*aquisi[çc][ãa]o/i,
        /cac/i,
        /ltv/i,
        /retorno.*investimento/i,
        /roas/i,
        /quanto.*gastei/i,
        /quanto.*investi/i
    ],

    anomaly_detection: [
        /por.*que.*caiu/i,
        /o.*que.*aconteceu/i,
        /problema.*em/i,
        /queda.*em/i,
        /anomalia/i,
        /algo.*errado/i,
        /vendas.*cairam/i,
        /performance.*ruim/i,
        /por.*que.*baixou/i,
        /o.*que.*houve/i
    ],

    customer_segmentation: [
        /segmenta[çc][ãa]o/i,
        /tipos.*cliente/i,
        /perfis.*cliente/i,
        /clusters/i,
        /segmentar/i,
        /grupos.*cliente/i,
        /categorias.*cliente/i
    ],

    dashboard_summary: [
        /resumo/i,
        /relat[óo]rio/i,
        /dashboard/i,
        /vis[ãa]o.*geral/i,
        /panorama/i,
        /como.*estou/i,
        /situa[çc][ãa]o.*atual/i,
        /me.*atualiza/i,
        /resumo.*geral/i,
        /overview/i
    ]
};

/**
 * Intent metadata with descriptions and default parameters
 */
const intentConfig = {
    sales_forecast: {
        name: 'Previsão de Vendas',
        description: 'Prevê vendas futuras usando modelos de Machine Learning (XGBoost)',
        endpoint: '/analysis/sales-forecast',
        requiredData: ['historical_revenue', 'visits', 'conversion_rate'],
        defaultParams: {
            days: 30,
            historyDays: 365,
            model: 'xgboost'
        },
        minHistoryDays: 30,
        icon: '📊'
    },

    churn_prediction: {
        name: 'Predição de Churn',
        description: 'Identifica clientes com risco de cancelamento',
        endpoint: '/analysis/churn-prediction',
        requiredData: ['customer_behavior', 'engagement_metrics'],
        defaultParams: {
            threshold: 0.7
        },
        icon: '⚠️'
    },

    instagram_analysis: {
        name: 'Análise de Instagram',
        description: 'Métricas de performance do Instagram',
        endpoint: '/analysis/instagram',
        requiredData: ['instagram_followers', 'instagram_engagement'],
        defaultParams: {
            period: 7
        },
        icon: '📱'
    },

    tiktok_analysis: {
        name: 'Análise de TikTok',
        description: 'Métricas de performance do TikTok',
        endpoint: '/analysis/tiktok',
        requiredData: ['tiktok_views', 'tiktok_engagement'],
        defaultParams: {
            period: 7
        },
        icon: '🎵'
    },

    marketing_roi: {
        name: 'ROI de Marketing',
        description: 'Análise de retorno sobre investimento em marketing',
        endpoint: '/analysis/marketing-roi',
        requiredData: ['marketing_spend', 'revenue'],
        defaultParams: {
            days: 30
        },
        icon: '💵'
    },

    anomaly_detection: {
        name: 'Detecção de Anomalias',
        description: 'Identifica padrões anormais nos dados',
        endpoint: '/analysis/anomaly-detection',
        requiredData: ['revenue', 'orders', 'visits'],
        defaultParams: {
            days: 30,
            sensitivity: 'medium'
        },
        minHistoryDays: 7,
        icon: '🚨'
    },

    customer_segmentation: {
        name: 'Segmentação de Clientes',
        description: 'Agrupa clientes por comportamento usando K-means',
        endpoint: '/analysis/customer-segmentation',
        requiredData: ['customer_data'],
        defaultParams: {
            clusters: 5
        },
        icon: '👥'
    },

    dashboard_summary: {
        name: 'Resumo Executivo',
        description: 'Visão geral das métricas principais',
        endpoint: null, // Local processing, no VPS call
        requiredData: ['all_metrics'],
        defaultParams: {
            period: 7
        },
        icon: '📊'
    }
};

/**
 * Time period extraction patterns
 */
const timePatterns = {
    future: [
        { pattern: /pr[óo]ximo.*(\d+).*dia/i, extract: 'days', type: 'future' },
        { pattern: /pr[óo]xima.*semana/i, value: 7, type: 'future' },
        { pattern: /pr[óo]ximo.*m[êe]s/i, value: 30, type: 'future' },
        { pattern: /pr[óo]ximo.*trimestre/i, value: 90, type: 'future' },
        { pattern: /pr[óo]ximo.*ano/i, value: 365, type: 'future' }
    ],
    past: [
        { pattern: /[úu]ltimo.*(\d+).*dia/i, extract: 'days', type: 'past' },
        { pattern: /[úu]ltim[ao].*semana/i, value: 7, type: 'past' },
        { pattern: /[úu]ltimo.*m[êe]s/i, value: 30, type: 'past' },
        { pattern: /hoj[eé]/i, value: 1, type: 'past' },
        { pattern: /ontem/i, value: 2, type: 'past' }
    ]
};

/**
 * Response templates for each intent
 */
const responseTemplates = {
    loading: {
        sales_forecast: '📊 Analisando dados de vendas e gerando previsão...',
        instagram_analysis: '📱 Carregando métricas do Instagram...',
        tiktok_analysis: '🎵 Carregando métricas do TikTok...',
        anomaly_detection: '🚨 Procurando anomalias nos dados...',
        dashboard_summary: '📊 Gerando resumo executivo...',
        marketing_roi: '💵 Calculando ROI de marketing...',
        customer_segmentation: '👥 Segmentando base de clientes...',
        churn_prediction: '⚠️ Analisando risco de churn...'
    }
};

/**
 * ML Service endpoints configuration
 */
const mlServiceConfig = {
    timeout: 30000, // 30 seconds
    retries: 2,
    retryDelay: 1000
};

module.exports = {
    intentPatterns,
    intentConfig,
    timePatterns,
    responseTemplates,
    mlServiceConfig,

    // Helper functions
    getIntentInfo: (intent) => intentConfig[intent] || null,
    getIntentPatterns: (intent) => intentPatterns[intent] || [],
    getAllIntents: () => Object.keys(intentConfig),
    getLoadingMessage: (intent) => responseTemplates.loading[intent] || 'Processando...'
};
