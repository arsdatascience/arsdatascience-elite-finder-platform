// Part 4: Clustering and Time Series Algorithms - 100% of parameters as specified
import { AlgorithmDefinition } from './algorithmConfigs';

// ==================== CLUSTERING ====================

export const KMEANS: AlgorithmDefinition = {
    id: 'kmeans',
    name: 'K-Means',
    category: 'clustering',
    library: 'sklearn.cluster.KMeans',
    description: 'Agrupa dados em K clusters baseado em centroides.',
    hyperparameters: [
        // Core
        { name: 'n_clusters', label: 'Número de Clusters', type: 'integer', default: 8, min: 2, max: 20, description: 'Número de clusters a formar (use Elbow Method/Silhouette)', impact: 'high', category: 'basic', gridSearchRange: [2, 3, 4, 5, 6, 7, 8] },
        { name: 'init', label: 'Inicialização', type: 'select', default: 'k-means++', options: [{ value: 'k-means++', label: 'K-Means++ (Inteligente)' }, { value: 'random', label: 'Random' }], description: 'Método de inicialização de centroides', impact: 'high', category: 'basic', gridSearchRange: ['k-means++', 'random'] },
        { name: 'n_init', label: 'Número de Inicializações', type: 'integer', default: 10, min: 5, max: 50, step: 5, description: 'Execuções com diferentes inicializações', impact: 'high', category: 'optimization', gridSearchRange: [10, 20, 30] },
        { name: 'max_iter', label: 'Máx Iterações', type: 'integer', default: 300, min: 100, max: 1000, step: 100, description: 'Máximo de iterações por execução', impact: 'low', category: 'optimization' },
        { name: 'tol', label: 'Tolerância', type: 'number', default: 0.0001, min: 0.00001, max: 0.01, step: 0.0001, description: 'Tolerância para convergência', impact: 'low', category: 'optimization' },
        { name: 'algorithm', label: 'Algoritmo', type: 'select', default: 'lloyd', options: [{ value: 'lloyd', label: 'Lloyd (Padrão)' }, { value: 'elkan', label: 'Elkan' }], description: 'Algoritmo de K-Means', impact: 'low', category: 'optimization' },
        // Advanced
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed para reprodutibilidade', impact: 'low', category: 'advanced' },
        { name: 'copy_x', label: 'Copy X', type: 'boolean', default: true, description: 'Copiar dados de entrada', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'rfm_3', label: 'RFM 3 Clusters', description: 'VIP, Regular, Em Risco', config: { n_clusters: 3, init: 'k-means++', n_init: 20, random_state: 42 }, estimatedTime: '~2s', expectedAccuracy: 'Silhouette ~0.4-0.6' },
        { name: 'rfm_4', label: 'RFM 4 Clusters', description: 'VIP, Potencial, Em Risco, Perdido', config: { n_clusters: 4, init: 'k-means++', n_init: 20, random_state: 42 }, estimatedTime: '~3s', expectedAccuracy: 'Silhouette ~0.35-0.55' },
        { name: 'personas', label: 'Personas (5)', description: 'Segmentação de personas', config: { n_clusters: 5, init: 'k-means++', n_init: 30, max_iter: 500, random_state: 42 }, estimatedTime: '~5s', expectedAccuracy: 'Silhouette ~0.3-0.5' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 5000, maxSamples: null, minFeatures: 2, maxFeatures: null, notes: 'Normalize/escale features antes de usar' },
    baseAccuracy: 0.75
};

export const DBSCAN: AlgorithmDefinition = {
    id: 'dbscan',
    name: 'DBSCAN',
    category: 'clustering',
    library: 'sklearn.cluster.DBSCAN',
    description: 'Clustering baseado em densidade que detecta outliers.',
    hyperparameters: [
        // Core
        { name: 'eps', label: 'Eps (Raio)', type: 'number', default: 0.5, min: 0.01, max: 10, step: 0.1, description: 'Raio de vizinhança (use K-distance graph para escolher)', impact: 'high', category: 'basic', gridSearchRange: [0.3, 0.5, 0.7, 1.0, 1.5, 2.0] },
        { name: 'min_samples', label: 'Mín Samples', type: 'integer', default: 5, min: 2, max: 100, description: 'Mínimo de vizinhos para core point', impact: 'high', category: 'basic', gridSearchRange: [5, 10, 15, 20, 30] },
        { name: 'metric', label: 'Métrica', type: 'select', default: 'euclidean', options: [{ value: 'euclidean', label: 'Euclidean' }, { value: 'manhattan', label: 'Manhattan' }, { value: 'cosine', label: 'Cosine' }], description: 'Métrica de distância', impact: 'medium', category: 'basic', gridSearchRange: ['euclidean', 'manhattan', 'cosine'] },
        { name: 'algorithm', label: 'Algoritmo', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: 'ball_tree', label: 'Ball Tree' }, { value: 'kd_tree', label: 'KD Tree' }, { value: 'brute', label: 'Brute Force' }], description: 'Algoritmo de busca', impact: 'low', category: 'optimization' },
        { name: 'leaf_size', label: 'Leaf Size', type: 'integer', default: 30, min: 10, max: 100, step: 10, description: 'Tamanho da folha para ball_tree/kd_tree', impact: 'low', category: 'optimization' },
        { name: 'p', label: 'P (Minkowski)', type: 'number', default: null, min: 1, max: 10, step: 1, description: 'Parâmetro p para métrica Minkowski', impact: 'low', category: 'advanced' },
        { name: 'n_jobs', label: 'Número de Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'CPUs a usar (-1=todas)', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'fraud', label: 'Detecção de Fraude', description: 'Strict para anomalias', config: { eps: 0.3, min_samples: 5, metric: 'euclidean', n_jobs: -1 }, estimatedTime: '~3s', expectedAccuracy: 'Detecta ~5% outliers' },
        { name: 'geo', label: 'Segmentação Geográfica', description: 'Agrupa localizações', config: { eps: 1.0, min_samples: 10, metric: 'euclidean', n_jobs: -1 }, estimatedTime: '~5s', expectedAccuracy: 'Clusters geográficos' },
        { name: 'behavior', label: 'Comportamento', description: 'Padrões de usuário', config: { eps: 0.5, min_samples: 20, metric: 'cosine', n_jobs: -1 }, estimatedTime: '~5s', expectedAccuracy: 'Grupos comportamentais' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 5000, maxSamples: 50000, minFeatures: 2, maxFeatures: null, notes: 'Bom para detectar outliers (label=-1)' },
    baseAccuracy: 0.70
};

export const HIERARCHICAL_CLUSTERING: AlgorithmDefinition = {
    id: 'hierarchical_clustering',
    name: 'Hierarchical Clustering',
    category: 'clustering',
    library: 'sklearn.cluster.AgglomerativeClustering',
    description: 'Clustering aglomerativo que cria hierarquia de clusters.',
    hyperparameters: [
        // Core
        { name: 'n_clusters', label: 'Número de Clusters', type: 'integer', default: 2, min: 2, max: 20, description: 'Número de clusters (ou use distance_threshold)', impact: 'high', category: 'basic', gridSearchRange: [2, 3, 4, 5, 6, 7, 8] },
        { name: 'metric', label: 'Métrica', type: 'select', default: 'euclidean', options: [{ value: 'euclidean', label: 'Euclidean' }, { value: 'manhattan', label: 'Manhattan' }, { value: 'cosine', label: 'Cosine' }], description: 'Métrica de distância', impact: 'high', category: 'basic', gridSearchRange: ['euclidean', 'manhattan'] },
        { name: 'linkage', label: 'Linkage', type: 'select', default: 'ward', options: [{ value: 'ward', label: 'Ward (Minimiza Variância)' }, { value: 'complete', label: 'Complete (Máx Distância)' }, { value: 'average', label: 'Average (Média)' }, { value: 'single', label: 'Single (Mín Distância)' }], description: 'Método de ligação entre clusters', impact: 'high', category: 'basic', gridSearchRange: ['ward', 'complete', 'average'] },
        { name: 'distance_threshold', label: 'Distance Threshold', type: 'number', default: null, min: 0.1, max: 100, step: 0.1, description: 'Distância para corte automático (substitui n_clusters)', impact: 'high', category: 'basic' },
        { name: 'compute_full_tree', label: 'Compute Full Tree', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: true, label: 'Sim' }, { value: false, label: 'Não' }], description: 'Computar árvore completa', impact: 'low', category: 'advanced' },
        { name: 'compute_distances', label: 'Compute Distances', type: 'boolean', default: false, description: 'Calcular distâncias entre clusters', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'taxonomy_3', label: 'Taxonomia 3 Níveis', description: 'Hierarquia de 3 níveis', config: { n_clusters: 3, linkage: 'ward', metric: 'euclidean' }, estimatedTime: '~5s', expectedAccuracy: 'Silhouette ~0.4-0.6' },
        { name: 'segmentation_4', label: 'Segmentação 4 Níveis', description: 'Hierarquia de clientes', config: { n_clusters: 4, linkage: 'average', metric: 'euclidean' }, estimatedTime: '~8s', expectedAccuracy: 'Silhouette ~0.35-0.55' },
        { name: 'auto_cut', label: 'Corte Automático', description: 'Baseado em distância', config: { n_clusters: null, distance_threshold: 10.0, linkage: 'ward', metric: 'euclidean' }, estimatedTime: '~10s', expectedAccuracy: 'Número automático de clusters' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 5000, maxSamples: 5000, minFeatures: 2, maxFeatures: null, notes: '⚠️ MUITO LENTO em datasets > 5k (O(n²) ou O(n³))' },
    baseAccuracy: 0.72
};

