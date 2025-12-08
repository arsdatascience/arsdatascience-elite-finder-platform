// Part 4: Clustering and Time Series Algorithms
import { AlgorithmDefinition } from './algorithmConfigs';

// ============================
// CLUSTERING ALGORITHMS
// ============================

export const KMEANS: AlgorithmDefinition = {
    id: 'kmeans',
    name: 'K-Means',
    category: 'clustering',
    library: 'sklearn.cluster.KMeans',
    description: 'Partitions data into K clusters based on centroids.',
    hyperparameters: [
        { name: 'n_clusters', label: 'Número de Clusters (K)', type: 'integer', default: 3, min: 2, max: 20, description: 'Quantidade de clusters', impact: 'high', category: 'basic', gridSearchRange: [2, 3, 4, 5, 6, 7, 8] },
        { name: 'init', label: 'Inicialização', type: 'select', default: 'k-means++', options: [{ value: 'k-means++', label: 'K-Means++' }, { value: 'random', label: 'Random' }], description: 'Método de inicialização', impact: 'high', category: 'basic', gridSearchRange: ['k-means++', 'random'] },
        { name: 'n_init', label: 'Número de Inicializações', type: 'integer', default: 10, min: 5, max: 50, description: 'Execuções com diferentes inicializações', impact: 'high', category: 'optimization', gridSearchRange: [10, 20, 30] },
        { name: 'max_iter', label: 'Máx Iterações', type: 'integer', default: 300, min: 100, max: 1000, description: 'Máximo de iterações', impact: 'low', category: 'optimization' },
        { name: 'tol', label: 'Tolerância', type: 'number', default: 0.0001, min: 0.00001, max: 0.01, step: 0.0001, description: 'Tolerância para convergência', impact: 'low', category: 'optimization' },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'copy_x', label: 'Copy X', type: 'boolean', default: true, description: 'Copiar dados', impact: 'low', category: 'advanced' },
        { name: 'algorithm', label: 'Algoritmo', type: 'select', default: 'lloyd', options: [{ value: 'lloyd', label: 'Lloyd' }, { value: 'elkan', label: 'Elkan' }], description: 'Algoritmo K-Means', impact: 'medium', category: 'optimization' }
    ],
    presets: [
        { name: 'rfm_3', label: 'RFM 3 Clusters', description: 'VIP, Regular, Em Risco', config: { n_clusters: 3, init: 'k-means++', n_init: 20 }, estimatedTime: '~5s', expectedAccuracy: 'Silhouette ~0.4' },
        { name: 'rfm_4', label: 'RFM 4 Clusters', description: 'VIP, Potencial, Em Risco, Perdido', config: { n_clusters: 4, init: 'k-means++', n_init: 20 }, estimatedTime: '~5s', expectedAccuracy: 'Silhouette ~0.35' },
        { name: 'personas', label: 'Personas (5 Clusters)', description: 'Segmentação de personas', config: { n_clusters: 5, init: 'k-means++', n_init: 30, max_iter: 500 }, estimatedTime: '~10s', expectedAccuracy: 'Silhouette ~0.3' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 1000, maxSamples: null, minFeatures: 2, maxFeatures: null, notes: 'Use Elbow Method ou Silhouette Score para escolher K' },
    baseAccuracy: 0.75
};

