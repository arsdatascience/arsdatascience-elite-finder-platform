// Part 2: Ensemble Regressors - Random Forest, Gradient Boosting, XGBoost, LightGBM
// 100% of parameters as specified
import { AlgorithmDefinition } from './algorithmConfigs';

export const RANDOM_FOREST_REGRESSOR: AlgorithmDefinition = {
    id: 'random_forest_regressor',
    name: 'Random Forest Regressor',
    category: 'regression',
    library: 'sklearn.ensemble.RandomForestRegressor',
    description: 'Ensemble de árvores de decisão para previsões robustas.',
    hyperparameters: [
        // Ensemble Parameters
        { name: 'n_estimators', label: 'Número de Árvores', type: 'integer', default: 100, min: 50, max: 1000, step: 50, description: 'Número de árvores na floresta', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300, 500] },
        { name: 'bootstrap', label: 'Bootstrap', type: 'boolean', default: true, description: 'Usar amostras bootstrap', impact: 'medium', category: 'ensemble' },
        { name: 'oob_score', label: 'OOB Score', type: 'boolean', default: false, description: 'Calcular score out-of-bag', impact: 'low', category: 'ensemble' },
        { name: 'max_samples', label: 'Max Samples', type: 'number', default: null, min: 0.5, max: 1.0, step: 0.1, description: 'Máximo de samples por árvore (fração)', impact: 'medium', category: 'ensemble' },
        // Tree Parameters
        { name: 'criterion', label: 'Critério', type: 'select', default: 'squared_error', options: [{ value: 'squared_error', label: 'Erro Quadrático' }, { value: 'absolute_error', label: 'Erro Absoluto' }, { value: 'poisson', label: 'Poisson' }], description: 'Métrica de qualidade do split', impact: 'medium', category: 'tree' },
        { name: 'max_depth', label: 'Profundidade Máxima', type: 'integer', default: null, min: 3, max: 30, description: 'Profundidade máxima (null=ilimitado)', impact: 'high', category: 'tree', gridSearchRange: [10, 15, 20, null] },
        { name: 'min_samples_split', label: 'Mín Samples Split', type: 'integer', default: 2, min: 2, max: 20, description: 'Mínimo de amostras para dividir nó', impact: 'high', category: 'tree', gridSearchRange: [2, 5, 10] },
        { name: 'min_samples_leaf', label: 'Mín Samples Folha', type: 'integer', default: 1, min: 1, max: 10, description: 'Mínimo de amostras por folha', impact: 'high', category: 'tree' },
        { name: 'min_weight_fraction_leaf', label: 'Peso Mín Folha', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, description: 'Fração mínima de peso por folha', impact: 'medium', category: 'tree' },
        { name: 'max_features', label: 'Max Features', type: 'select', default: 'sqrt', options: [{ value: 'sqrt', label: 'Sqrt (Raiz Quadrada)' }, { value: 'log2', label: 'Log2' }, { value: null, label: 'Todas' }], description: 'Features consideradas por split', impact: 'high', category: 'tree', gridSearchRange: ['sqrt', 'log2'] },
        { name: 'max_leaf_nodes', label: 'Máx Leaf Nodes', type: 'integer', default: null, min: 10, max: 1000, description: 'Número máximo de folhas', impact: 'medium', category: 'tree' },
        { name: 'min_impurity_decrease', label: 'Mín Impurity Decrease', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, description: 'Redução mínima de impureza para split', impact: 'medium', category: 'tree' },
        { name: 'ccp_alpha', label: 'CCP Alpha', type: 'number', default: 0, min: 0, max: 0.1, step: 0.001, description: 'Parâmetro de poda de complexidade', impact: 'medium', category: 'tree' },
        // Advanced
        { name: 'n_jobs', label: 'Número de Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'CPUs a usar (-1 = todas)', impact: 'low', category: 'advanced' },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed para reprodutibilidade', impact: 'low', category: 'advanced' },
        { name: 'verbose', label: 'Verbose', type: 'integer', default: 0, min: 0, max: 2, description: 'Nível de verbosidade', impact: 'low', category: 'advanced' },
        { name: 'warm_start', label: 'Warm Start', type: 'boolean', default: false, description: 'Reutilizar árvores anteriores', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Treinamento rápido', config: { n_estimators: 100, max_depth: 10, min_samples_split: 5, max_features: 'sqrt', n_jobs: -1, random_state: 42 }, estimatedTime: '~15s', expectedAccuracy: 'R² ~0.82' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 300, max_depth: 15, min_samples_split: 2, max_features: 'sqrt', n_jobs: -1, random_state: 42 }, estimatedTime: '~40s', expectedAccuracy: 'R² ~0.87' },
        { name: 'accurate', label: 'Preciso', description: 'Melhor acurácia', config: { n_estimators: 500, max_depth: 20, min_samples_split: 2, min_samples_leaf: 1, max_features: 'sqrt', n_jobs: -1, random_state: 42 }, estimatedTime: '~80s', expectedAccuracy: 'R² ~0.89' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 5000, maxSamples: null, minFeatures: 3, maxFeatures: null },
    baseAccuracy: 0.85
};

export const GRADIENT_BOOSTING_REGRESSOR: AlgorithmDefinition = {
    id: 'gradient_boosting_regressor',
    name: 'Gradient Boosting Regressor',
    category: 'regression',
    library: 'sklearn.ensemble.GradientBoostingRegressor',
    description: 'Ensemble sequencial que corrige erros das árvores anteriores.',
    hyperparameters: [
        // Basic
        { name: 'loss', label: 'Função de Loss', type: 'select', default: 'squared_error', options: [{ value: 'squared_error', label: 'Erro Quadrático' }, { value: 'absolute_error', label: 'Erro Absoluto' }, { value: 'huber', label: 'Huber' }], description: 'Função de loss a otimizar', impact: 'medium', category: 'basic' },
        { name: 'alpha', label: 'Alpha (Huber)', type: 'number', default: 0.9, min: 0.1, max: 0.99, step: 0.01, description: 'Quantil para loss Huber', impact: 'medium', category: 'basic' },
        // Optimization
        { name: 'learning_rate', label: 'Taxa de Aprendizado', type: 'number', default: 0.1, min: 0.001, max: 0.5, step: 0.01, description: 'Shrinkage da contribuição de cada árvore', impact: 'high', category: 'optimization', gridSearchRange: [0.01, 0.05, 0.1] },
        { name: 'n_estimators', label: 'Número de Árvores', type: 'integer', default: 100, min: 50, max: 1000, step: 50, description: 'Número de estágios de boosting', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300] },
        { name: 'subsample', label: 'Subsample', type: 'number', default: 1.0, min: 0.5, max: 1.0, step: 0.1, description: 'Fração de amostras por árvore', impact: 'high', category: 'ensemble', gridSearchRange: [0.8, 1.0] },
        // Tree
        { name: 'criterion', label: 'Critério', type: 'select', default: 'friedman_mse', options: [{ value: 'friedman_mse', label: 'Friedman MSE' }, { value: 'squared_error', label: 'Erro Quadrático' }], description: 'Métrica de split', impact: 'low', category: 'tree' },
        { name: 'min_samples_split', label: 'Mín Samples Split', type: 'integer', default: 2, min: 2, max: 20, description: 'Mínimo para dividir', impact: 'high', category: 'tree' },
        { name: 'min_samples_leaf', label: 'Mín Samples Folha', type: 'integer', default: 1, min: 1, max: 10, description: 'Mínimo por folha', impact: 'medium', category: 'tree' },
        { name: 'min_weight_fraction_leaf', label: 'Peso Mín Folha', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, description: 'Fração mínima de peso', impact: 'medium', category: 'tree' },
        { name: 'max_depth', label: 'Profundidade Máxima', type: 'integer', default: 3, min: 2, max: 10, description: 'Profundidade das árvores', impact: 'high', category: 'tree', gridSearchRange: [3, 5, 7] },
        { name: 'min_impurity_decrease', label: 'Mín Impurity Decrease', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, description: 'Redução mínima para split', impact: 'medium', category: 'tree' },
        { name: 'max_features', label: 'Max Features', type: 'select', default: null, options: [{ value: 'sqrt', label: 'Sqrt' }, { value: 'log2', label: 'Log2' }, { value: null, label: 'Todas' }], description: 'Features por split', impact: 'medium', category: 'tree' },
        { name: 'max_leaf_nodes', label: 'Máx Leaf Nodes', type: 'integer', default: null, min: 10, max: 1000, description: 'Máximo de folhas', impact: 'medium', category: 'tree' },
        { name: 'ccp_alpha', label: 'CCP Alpha', type: 'number', default: 0, min: 0, max: 0.1, step: 0.001, description: 'Poda de complexidade', impact: 'medium', category: 'tree' },
        // Early Stopping
        { name: 'validation_fraction', label: 'Fração Validação', type: 'number', default: 0.1, min: 0.1, max: 0.3, step: 0.05, description: 'Tamanho do set de validação', impact: 'low', category: 'optimization' },
        { name: 'n_iter_no_change', label: 'Early Stopping', type: 'integer', default: null, min: 5, max: 50, description: 'Iterações sem melhoria para parar', impact: 'medium', category: 'optimization' },
        { name: 'tol', label: 'Tolerância', type: 'number', default: 0.0001, min: 0.00001, max: 0.01, step: 0.0001, description: 'Tolerância para early stopping', impact: 'low', category: 'optimization' },
        // Advanced
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'verbose', label: 'Verbose', type: 'integer', default: 0, min: 0, max: 2, description: 'Verbosidade', impact: 'low', category: 'advanced' },
        { name: 'warm_start', label: 'Warm Start', type: 'boolean', default: false, description: 'Reutilizar modelo', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Treinamento rápido', config: { n_estimators: 100, learning_rate: 0.1, max_depth: 3, random_state: 42 }, estimatedTime: '~20s', expectedAccuracy: 'R² ~0.80' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 200, learning_rate: 0.05, max_depth: 5, subsample: 0.8, random_state: 42 }, estimatedTime: '~40s', expectedAccuracy: 'R² ~0.84' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 5000, maxSamples: 100000, minFeatures: 3, maxFeatures: null },
    baseAccuracy: 0.83
};

export const XGBOOST_REGRESSOR: AlgorithmDefinition = {
    id: 'xgboost_regressor',
    name: 'XGBoost Regressor',
    category: 'regression',
    library: 'xgboost.XGBRegressor',
    description: 'Gradient boosting otimizado com regularização e velocidade.',
    hyperparameters: [
        // Core
        { name: 'n_estimators', label: 'Número de Árvores', type: 'integer', default: 100, min: 50, max: 2000, step: 50, description: 'Número de rounds de boosting', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300, 500] },
        { name: 'learning_rate', label: 'Taxa de Aprendizado', type: 'number', default: 0.1, min: 0.001, max: 0.5, step: 0.01, description: 'Step size shrinkage', impact: 'high', category: 'optimization', gridSearchRange: [0.01, 0.05, 0.1] },
        { name: 'booster', label: 'Booster', type: 'select', default: 'gbtree', options: [{ value: 'gbtree', label: 'GBTree' }, { value: 'gblinear', label: 'GBLinear' }, { value: 'dart', label: 'DART' }], description: 'Tipo de booster', impact: 'medium', category: 'basic' },
        { name: 'objective', label: 'Objetivo', type: 'select', default: 'reg:squarederror', options: [{ value: 'reg:squarederror', label: 'Erro Quadrático' }, { value: 'reg:logistic', label: 'Logístico' }], description: 'Função objetivo', impact: 'medium', category: 'basic' },
        { name: 'tree_method', label: 'Método de Árvore', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: 'exact', label: 'Exato' }, { value: 'approx', label: 'Aproximado' }, { value: 'hist', label: 'Histograma' }], description: 'Algoritmo de construção', impact: 'medium', category: 'optimization' },
        // Tree
        { name: 'max_depth', label: 'Profundidade Máxima', type: 'integer', default: 6, min: 2, max: 15, description: 'Profundidade máxima da árvore', impact: 'high', category: 'tree', gridSearchRange: [3, 5, 7, 9] },
        { name: 'min_child_weight', label: 'Peso Mínimo Filho', type: 'integer', default: 1, min: 1, max: 20, description: 'Soma mínima de pesos para filho', impact: 'high', category: 'tree', gridSearchRange: [1, 3, 5] },
        { name: 'gamma', label: 'Gamma', type: 'number', default: 0, min: 0, max: 10, step: 0.1, description: 'Redução mínima de loss para split', impact: 'high', category: 'tree', gridSearchRange: [0, 0.1, 0.2] },
        { name: 'max_delta_step', label: 'Max Delta Step', type: 'integer', default: 0, min: 0, max: 10, description: 'Limite de delta step', impact: 'low', category: 'tree' },
        // Sampling
        { name: 'subsample', label: 'Subsample', type: 'number', default: 1.0, min: 0.5, max: 1.0, step: 0.1, description: 'Amostragem de linhas', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        { name: 'colsample_bytree', label: 'Column Sample Tree', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Amostragem de features por árvore', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        { name: 'colsample_bylevel', label: 'Column Sample Level', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Amostragem de features por nível', impact: 'medium', category: 'ensemble' },
        { name: 'colsample_bynode', label: 'Column Sample Node', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Amostragem de features por nó', impact: 'medium', category: 'ensemble' },
        // Regularization
        { name: 'reg_alpha', label: 'Regularização L1', type: 'number', default: 0, min: 0, max: 10, step: 0.01, description: 'Regularização L1 (Lasso)', impact: 'high', category: 'regularization', gridSearchRange: [0, 0.01, 0.1] },
        { name: 'reg_lambda', label: 'Regularização L2', type: 'number', default: 1, min: 0, max: 10, step: 0.1, description: 'Regularização L2 (Ridge)', impact: 'high', category: 'regularization', gridSearchRange: [1, 5, 10] },
        // Other
        { name: 'scale_pos_weight', label: 'Scale Pos Weight', type: 'number', default: 1, min: 1, max: 100, step: 1, description: 'Peso da classe positiva', impact: 'medium', category: 'basic' },
        { name: 'base_score', label: 'Base Score', type: 'number', default: 0.5, min: 0, max: 1, step: 0.1, description: 'Score inicial', impact: 'low', category: 'advanced' },
        { name: 'importance_type', label: 'Tipo de Importância', type: 'select', default: 'gain', options: [{ value: 'gain', label: 'Gain' }, { value: 'weight', label: 'Weight' }, { value: 'cover', label: 'Cover' }], description: 'Tipo de importância de feature', impact: 'low', category: 'advanced' },
        // Early Stopping
        { name: 'early_stopping_rounds', label: 'Early Stopping Rounds', type: 'integer', default: null, min: 10, max: 100, description: 'Rounds sem melhoria para parar', impact: 'medium', category: 'optimization' },
        // Advanced
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'n_jobs', label: 'Número de Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'CPUs', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Treinamento rápido', config: { n_estimators: 100, learning_rate: 0.1, max_depth: 5, subsample: 0.8, colsample_bytree: 0.8, n_jobs: -1, random_state: 42 }, estimatedTime: '~10s', expectedAccuracy: 'R² ~0.85' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 300, learning_rate: 0.05, max_depth: 6, min_child_weight: 3, gamma: 0.1, subsample: 0.8, colsample_bytree: 0.8, reg_alpha: 0.1, reg_lambda: 1, n_jobs: -1, random_state: 42 }, estimatedTime: '~30s', expectedAccuracy: 'R² ~0.89' },
        { name: 'accurate', label: 'Preciso', description: 'Melhor acurácia', config: { n_estimators: 500, learning_rate: 0.03, max_depth: 8, min_child_weight: 1, gamma: 0, subsample: 0.8, colsample_bytree: 0.8, reg_alpha: 0.05, reg_lambda: 1, n_jobs: -1, random_state: 42 }, estimatedTime: '~60s', expectedAccuracy: 'R² ~0.92' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 10000, maxSamples: null, minFeatures: 5, maxFeatures: null },
    baseAccuracy: 0.88
};