// ==================== TIME SERIES ====================

export const PROPHET: AlgorithmDefinition = {
    id: 'prophet',
    name: 'Prophet (Facebook)',
    category: 'time_series',
    library: 'prophet.Prophet',
    description: 'Modelo aditivo para séries temporais com tendência, sazonalidade e feriados.',
    hyperparameters: [
        // Trend
        { name: 'growth', label: 'Tipo de Crescimento', type: 'select', default: 'linear', options: [{ value: 'linear', label: 'Linear' }, { value: 'logistic', label: 'Logístico (Saturante)' }, { value: 'flat', label: 'Flat (Sem Tendência)' }], description: 'Modelo de tendência', impact: 'high', category: 'basic' },
        { name: 'n_changepoints', label: 'Número de Changepoints', type: 'integer', default: 25, min: 5, max: 100, step: 5, description: 'Pontos de mudança de tendência', impact: 'high', category: 'basic', gridSearchRange: [10, 25, 50] },
        { name: 'changepoint_range', label: 'Range Changepoints', type: 'number', default: 0.8, min: 0.5, max: 0.95, step: 0.05, description: 'Fração de dados para detectar changepoints', impact: 'medium', category: 'basic' },
        { name: 'changepoint_prior_scale', label: 'Flexibilidade Tendência', type: 'number', default: 0.05, min: 0.001, max: 0.5, step: 0.01, description: 'Quanto a tendência pode mudar (menor=mais suave)', impact: 'high', category: 'basic', gridSearchRange: [0.001, 0.01, 0.05, 0.1, 0.5] },
        // Seasonality
        { name: 'yearly_seasonality', label: 'Sazonalidade Anual', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: true, label: 'Sim' }, { value: false, label: 'Não' }], description: 'Sazonalidade anual', impact: 'high', category: 'basic' },
        { name: 'weekly_seasonality', label: 'Sazonalidade Semanal', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: true, label: 'Sim' }, { value: false, label: 'Não' }], description: 'Sazonalidade semanal', impact: 'high', category: 'basic' },
        { name: 'daily_seasonality', label: 'Sazonalidade Diária', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: true, label: 'Sim' }, { value: false, label: 'Não' }], description: 'Sazonalidade diária (para dados horários)', impact: 'medium', category: 'basic' },
        { name: 'seasonality_mode', label: 'Modo Sazonalidade', type: 'select', default: 'additive', options: [{ value: 'additive', label: 'Aditivo (Constante)' }, { value: 'multiplicative', label: 'Multiplicativo (Cresce)' }], description: 'Modo de sazonalidade', impact: 'high', category: 'basic', gridSearchRange: ['additive', 'multiplicative'] },
        { name: 'seasonality_prior_scale', label: 'Força Sazonalidade', type: 'number', default: 10, min: 0.01, max: 50, step: 1, description: 'Peso da sazonalidade', impact: 'high', category: 'basic', gridSearchRange: [0.01, 1, 5, 10, 20] },
        // Holidays
        { name: 'holidays_prior_scale', label: 'Força Feriados', type: 'number', default: 10, min: 0.01, max: 50, step: 1, description: 'Peso dos feriados', impact: 'high', category: 'basic', gridSearchRange: [0.01, 1, 10, 20] },
        // Uncertainty
        { name: 'interval_width', label: 'Intervalo de Confiança', type: 'number', default: 0.80, min: 0.5, max: 0.99, step: 0.05, description: 'Largura do intervalo de confiança', impact: 'medium', category: 'advanced' },
        { name: 'uncertainty_samples', label: 'Samples Incerteza', type: 'integer', default: 1000, min: 100, max: 5000, step: 100, description: 'Samples para estimar incerteza', impact: 'low', category: 'advanced' },
        { name: 'mcmc_samples', label: 'MCMC Samples', type: 'integer', default: 0, min: 0, max: 1000, step: 100, description: 'Samples MCMC (0=desativado)', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'ecommerce', label: 'E-commerce', description: 'Vendas com sazonalidade forte', config: { growth: 'linear', seasonality_mode: 'multiplicative', yearly_seasonality: true, weekly_seasonality: true, daily_seasonality: false, seasonality_prior_scale: 15, changepoint_prior_scale: 0.05, interval_width: 0.80 }, estimatedTime: '~10s', expectedAccuracy: 'MAPE ~10-15%' },
        { name: 'saas', label: 'SaaS/Subscription', description: 'Crescimento saturante', config: { growth: 'logistic', seasonality_mode: 'additive', yearly_seasonality: true, weekly_seasonality: false, daily_seasonality: false, seasonality_prior_scale: 5, changepoint_prior_scale: 0.1, interval_width: 0.80 }, estimatedTime: '~10s', expectedAccuracy: 'MAPE ~8-12%' },
        { name: 'traffic', label: 'Tráfego do Site', description: 'Picos durante o dia', config: { growth: 'linear', seasonality_mode: 'additive', yearly_seasonality: true, weekly_seasonality: true, daily_seasonality: true, seasonality_prior_scale: 10, changepoint_prior_scale: 0.05, interval_width: 0.80 }, estimatedTime: '~15s', expectedAccuracy: 'MAPE ~12-18%' }
    ],
    dataRequirements: { minSamples: 60, idealSamples: 365, maxSamples: null, minFeatures: 2, maxFeatures: 2, notes: 'Precisa colunas "ds" (data) e "y" (valor). Para growth="logistic", definir "cap" e "floor".' },
    baseAccuracy: 0.85
};