export const DBSCAN: AlgorithmDefinition = {
    id: 'dbscan',
    name: 'DBSCAN',
    category: 'clustering',
    library: 'sklearn.cluster.DBSCAN',
    description: 'Density-based clustering that finds outliers.',
    hyperparameters: [
        { name: 'eps', label: 'Epsilon (Raio)', type: 'number', default: 0.5, min: 0.01, max: 10, step: 0.1, description: 'Raio de vizinhança', impact: 'high', category: 'basic', gridSearchRange: [0.3, 0.5, 0.7, 1.0, 1.5, 2.0] },
        { name: 'min_samples', label: 'Mínimo de Amostras', type: 'integer', default: 5, min: 2, max: 100, description: 'Mínimo de vizinhos para core point', impact: 'high', category: 'basic', gridSearchRange: [5, 10, 15, 20, 30] },
        { name: 'metric', label: 'Métrica', type: 'select', default: 'euclidean', options: [{ value: 'euclidean', label: 'Euclidean' }, { value: 'manhattan', label: 'Manhattan' }, { value: 'cosine', label: 'Cosine' }], description: 'Métrica de distância', impact: 'medium', category: 'basic', gridSearchRange: ['euclidean', 'manhattan', 'cosine'] },
        { name: 'algorithm', label: 'Algoritmo', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: 'ball_tree', label: 'Ball Tree' }, { value: 'kd_tree', label: 'KD Tree' }, { value: 'brute', label: 'Brute Force' }], description: 'Algoritmo de busca', impact: 'low', category: 'optimization' },
        { name: 'leaf_size', label: 'Tamanho da Folha', type: 'integer', default: 30, min: 10, max: 100, description: 'Tamanho da folha para Ball/KD Tree', impact: 'low', category: 'optimization' },
        { name: 'p', label: 'Minkowski P', type: 'number', default: null, min: 1, max: 10, step: 1, description: 'Parâmetro Minkowski', impact: 'low', category: 'advanced' },
        { name: 'n_jobs', label: 'Número de Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'CPUs', impact: 'low', category: 'optimization' }
    ],
    presets: [
        { name: 'fraud', label: 'Detecção de Fraude', description: 'Detecção rígida de anomalias', config: { eps: 0.3, min_samples: 5, metric: 'euclidean' }, estimatedTime: '~10s', expectedAccuracy: 'Detecta ~5% outliers' },
        { name: 'geo', label: 'Segmentação Geográfica', description: 'Agrupa localizações', config: { eps: 1.0, min_samples: 10, metric: 'euclidean' }, estimatedTime: '~10s', expectedAccuracy: 'Clusters regionais' },
        { name: 'behavior', label: 'Comportamento de Usuários', description: 'Padrões de comportamento', config: { eps: 0.5, min_samples: 20, metric: 'cosine' }, estimatedTime: '~15s', expectedAccuracy: 'Perfis de uso' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 5000, maxSamples: 50000, minFeatures: 2, maxFeatures: null, notes: 'Use K-distance graph para escolher eps' },
    baseAccuracy: 0.78
};