export const LIGHTGBM_REGRESSOR: AlgorithmDefinition = {
    id: 'lightgbm_regressor',
    name: 'LightGBM Regressor',
    category: 'regression',
    library: 'lightgbm.LGBMRegressor',
    description: 'Gradient boosting rápido com algoritmo baseado em histograma.',
    hyperparameters: [
        // Core
        { name: 'boosting_type', label: 'Tipo de Boosting', type: 'select', default: 'gbdt', options: [{ value: 'gbdt', label: 'GBDT (Padrão)' }, { value: 'dart', label: 'DART' }, { value: 'goss', label: 'GOSS' }, { value: 'rf', label: 'Random Forest' }], description: 'Algoritmo de boosting', impact: 'medium', category: 'basic' },
        { name: 'objective', label: 'Objetivo', type: 'select', default: 'regression', options: [{ value: 'regression', label: 'Regressão (L2)' }, { value: 'regression_l1', label: 'Regressão L1' }, { value: 'huber', label: 'Huber' }], description: 'Função objetivo', impact: 'medium', category: 'basic' },
        { name: 'n_estimators', label: 'Número de Árvores', type: 'integer', default: 100, min: 50, max: 2000, step: 50, description: 'Iterações de boosting', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300] },
        { name: 'learning_rate', label: 'Taxa de Aprendizado', type: 'number', default: 0.1, min: 0.001, max: 0.5, step: 0.01, description: 'Step size', impact: 'high', category: 'optimization', gridSearchRange: [0.01, 0.05, 0.1] },
        // Tree
        { name: 'num_leaves', label: 'Número de Folhas', type: 'integer', default: 31, min: 10, max: 500, step: 10, description: 'Folhas por árvore (num_leaves < 2^max_depth)', impact: 'high', category: 'tree', gridSearchRange: [31, 63, 127] },
        { name: 'max_depth', label: 'Profundidade Máxima', type: 'integer', default: -1, min: -1, max: 20, description: 'Profundidade máxima (-1=ilimitado)', impact: 'high', category: 'tree' },
        { name: 'min_split_gain', label: 'Ganho Mínimo Split', type: 'number', default: 0, min: 0, max: 1, step: 0.01, description: 'Ganho mínimo para fazer split', impact: 'high', category: 'tree' },
        { name: 'min_child_weight', label: 'Peso Mínimo Filho', type: 'number', default: 0.001, min: 0, max: 0.1, step: 0.001, description: 'Soma de Hessian em folha', impact: 'medium', category: 'tree' },
        { name: 'min_child_samples', label: 'Amostras Mínimas Filho', type: 'integer', default: 20, min: 5, max: 200, step: 5, description: 'Dados mínimos em folha', impact: 'high', category: 'tree', gridSearchRange: [20, 30, 50] },
        // Sampling
        { name: 'subsample', label: 'Subsample', type: 'number', default: 1.0, min: 0.5, max: 1.0, step: 0.1, description: 'Ratio de amostragem de linhas', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        { name: 'subsample_freq', label: 'Frequência Subsample', type: 'integer', default: 0, min: 0, max: 10, description: 'Frequência de subsample (0=desativado)', impact: 'medium', category: 'ensemble' },
        { name: 'colsample_bytree', label: 'Column Sample', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Amostragem de features', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        // Regularization
        { name: 'reg_alpha', label: 'Regularização L1', type: 'number', default: 0, min: 0, max: 10, step: 0.01, description: 'Regularização L1', impact: 'high', category: 'regularization', gridSearchRange: [0, 0.01, 0.1] },
        { name: 'reg_lambda', label: 'Regularização L2', type: 'number', default: 0, min: 0, max: 10, step: 0.01, description: 'Regularização L2', impact: 'high', category: 'regularization', gridSearchRange: [0, 0.01, 0.1] },
        // Advanced
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'n_jobs', label: 'Número de Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'CPUs', impact: 'low', category: 'advanced' },
        { name: 'importance_type', label: 'Tipo de Importância', type: 'select', default: 'split', options: [{ value: 'split', label: 'Split' }, { value: 'gain', label: 'Gain' }], description: 'Importância de features', impact: 'low', category: 'advanced' },
        { name: 'verbose', label: 'Verbose', type: 'integer', default: -1, min: -1, max: 2, description: 'Verbosidade (-1=silencioso)', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Treinamento muito rápido', config: { n_estimators: 100, learning_rate: 0.1, num_leaves: 31, min_child_samples: 20, subsample: 0.8, colsample_bytree: 0.8, n_jobs: -1, random_state: 42, verbose: -1 }, estimatedTime: '~5s', expectedAccuracy: 'R² ~0.85' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 300, learning_rate: 0.05, num_leaves: 63, min_child_samples: 30, subsample: 0.8, subsample_freq: 1, colsample_bytree: 0.8, reg_alpha: 0.1, reg_lambda: 0.1, n_jobs: -1, random_state: 42, verbose: -1 }, estimatedTime: '~15s', expectedAccuracy: 'R² ~0.89' },
        { name: 'accurate', label: 'Preciso', description: 'Melhor acurácia', config: { n_estimators: 500, learning_rate: 0.03, num_leaves: 127, max_depth: 8, min_child_samples: 20, subsample: 0.8, subsample_freq: 1, colsample_bytree: 0.8, reg_alpha: 0.05, reg_lambda: 0.1, n_jobs: -1, random_state: 42, verbose: -1 }, estimatedTime: '~25s', expectedAccuracy: 'R² ~0.91' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 10000, maxSamples: null, minFeatures: 5, maxFeatures: null, notes: 'Muito rápido mesmo com datasets grandes' },
    baseAccuracy: 0.88
};