export const ARIMA: AlgorithmDefinition = {
    id: 'arima',
    name: 'ARIMA',
    category: 'time_series',
    library: 'statsmodels.tsa.arima.model.ARIMA',
    description: 'AutoRegressive Integrated Moving Average para séries não-sazonais.',
    hyperparameters: [
        // Core Order
        { name: 'p', label: 'p (AR Order)', type: 'integer', default: 1, min: 0, max: 10, description: 'Ordem autorregressiva (quantos valores passados)', impact: 'high', category: 'basic', gridSearchRange: [0, 1, 2, 3, 4, 5] },
        { name: 'd', label: 'd (Differencing)', type: 'integer', default: 1, min: 0, max: 3, description: 'Ordem de diferenciação (tornar estacionário)', impact: 'high', category: 'basic', gridSearchRange: [0, 1, 2] },
        { name: 'q', label: 'q (MA Order)', type: 'integer', default: 1, min: 0, max: 10, description: 'Ordem de média móvel (quantos erros passados)', impact: 'high', category: 'basic', gridSearchRange: [0, 1, 2, 3, 4, 5] },
        // Trend
        { name: 'trend', label: 'Trend', type: 'select', default: null, options: [{ value: null, label: 'Nenhum' }, { value: 'n', label: 'No Trend' }, { value: 'c', label: 'Constant' }, { value: 't', label: 'Linear Trend' }, { value: 'ct', label: 'Constant + Trend' }], description: 'Tipo de tendência', impact: 'medium', category: 'advanced' }
    ],
    presets: [
        { name: 'default', label: 'Padrão (1,1,1)', description: 'Ordem padrão', config: { p: 1, d: 1, q: 1 }, estimatedTime: '~2s', expectedAccuracy: 'MAPE ~10-20%' },
        { name: 'complex', label: 'Complexo (2,1,2)', description: 'Mais complexidade', config: { p: 2, d: 1, q: 2 }, estimatedTime: '~3s', expectedAccuracy: 'MAPE ~8-15%' },
        { name: 'stationary', label: 'Estacionário (1,0,1)', description: 'Série já estacionária', config: { p: 1, d: 0, q: 1 }, estimatedTime: '~2s', expectedAccuracy: 'MAPE ~12-22%' }
    ],
    dataRequirements: { minSamples: 30, idealSamples: 100, maxSamples: null, minFeatures: 1, maxFeatures: 1, notes: 'Use auto_arima (pmdarima) para encontrar melhor ordem. Teste estacionariedade com ADF test.' },
    baseAccuracy: 0.78
};