export const HIERARCHICAL_CLUSTERING: AlgorithmDefinition = {
    id: 'hierarchical_clustering',
    name: 'Hierarchical Clustering',
    category: 'clustering',
    library: 'sklearn.cluster.AgglomerativeClustering',
    description: 'Bottom-up hierarchical clustering with dendrogram.',
    hyperparameters: [
        { name: 'n_clusters', label: 'Número de Clusters', type: 'integer', default: 3, min: 2, max: 20, description: 'Quantidade de clusters', impact: 'high', category: 'basic', gridSearchRange: [2, 3, 4, 5, 6, 7, 8] },
        { name: 'metric', label: 'Métrica', type: 'select', default: 'euclidean', options: [{ value: 'euclidean', label: 'Euclidean' }, { value: 'manhattan', label: 'Manhattan' }, { value: 'cosine', label: 'Cosine' }], description: 'Métrica de distância', impact: 'medium', category: 'basic' },
        { name: 'linkage', label: 'Linkage', type: 'select', default: 'ward', options: [{ value: 'ward', label: 'Ward' }, { value: 'complete', label: 'Complete' }, { value: 'average', label: 'Average' }, { value: 'single', label: 'Single' }], description: 'Método de ligação', impact: 'high', category: 'basic', gridSearchRange: ['ward', 'complete', 'average'] },
        { name: 'distance_threshold', label: 'Threshold de Distância', type: 'number', default: null, min: 0.1, max: 100, step: 0.1, description: 'Distância para corte automático', impact: 'high', category: 'basic' },
        { name: 'compute_distances', label: 'Calcular Distâncias', type: 'boolean', default: false, description: 'Calcular distâncias entre clusters', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'taxonomy_3', label: 'Taxonomia (3 Níveis)', description: 'Hierarquia simples', config: { n_clusters: 3, linkage: 'ward', metric: 'euclidean' }, estimatedTime: '~20s', expectedAccuracy: 'Silhouette ~0.4' },
        { name: 'customers_4', label: 'Clientes (4 Níveis)', description: 'Segmentação hierárquica', config: { n_clusters: 4, linkage: 'average', metric: 'euclidean' }, estimatedTime: '~30s', expectedAccuracy: 'Silhouette ~0.35' },
        { name: 'auto_cut', label: 'Corte Automático', description: 'Define clusters por distância', config: { n_clusters: null, distance_threshold: 10.0, linkage: 'ward', metric: 'euclidean' }, estimatedTime: '~30s', expectedAccuracy: 'Depende dos dados' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 2000, maxSamples: 5000, minFeatures: 2, maxFeatures: null, notes: 'Muito lento em datasets grandes. Complexidade O(n²) ou O(n³)' },
    baseAccuracy: 0.73
};

// ============================
// TIME SERIES ALGORITHMS
// ============================

export const PROPHET: AlgorithmDefinition = {
    id: 'prophet',
    name: 'Prophet',
    category: 'time_series',
    library: 'prophet.Prophet',
    description: 'Facebook/Meta time series forecasting with seasonality.',
    hyperparameters: [
        { name: 'growth', label: 'Tipo de Crescimento', type: 'select', default: 'linear', options: [{ value: 'linear', label: 'Linear' }, { value: 'logistic', label: 'Logístico' }, { value: 'flat', label: 'Flat' }], description: 'Tipo de tendência', impact: 'high', category: 'basic' },
        { name: 'n_changepoints', label: 'Número de Changepoints', type: 'integer', default: 25, min: 5, max: 100, description: 'Pontos de mudança de tendência', impact: 'high', category: 'basic' },
        { name: 'changepoint_range', label: 'Range de Changepoints', type: 'number', default: 0.8, min: 0.5, max: 0.95, step: 0.05, description: 'Fração dos dados para detectar changepoints', impact: 'medium', category: 'basic' },
        { name: 'yearly_seasonality', label: 'Sazonalidade Anual', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }], description: 'Detectar sazonalidade anual', impact: 'high', category: 'basic' },
        { name: 'weekly_seasonality', label: 'Sazonalidade Semanal', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }], description: 'Detectar sazonalidade semanal', impact: 'high', category: 'basic' },
        { name: 'daily_seasonality', label: 'Sazonalidade Diária', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }], description: 'Detectar sazonalidade diária', impact: 'high', category: 'basic' },
        { name: 'seasonality_mode', label: 'Modo de Sazonalidade', type: 'select', default: 'additive', options: [{ value: 'additive', label: 'Aditivo' }, { value: 'multiplicative', label: 'Multiplicativo' }], description: 'Como a sazonalidade afeta a tendência', impact: 'high', category: 'basic', gridSearchRange: ['additive', 'multiplicative'] },
        { name: 'seasonality_prior_scale', label: 'Força da Sazonalidade', type: 'number', default: 10, min: 0.01, max: 50, step: 1, description: 'Força da sazonalidade', impact: 'high', category: 'regularization', gridSearchRange: [0.01, 1, 5, 10, 20] },
        { name: 'holidays_prior_scale', label: 'Força dos Feriados', type: 'number', default: 10, min: 0.01, max: 50, step: 1, description: 'Força do efeito dos feriados', impact: 'high', category: 'regularization', gridSearchRange: [0.01, 1, 10, 20] },
        { name: 'changepoint_prior_scale', label: 'Flexibilidade da Tendência', type: 'number', default: 0.05, min: 0.001, max: 0.5, step: 0.01, description: 'Flexibilidade para mudanças de tendência', impact: 'high', category: 'regularization', gridSearchRange: [0.001, 0.01, 0.05, 0.1, 0.5] },
        { name: 'interval_width', label: 'Intervalo de Confiança', type: 'number', default: 0.8, min: 0.5, max: 0.99, step: 0.05, description: 'Largura do intervalo de confiança', impact: 'medium', category: 'basic' },
        { name: 'uncertainty_samples', label: 'Amostras de Incerteza', type: 'integer', default: 1000, min: 100, max: 5000, step: 100, description: 'Samples para incerteza', impact: 'low', category: 'advanced' },
        { name: 'include_holidays_br', label: 'Feriados Brasileiros', type: 'boolean', default: true, description: 'Incluir feriados brasileiros pré-definidos', impact: 'high', category: 'basic' }
    ],
    presets: [
        { name: 'ecommerce', label: 'E-commerce', description: 'Vendas com Black Friday, Natal', config: { growth: 'linear', seasonality_mode: 'multiplicative', yearly_seasonality: 'true', weekly_seasonality: 'true', daily_seasonality: 'false', seasonality_prior_scale: 15, changepoint_prior_scale: 0.05, include_holidays_br: true }, estimatedTime: '~30s', expectedAccuracy: 'MAPE ~10-15%' },
        { name: 'saas', label: 'SaaS/Subscription', description: 'Crescimento saturante', config: { growth: 'logistic', seasonality_mode: 'additive', yearly_seasonality: 'true', weekly_seasonality: 'false', seasonality_prior_scale: 5, changepoint_prior_scale: 0.1 }, estimatedTime: '~30s', expectedAccuracy: 'MAPE ~8-12%' },
        { name: 'traffic', label: 'Tráfego do Site', description: 'Padrões diários e semanais', config: { growth: 'linear', seasonality_mode: 'additive', yearly_seasonality: 'true', weekly_seasonality: 'true', daily_seasonality: 'true', seasonality_prior_scale: 10, changepoint_prior_scale: 0.05 }, estimatedTime: '~40s', expectedAccuracy: 'MAPE ~12-18%' }
    ],
    dataRequirements: { minSamples: 365, idealSamples: 1095, maxSamples: null, minFeatures: 2, maxFeatures: 2, notes: 'Precisa de colunas ds (data) e y (valor). Mínimo 1 ano de dados recomendado' },
    baseAccuracy: 0.85
};

