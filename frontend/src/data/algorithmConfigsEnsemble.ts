// Part 2: Ensemble Regressors - Random Forest, Gradient Boosting, XGBoost, LightGBM
import { AlgorithmDefinition } from './algorithmConfigs';

export const RANDOM_FOREST_REGRESSOR: AlgorithmDefinition = {
    id: 'random_forest_regressor',
    name: 'Random Forest Regressor',
    category: 'regression',
    library: 'sklearn.ensemble.RandomForestRegressor',
    description: 'Ensemble of decision trees for robust predictions.',
    hyperparameters: [
        { name: 'n_estimators', label: 'Number of Trees', type: 'integer', default: 100, min: 50, max: 1000, step: 50, description: 'Number of trees in the forest', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300, 500] },
        { name: 'criterion', label: 'Criterion', type: 'select', default: 'squared_error', options: [{ value: 'squared_error', label: 'Squared Error' }, { value: 'absolute_error', label: 'Absolute Error' }, { value: 'poisson', label: 'Poisson' }], description: 'Split quality metric', impact: 'medium', category: 'tree' },
        { name: 'max_depth', label: 'Max Depth', type: 'integer', default: 15, min: 3, max: 30, description: 'Maximum tree depth', impact: 'high', category: 'tree', gridSearchRange: [10, 15, 20] },
        { name: 'min_samples_split', label: 'Min Samples Split', type: 'integer', default: 2, min: 2, max: 20, description: 'Minimum samples to split node', impact: 'high', category: 'tree', gridSearchRange: [2, 5, 10] },
        { name: 'min_samples_leaf', label: 'Min Samples Leaf', type: 'integer', default: 1, min: 1, max: 10, description: 'Minimum samples per leaf', impact: 'high', category: 'tree' },
        { name: 'max_features', label: 'Max Features', type: 'select', default: 'sqrt', options: [{ value: 'sqrt', label: 'Sqrt' }, { value: 'log2', label: 'Log2' }, { value: 'auto', label: 'Auto' }], description: 'Features per split', impact: 'high', category: 'tree', gridSearchRange: ['sqrt', 'log2'] },
        { name: 'max_leaf_nodes', label: 'Max Leaf Nodes', type: 'integer', default: null, min: 10, max: 1000, description: 'Maximum leaf nodes', impact: 'medium', category: 'tree' },
        { name: 'min_impurity_decrease', label: 'Min Impurity Decrease', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, description: 'Minimum impurity decrease', impact: 'medium', category: 'tree' },
        { name: 'bootstrap', label: 'Bootstrap', type: 'boolean', default: true, description: 'Use bootstrap samples', impact: 'medium', category: 'ensemble' },
        { name: 'oob_score', label: 'OOB Score', type: 'boolean', default: false, description: 'Calculate out-of-bag score', impact: 'low', category: 'ensemble' },
        { name: 'n_jobs', label: 'Number of Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'CPUs to use', impact: 'low', category: 'optimization' },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'warm_start', label: 'Warm Start', type: 'boolean', default: false, description: 'Reuse trees', impact: 'low', category: 'optimization' },
        { name: 'ccp_alpha', label: 'CCP Alpha', type: 'number', default: 0, min: 0, max: 0.1, step: 0.001, description: 'Complexity pruning', impact: 'medium', category: 'tree' },
        { name: 'max_samples', label: 'Max Samples', type: 'number', default: null, min: 0.5, max: 1.0, step: 0.1, description: 'Samples per tree', impact: 'medium', category: 'ensemble' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Treinamento rápido', config: { n_estimators: 100, max_depth: 10, min_samples_split: 5 }, estimatedTime: '~15s', expectedAccuracy: '82%' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 300, max_depth: 15, min_samples_split: 2 }, estimatedTime: '~40s', expectedAccuracy: '87%' },
        { name: 'accurate', label: 'Preciso', description: 'Melhor acurácia', config: { n_estimators: 500, max_depth: 20, min_samples_split: 2, min_samples_leaf: 1 }, estimatedTime: '~80s', expectedAccuracy: '89%' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 5000, maxSamples: null, minFeatures: 3, maxFeatures: null },
    baseAccuracy: 0.85
};

export const GRADIENT_BOOSTING_REGRESSOR: AlgorithmDefinition = {
    id: 'gradient_boosting_regressor',
    name: 'Gradient Boosting Regressor',
    category: 'regression',
    library: 'sklearn.ensemble.GradientBoostingRegressor',
    description: 'Sequential ensemble that corrects errors of previous trees.',
    hyperparameters: [
        { name: 'loss', label: 'Loss Function', type: 'select', default: 'squared_error', options: [{ value: 'squared_error', label: 'Squared Error' }, { value: 'absolute_error', label: 'Absolute Error' }, { value: 'huber', label: 'Huber' }], description: 'Loss function', impact: 'medium', category: 'basic' },
        { name: 'learning_rate', label: 'Learning Rate', type: 'number', default: 0.1, min: 0.001, max: 0.5, step: 0.01, description: 'Shrinks contribution', impact: 'high', category: 'optimization', gridSearchRange: [0.01, 0.05, 0.1] },
        { name: 'n_estimators', label: 'Number of Trees', type: 'integer', default: 100, min: 50, max: 1000, step: 50, description: 'Number of boosting stages', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300] },
        { name: 'subsample', label: 'Subsample', type: 'number', default: 1.0, min: 0.5, max: 1.0, step: 0.1, description: 'Fraction of samples', impact: 'high', category: 'ensemble', gridSearchRange: [0.8, 1.0] },
        { name: 'criterion', label: 'Criterion', type: 'select', default: 'friedman_mse', options: [{ value: 'friedman_mse', label: 'Friedman MSE' }, { value: 'squared_error', label: 'Squared Error' }], description: 'Split quality', impact: 'low', category: 'tree' },
        { name: 'min_samples_split', label: 'Min Samples Split', type: 'integer', default: 2, min: 2, max: 20, description: 'Minimum to split', impact: 'high', category: 'tree' },
        { name: 'min_samples_leaf', label: 'Min Samples Leaf', type: 'integer', default: 1, min: 1, max: 10, description: 'Minimum per leaf', impact: 'medium', category: 'tree' },
        { name: 'max_depth', label: 'Max Depth', type: 'integer', default: 3, min: 2, max: 10, description: 'Tree depth', impact: 'high', category: 'tree', gridSearchRange: [3, 5, 7] },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'max_features', label: 'Max Features', type: 'select', default: 'auto', options: [{ value: 'sqrt', label: 'Sqrt' }, { value: 'log2', label: 'Log2' }, { value: 'auto', label: 'Auto' }], description: 'Features per split', impact: 'medium', category: 'tree' },
        { name: 'alpha', label: 'Alpha (Huber)', type: 'number', default: 0.9, min: 0.1, max: 0.99, step: 0.01, description: 'Quantile for Huber', impact: 'medium', category: 'basic' },
        { name: 'validation_fraction', label: 'Validation Fraction', type: 'number', default: 0.1, min: 0.1, max: 0.3, step: 0.05, description: 'Validation set size', impact: 'low', category: 'optimization' },
        { name: 'n_iter_no_change', label: 'Early Stopping', type: 'integer', default: null, min: 5, max: 50, description: 'Iterations without improvement', impact: 'medium', category: 'optimization' },
        { name: 'tol', label: 'Tolerance', type: 'number', default: 0.0001, min: 0.00001, max: 0.01, step: 0.0001, description: 'Tolerance', impact: 'low', category: 'optimization' },
        { name: 'ccp_alpha', label: 'CCP Alpha', type: 'number', default: 0, min: 0, max: 0.1, step: 0.001, description: 'Complexity pruning', impact: 'medium', category: 'tree' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Treinamento rápido', config: { n_estimators: 100, learning_rate: 0.1, max_depth: 3 }, estimatedTime: '~20s', expectedAccuracy: '80%' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 200, learning_rate: 0.05, max_depth: 5, subsample: 0.8 }, estimatedTime: '~40s', expectedAccuracy: '84%' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 5000, maxSamples: 100000, minFeatures: 3, maxFeatures: null },
    baseAccuracy: 0.83
};

export const XGBOOST_REGRESSOR: AlgorithmDefinition = {
    id: 'xgboost_regressor',
    name: 'XGBoost Regressor',
    category: 'regression',
    library: 'xgboost.XGBRegressor',
    description: 'Optimized gradient boosting with regularization and speed.',
    hyperparameters: [
        { name: 'n_estimators', label: 'Número de Árvores', type: 'integer', default: 100, min: 50, max: 2000, step: 50, description: 'Número de rounds de boosting', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300, 500] },
        { name: 'learning_rate', label: 'Taxa de Aprendizado', type: 'number', default: 0.1, min: 0.001, max: 0.5, step: 0.01, description: 'Step size shrinkage', impact: 'high', category: 'optimization', gridSearchRange: [0.01, 0.05, 0.1] },
        { name: 'max_depth', label: 'Profundidade Máxima', type: 'integer', default: 6, min: 2, max: 15, description: 'Profundidade máxima da árvore', impact: 'high', category: 'tree', gridSearchRange: [3, 5, 7, 9] },
        { name: 'min_child_weight', label: 'Peso Mínimo Filho', type: 'integer', default: 1, min: 1, max: 20, description: 'Soma mínima de pesos', impact: 'high', category: 'tree', gridSearchRange: [1, 3, 5] },
        { name: 'gamma', label: 'Gamma', type: 'number', default: 0, min: 0, max: 10, step: 0.1, description: 'Redução mínima de loss', impact: 'high', category: 'tree', gridSearchRange: [0, 0.1, 0.2] },
        { name: 'subsample', label: 'Subsample', type: 'number', default: 1.0, min: 0.5, max: 1.0, step: 0.1, description: 'Amostragem de linhas', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        { name: 'colsample_bytree', label: 'Column Sample', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Amostragem de features', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        { name: 'colsample_bylevel', label: 'Col Sample Level', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Features por nível', impact: 'medium', category: 'ensemble' },
        { name: 'colsample_bynode', label: 'Col Sample Node', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Features por nó', impact: 'medium', category: 'ensemble' },
        { name: 'reg_alpha', label: 'Regularização L1', type: 'number', default: 0, min: 0, max: 10, step: 0.01, description: 'Regularização L1 (Lasso)', impact: 'high', category: 'regularization', gridSearchRange: [0, 0.01, 0.1] },
        { name: 'reg_lambda', label: 'Regularização L2', type: 'number', default: 1, min: 0, max: 10, step: 0.1, description: 'Regularização L2 (Ridge)', impact: 'high', category: 'regularization', gridSearchRange: [1, 5, 10] },
        { name: 'scale_pos_weight', label: 'Scale Pos Weight', type: 'number', default: 1, min: 1, max: 100, step: 1, description: 'Balancear classes', impact: 'medium', category: 'basic' },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'n_jobs', label: 'Número de Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'CPUs', impact: 'low', category: 'optimization' },
        { name: 'booster', label: 'Booster', type: 'select', default: 'gbtree', options: [{ value: 'gbtree', label: 'GBTree' }, { value: 'gblinear', label: 'GBLinear' }, { value: 'dart', label: 'DART' }], description: 'Tipo de booster', impact: 'medium', category: 'basic' },
        { name: 'tree_method', label: 'Método de Árvore', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: 'exact', label: 'Exato' }, { value: 'approx', label: 'Aproximado' }, { value: 'hist', label: 'Histograma' }], description: 'Construção de árvore', impact: 'medium', category: 'optimization' },
        { name: 'objective', label: 'Objetivo', type: 'select', default: 'reg:squarederror', options: [{ value: 'reg:squarederror', label: 'Erro Quadrático' }, { value: 'reg:logistic', label: 'Logístico' }], description: 'Objetivo de aprendizado', impact: 'medium', category: 'basic' },
        { name: 'early_stopping_rounds', label: 'Early Stopping', type: 'integer', default: null, min: 10, max: 100, description: 'Rounds sem melhoria', impact: 'medium', category: 'optimization' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Treinamento rápido', config: { n_estimators: 100, learning_rate: 0.1, max_depth: 5, subsample: 0.8, colsample_bytree: 0.8 }, estimatedTime: '~10s', expectedAccuracy: '85%' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 300, learning_rate: 0.05, max_depth: 6, min_child_weight: 3, gamma: 0.1, subsample: 0.8, colsample_bytree: 0.8, reg_alpha: 0.1, reg_lambda: 1 }, estimatedTime: '~30s', expectedAccuracy: '89%' },
        { name: 'accurate', label: 'Preciso', description: 'Melhor acurácia', config: { n_estimators: 500, learning_rate: 0.03, max_depth: 8, min_child_weight: 1, subsample: 0.8, colsample_bytree: 0.8, reg_alpha: 0.05, reg_lambda: 1 }, estimatedTime: '~60s', expectedAccuracy: '92%' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 10000, maxSamples: null, minFeatures: 5, maxFeatures: null },
    baseAccuracy: 0.88
};

export const LIGHTGBM_REGRESSOR: AlgorithmDefinition = {
    id: 'lightgbm_regressor',
    name: 'LightGBM Regressor',
    category: 'regression',
    library: 'lightgbm.LGBMRegressor',
    description: 'Fast gradient boosting with histogram-based algorithm.',
    hyperparameters: [
        { name: 'boosting_type', label: 'Tipo de Boosting', type: 'select', default: 'gbdt', options: [{ value: 'gbdt', label: 'GBDT' }, { value: 'dart', label: 'DART' }, { value: 'goss', label: 'GOSS' }, { value: 'rf', label: 'Random Forest' }], description: 'Algoritmo de boosting', impact: 'medium', category: 'basic' },
        { name: 'num_leaves', label: 'Número de Folhas', type: 'integer', default: 31, min: 10, max: 500, step: 10, description: 'Folhas por árvore', impact: 'high', category: 'tree', gridSearchRange: [31, 63, 127] },
        { name: 'max_depth', label: 'Profundidade Máxima', type: 'integer', default: -1, min: -1, max: 20, description: 'Prof. máxima (-1=ilimitado)', impact: 'high', category: 'tree' },
        { name: 'learning_rate', label: 'Taxa de Aprendizado', type: 'number', default: 0.1, min: 0.001, max: 0.5, step: 0.01, description: 'Step size', impact: 'high', category: 'optimization', gridSearchRange: [0.01, 0.05, 0.1] },
        { name: 'n_estimators', label: 'Número de Árvores', type: 'integer', default: 100, min: 50, max: 2000, step: 50, description: 'Iterações de boosting', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300] },
        { name: 'objective', label: 'Objetivo', type: 'select', default: 'regression', options: [{ value: 'regression', label: 'Regressão' }, { value: 'regression_l1', label: 'Regressão L1' }, { value: 'huber', label: 'Huber' }], description: 'Objetivo de aprendizado', impact: 'medium', category: 'basic' },
        { name: 'min_split_gain', label: 'Ganho Mínimo Split', type: 'number', default: 0, min: 0, max: 1, step: 0.01, description: 'Ganho mínimo para split', impact: 'high', category: 'tree' },
        { name: 'min_child_weight', label: 'Peso Mínimo Filho', type: 'number', default: 0.001, min: 0, max: 0.1, step: 0.001, description: 'Hessian sum em folha', impact: 'medium', category: 'tree' },
        { name: 'min_child_samples', label: 'Amostras Mínimas Filho', type: 'integer', default: 20, min: 5, max: 200, step: 5, description: 'Dados mínimos em folha', impact: 'high', category: 'tree', gridSearchRange: [20, 30, 50] },
        { name: 'subsample', label: 'Subsample', type: 'number', default: 1.0, min: 0.5, max: 1.0, step: 0.1, description: 'Ratio de amostragem', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        { name: 'subsample_freq', label: 'Freq Subsample', type: 'integer', default: 0, min: 0, max: 10, description: 'Frequência de subsample', impact: 'medium', category: 'ensemble' },
        { name: 'colsample_bytree', label: 'Column Sample', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Amostragem de features', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        { name: 'reg_alpha', label: 'Regularização L1', type: 'number', default: 0, min: 0, max: 10, step: 0.01, description: 'Regularização L1', impact: 'high', category: 'regularization', gridSearchRange: [0, 0.01, 0.1] },
        { name: 'reg_lambda', label: 'Regularização L2', type: 'number', default: 0, min: 0, max: 10, step: 0.01, description: 'Regularização L2', impact: 'high', category: 'regularization', gridSearchRange: [0, 0.01, 0.1] },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'n_jobs', label: 'Número de Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'CPUs', impact: 'low', category: 'optimization' },
        { name: 'importance_type', label: 'Tipo de Importância', type: 'select', default: 'split', options: [{ value: 'split', label: 'Split' }, { value: 'gain', label: 'Gain' }], description: 'Importância de features', impact: 'low', category: 'advanced' },
        { name: 'verbose', label: 'Verbose', type: 'integer', default: -1, min: -1, max: 2, description: 'Verbosidade', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Treinamento muito rápido', config: { n_estimators: 100, learning_rate: 0.1, num_leaves: 31, min_child_samples: 20, subsample: 0.8, colsample_bytree: 0.8, verbose: -1 }, estimatedTime: '~5s', expectedAccuracy: '85%' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 300, learning_rate: 0.05, num_leaves: 63, min_child_samples: 30, subsample: 0.8, subsample_freq: 1, colsample_bytree: 0.8, reg_alpha: 0.1, reg_lambda: 0.1, verbose: -1 }, estimatedTime: '~15s', expectedAccuracy: '89%' },
        { name: 'accurate', label: 'Preciso', description: 'Melhor acurácia', config: { n_estimators: 500, learning_rate: 0.03, num_leaves: 127, max_depth: 8, min_child_samples: 20, subsample: 0.8, subsample_freq: 1, colsample_bytree: 0.8, reg_alpha: 0.05, reg_lambda: 0.1, verbose: -1 }, estimatedTime: '~25s', expectedAccuracy: '91%' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 10000, maxSamples: null, minFeatures: 5, maxFeatures: null, notes: 'Muito rápido mesmo com datasets grandes' },
    baseAccuracy: 0.88
};