export const SARIMA: AlgorithmDefinition = {
    id: 'sarima',
    name: 'SARIMA',
    category: 'time_series',
    library: 'statsmodels.tsa.statespace.sarimax.SARIMAX',
    description: 'ARIMA Sazonal para séries com componente sazonal.',
    hyperparameters: [
        // Non-seasonal Order
        { name: 'p', label: 'p (AR)', type: 'integer', default: 1, min: 0, max: 10, description: 'Ordem AR não-sazonal', impact: 'high', category: 'basic', gridSearchRange: [0, 1, 2, 3] },
        { name: 'd', label: 'd (Diff)', type: 'integer', default: 1, min: 0, max: 3, description: 'Diferenciação não-sazonal', impact: 'high', category: 'basic', gridSearchRange: [0, 1, 2] },
        { name: 'q', label: 'q (MA)', type: 'integer', default: 1, min: 0, max: 10, description: 'Ordem MA não-sazonal', impact: 'high', category: 'basic', gridSearchRange: [0, 1, 2, 3] },
        // Seasonal Order
        { name: 'P', label: 'P (AR Sazonal)', type: 'integer', default: 1, min: 0, max: 5, description: 'Ordem AR sazonal', impact: 'high', category: 'basic', gridSearchRange: [0, 1, 2] },
        { name: 'D', label: 'D (Diff Sazonal)', type: 'integer', default: 1, min: 0, max: 2, description: 'Diferenciação sazonal', impact: 'high', category: 'basic', gridSearchRange: [0, 1] },
        { name: 'Q', label: 'Q (MA Sazonal)', type: 'integer', default: 1, min: 0, max: 5, description: 'Ordem MA sazonal', impact: 'high', category: 'basic', gridSearchRange: [0, 1, 2] },
        { name: 's', label: 's (Período)', type: 'select', default: 7, options: [{ value: 4, label: '4 (Trimestral)' }, { value: 7, label: '7 (Semanal)' }, { value: 12, label: '12 (Mensal)' }, { value: 52, label: '52 (Semanal-Anual)' }, { value: 365, label: '365 (Diário-Anual)' }], description: 'Período sazonal', impact: 'high', category: 'basic' }
    ],
    presets: [
        { name: 'weekly', label: 'Semanal (1,1,1)(1,1,1,7)', description: 'Vendas diárias com padrão semanal', config: { p: 1, d: 1, q: 1, P: 1, D: 1, Q: 1, s: 7 }, estimatedTime: '~5s', expectedAccuracy: 'MAPE ~8-15%' },
        { name: 'monthly', label: 'Mensal (1,1,1)(1,1,1,12)', description: 'Dados mensais com sazonalidade anual', config: { p: 1, d: 1, q: 1, P: 1, D: 1, Q: 1, s: 12 }, estimatedTime: '~8s', expectedAccuracy: 'MAPE ~10-18%' },
        { name: 'annual', label: 'Anual (2,1,2)(1,1,1,52)', description: 'Dados semanais com sazonalidade anual', config: { p: 2, d: 1, q: 2, P: 1, D: 1, Q: 1, s: 52 }, estimatedTime: '~15s', expectedAccuracy: 'MAPE ~12-20%' }
    ],
    dataRequirements: { minSamples: 60, idealSamples: 200, maxSamples: null, minFeatures: 1, maxFeatures: 1, notes: 'Use auto_arima com seasonal=True. Precisa de pelo menos 2 ciclos sazonais.' },
    baseAccuracy: 0.80
};