export const ARIMA: AlgorithmDefinition = {
    id: 'arima',
    name: 'ARIMA',
    category: 'time_series',
    library: 'statsmodels.tsa.arima.model.ARIMA',
    description: 'Autoregressive Integrated Moving Average for time series.',
    hyperparameters: [
        { name: 'p', label: 'P (AR Order)', type: 'integer', default: 1, min: 0, max: 10, description: 'Ordem autorregressiva (quantos passados usar)', impact: 'high', category: 'basic', gridSearchRange: [0, 1, 2, 3, 4, 5] },
        { name: 'd', label: 'D (Diferenciação)', type: 'integer', default: 1, min: 0, max: 3, description: 'Ordem de diferenciação (para tornar estacionário)', impact: 'high', category: 'basic', gridSearchRange: [0, 1, 2] },
        { name: 'q', label: 'Q (MA Order)', type: 'integer', default: 1, min: 0, max: 10, description: 'Ordem de média móvel (quantos erros passados usar)', impact: 'high', category: 'basic', gridSearchRange: [0, 1, 2, 3, 4, 5] },
        { name: 'trend', label: 'Tendência', type: 'select', default: 'n', options: [{ value: 'n', label: 'Nenhuma' }, { value: 'c', label: 'Constante' }, { value: 't', label: 'Linear' }, { value: 'ct', label: 'Constante + Linear' }], description: 'Tipo de tendência', impact: 'medium', category: 'basic' }
    ],
    presets: [
        { name: 'arima_111', label: 'ARIMA(1,1,1)', description: 'Padrão mais comum', config: { p: 1, d: 1, q: 1 }, estimatedTime: '~5s', expectedAccuracy: 'MAPE ~15-20%' },
        { name: 'arima_212', label: 'ARIMA(2,1,2)', description: 'Mais complexidade', config: { p: 2, d: 1, q: 2 }, estimatedTime: '~10s', expectedAccuracy: 'MAPE ~12-18%' },
        { name: 'arima_101', label: 'ARIMA(1,0,1)', description: 'Para séries já estacionárias', config: { p: 1, d: 0, q: 1 }, estimatedTime: '~3s', expectedAccuracy: 'MAPE ~18-25%' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 365, maxSamples: null, minFeatures: 1, maxFeatures: 1, notes: 'Use ACF e PACF para escolher p e q. Use ADF test para escolher d.' },
    baseAccuracy: 0.75
};

export const SARIMA: AlgorithmDefinition = {
    id: 'sarima',
    name: 'SARIMA',
    category: 'time_series',
    library: 'statsmodels.tsa.statespace.sarimax.SARIMAX',
    description: 'Seasonal ARIMA for time series with seasonality.',
    hyperparameters: [
        { name: 'p', label: 'P (AR Order)', type: 'integer', default: 1, min: 0, max: 5, description: 'Ordem AR não-sazonal', impact: 'high', category: 'basic' },
        { name: 'd', label: 'D (Diferenciação)', type: 'integer', default: 1, min: 0, max: 2, description: 'Diferenciação não-sazonal', impact: 'high', category: 'basic' },
        { name: 'q', label: 'Q (MA Order)', type: 'integer', default: 1, min: 0, max: 5, description: 'Ordem MA não-sazonal', impact: 'high', category: 'basic' },
        { name: 'P', label: 'P Sazonal', type: 'integer', default: 1, min: 0, max: 3, description: 'Ordem AR sazonal', impact: 'high', category: 'basic' },
        { name: 'D', label: 'D Sazonal', type: 'integer', default: 1, min: 0, max: 2, description: 'Diferenciação sazonal', impact: 'high', category: 'basic' },
        { name: 'Q', label: 'Q Sazonal', type: 'integer', default: 1, min: 0, max: 3, description: 'Ordem MA sazonal', impact: 'high', category: 'basic' },
        { name: 's', label: 'S (Período Sazonal)', type: 'select', default: 7, options: [{ value: 4, label: '4 (Trimestral)' }, { value: 7, label: '7 (Semanal)' }, { value: 12, label: '12 (Mensal)' }, { value: 52, label: '52 (Anual-Semanal)' }, { value: 365, label: '365 (Anual-Diário)' }], description: 'Período de sazonalidade', impact: 'high', category: 'basic' }
    ],
    presets: [
        { name: 'weekly', label: 'Sazonal Semanal', description: 'Para dados diários com padrão semanal', config: { p: 1, d: 1, q: 1, P: 1, D: 1, Q: 1, s: 7 }, estimatedTime: '~30s', expectedAccuracy: 'MAPE ~12-18%' },
        { name: 'monthly', label: 'Sazonal Mensal', description: 'Para dados mensais com padrão anual', config: { p: 1, d: 1, q: 1, P: 1, D: 1, Q: 1, s: 12 }, estimatedTime: '~20s', expectedAccuracy: 'MAPE ~10-15%' },
        { name: 'annual_weekly', label: 'Sazonal Anual (Semanal)', description: 'Para dados semanais com padrão anual', config: { p: 2, d: 1, q: 2, P: 1, D: 1, Q: 1, s: 52 }, estimatedTime: '~60s', expectedAccuracy: 'MAPE ~8-12%' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 730, maxSamples: null, minFeatures: 1, maxFeatures: 1, notes: 'Precisa de pelo menos 2 ciclos sazonais completos de dados' },
    baseAccuracy: 0.80
};

export const EXPONENTIAL_SMOOTHING: AlgorithmDefinition = {
    id: 'exponential_smoothing',
    name: 'Exponential Smoothing (Holt-Winters)',
    category: 'time_series',
    library: 'statsmodels.tsa.holtwinters.ExponentialSmoothing',
    description: 'Weighted averages with trend and seasonality components.',
    hyperparameters: [
        { name: 'trend', label: 'Tendência', type: 'select', default: 'add', options: [{ value: 'none', label: 'Nenhuma' }, { value: 'add', label: 'Aditiva' }, { value: 'mul', label: 'Multiplicativa' }], description: 'Tipo de tendência', impact: 'high', category: 'basic' },
        { name: 'damped_trend', label: 'Tendência Amortecida', type: 'boolean', default: false, description: 'Amortecer tendência ao longo do tempo', impact: 'medium', category: 'basic' },
        { name: 'seasonal', label: 'Sazonalidade', type: 'select', default: 'add', options: [{ value: 'none', label: 'Nenhuma' }, { value: 'add', label: 'Aditiva' }, { value: 'mul', label: 'Multiplicativa' }], description: 'Tipo de sazonalidade', impact: 'high', category: 'basic' },
        { name: 'seasonal_periods', label: 'Período Sazonal', type: 'select', default: 7, options: [{ value: 4, label: '4 (Trimestral)' }, { value: 7, label: '7 (Semanal)' }, { value: 12, label: '12 (Mensal)' }, { value: 52, label: '52 (Anual)' }, { value: 365, label: '365 (Diário)' }], description: 'Período de sazonalidade', impact: 'high', category: 'basic' },
        { name: 'smoothing_level', label: 'Alpha (Nível)', type: 'number', default: null, min: 0.1, max: 0.9, step: 0.1, description: 'Peso do nível (α). Null = otimizar automaticamente', impact: 'high', category: 'optimization' },
        { name: 'smoothing_trend', label: 'Beta (Tendência)', type: 'number', default: null, min: 0.1, max: 0.5, step: 0.1, description: 'Peso da tendência (β). Null = otimizar automaticamente', impact: 'high', category: 'optimization' },
        { name: 'smoothing_seasonal', label: 'Gamma (Sazonal)', type: 'number', default: null, min: 0.1, max: 0.5, step: 0.1, description: 'Peso da sazonalidade (γ). Null = otimizar automaticamente', impact: 'high', category: 'optimization' },
        { name: 'optimized', label: 'Otimizar Automaticamente', type: 'boolean', default: true, description: 'Otimizar α, β, γ automaticamente', impact: 'high', category: 'optimization' },
        { name: 'use_boxcox', label: 'Usar BoxCox', type: 'boolean', default: false, description: 'Transformação BoxCox para estabilizar variância', impact: 'medium', category: 'advanced' }
    ],
    presets: [
        { name: 'ses', label: 'Simple (SES)', description: 'Sem tendência, sem sazonalidade', config: { trend: 'none', seasonal: 'none', optimized: true }, estimatedTime: '~2s', expectedAccuracy: 'MAPE ~20-30%' },
        { name: 'holt', label: 'Holt (Duplo)', description: 'Com tendência, sem sazonalidade', config: { trend: 'add', seasonal: 'none', optimized: true }, estimatedTime: '~5s', expectedAccuracy: 'MAPE ~15-25%' },
        { name: 'hw_additive', label: 'Holt-Winters Aditivo', description: 'Sazonalidade constante', config: { trend: 'add', seasonal: 'add', seasonal_periods: 7, optimized: true }, estimatedTime: '~10s', expectedAccuracy: 'MAPE ~12-18%' },
        { name: 'hw_multiplicative', label: 'Holt-Winters Multiplicativo', description: 'Sazonalidade crescente', config: { trend: 'add', seasonal: 'mul', seasonal_periods: 7, optimized: true }, estimatedTime: '~10s', expectedAccuracy: 'MAPE ~10-15%' },
        { name: 'conservative', label: 'Conservador', description: 'Tendência amortecida', config: { trend: 'add', damped_trend: true, seasonal: 'add', seasonal_periods: 7, optimized: true }, estimatedTime: '~10s', expectedAccuracy: 'MAPE ~12-18%' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 365, maxSamples: null, minFeatures: 1, maxFeatures: 1, notes: 'Precisa de pelo menos 2 ciclos sazonais completos' },
    baseAccuracy: 0.78
};