export const EXPONENTIAL_SMOOTHING: AlgorithmDefinition = {
    id: 'exponential_smoothing',
    name: 'Exponential Smoothing (Holt-Winters)',
    category: 'time_series',
    library: 'statsmodels.tsa.holtwinters.ExponentialSmoothing',
    description: 'Suavização exponencial com componentes de tendência e sazonalidade.',
    hyperparameters: [
        // Components
        { name: 'trend', label: 'Tendência', type: 'select', default: null, options: [{ value: null, label: 'Nenhuma (SES)' }, { value: 'add', label: 'Aditiva (Holt)' }, { value: 'mul', label: 'Multiplicativa' }], description: 'Tipo de tendência', impact: 'high', category: 'basic' },
        { name: 'damped_trend', label: 'Tendência Amortecida', type: 'boolean', default: false, description: 'Amortecer tendência (mais conservador)', impact: 'medium', category: 'basic' },
        { name: 'seasonal', label: 'Sazonalidade', type: 'select', default: null, options: [{ value: null, label: 'Nenhuma (Holt)' }, { value: 'add', label: 'Aditiva (HW-Add)' }, { value: 'mul', label: 'Multiplicativa (HW-Mul)' }], description: 'Tipo de sazonalidade', impact: 'high', category: 'basic' },
        { name: 'seasonal_periods', label: 'Período Sazonal', type: 'select', default: null, options: [{ value: null, label: 'Nenhum' }, { value: 4, label: '4 (Trimestral)' }, { value: 7, label: '7 (Semanal)' }, { value: 12, label: '12 (Mensal)' }, { value: 52, label: '52 (Semanal-Anual)' }, { value: 365, label: '365 (Diário-Anual)' }], description: 'Período da sazonalidade', impact: 'high', category: 'basic' },
        // Smoothing Parameters (when not optimized)
        { name: 'smoothing_level', label: 'Alpha (α) - Nível', type: 'number', default: null, min: 0.1, max: 0.9, step: 0.1, description: 'Peso do nível (null=otimizar)', impact: 'high', category: 'basic' },
        { name: 'smoothing_trend', label: 'Beta (β) - Tendência', type: 'number', default: null, min: 0.1, max: 0.5, step: 0.1, description: 'Peso da tendência (null=otimizar)', impact: 'medium', category: 'basic' },
        { name: 'smoothing_seasonal', label: 'Gamma (γ) - Sazonal', type: 'number', default: null, min: 0.1, max: 0.5, step: 0.1, description: 'Peso da sazonalidade (null=otimizar)', impact: 'medium', category: 'basic' },
        // Optimization
        { name: 'optimized', label: 'Otimizar Parâmetros', type: 'boolean', default: true, description: 'Otimizar α, β, γ automaticamente', impact: 'high', category: 'optimization' },
        { name: 'use_boxcox', label: 'Usar BoxCox', type: 'boolean', default: false, description: 'Transformação BoxCox para estabilizar variância', impact: 'medium', category: 'advanced' }
    ],
    presets: [
        { name: 'ses', label: 'SES (Simples)', description: 'Sem tendência, sem sazonalidade', config: { trend: null, seasonal: null, optimized: true }, estimatedTime: '~1s', expectedAccuracy: 'MAPE ~15-25%' },
        { name: 'holt', label: 'Holt', description: 'Tendência, sem sazonalidade', config: { trend: 'add', seasonal: null, optimized: true }, estimatedTime: '~2s', expectedAccuracy: 'MAPE ~12-20%' },
        { name: 'hw_add', label: 'Holt-Winters Aditivo', description: 'Sazonalidade constante', config: { trend: 'add', seasonal: 'add', seasonal_periods: 7, optimized: true }, estimatedTime: '~3s', expectedAccuracy: 'MAPE ~10-15%' },
        { name: 'hw_mul', label: 'Holt-Winters Multiplicativo', description: 'Sazonalidade crescente', config: { trend: 'add', seasonal: 'mul', seasonal_periods: 7, optimized: true }, estimatedTime: '~3s', expectedAccuracy: 'MAPE ~8-12%' },
        { name: 'damped', label: 'Damped Trend', description: 'Tendência amortecida', config: { trend: 'add', damped_trend: true, seasonal: 'add', seasonal_periods: 7, optimized: true }, estimatedTime: '~3s', expectedAccuracy: 'MAPE ~10-15%' }
    ],
    dataRequirements: { minSamples: 30, idealSamples: 100, maxSamples: null, minFeatures: 1, maxFeatures: 1, notes: 'Para sazonalidade, precisa de pelo menos 2 ciclos de dados.' },
    baseAccuracy: 0.82
};
