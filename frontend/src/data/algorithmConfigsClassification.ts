// Part 3: Classification Algorithms - 100% of parameters as specified
import { AlgorithmDefinition } from './algorithmConfigs';

export const LOGISTIC_REGRESSION: AlgorithmDefinition = {
    id: 'logistic_regression',
    name: 'Logistic Regression',
    category: 'classification',
    library: 'sklearn.linear_model.LogisticRegression',
    description: 'Modelo linear para classificação binária e multiclasse.',
    hyperparameters: [
        // Regularization
        { name: 'penalty', label: 'Penalidade', type: 'select', default: 'l2', options: [{ value: 'l1', label: 'L1 (Lasso)' }, { value: 'l2', label: 'L2 (Ridge)' }, { value: 'elasticnet', label: 'ElasticNet' }, { value: 'none', label: 'Nenhuma' }], description: 'Tipo de regularização', impact: 'high', category: 'regularization' },
        { name: 'C', label: 'C (Inverso Regularização)', type: 'number', default: 1.0, min: 0.01, max: 100, step: 0.1, description: 'Inverso da força de regularização (menor=mais forte)', impact: 'high', category: 'regularization', gridSearchRange: [0.01, 0.1, 1, 10, 100] },
        { name: 'l1_ratio', label: 'L1 Ratio (ElasticNet)', type: 'number', default: null, min: 0, max: 1, step: 0.1, description: 'Mix L1/L2 para elasticnet (0=L2, 1=L1)', impact: 'medium', category: 'regularization' },
        // Basic
        { name: 'fit_intercept', label: 'Fit Intercept', type: 'boolean', default: true, description: 'Calcular intercepto', impact: 'medium', category: 'basic' },
        { name: 'intercept_scaling', label: 'Intercept Scaling', type: 'number', default: 1, min: 0.1, max: 10, step: 0.1, description: 'Escala do intercepto', impact: 'low', category: 'basic' },
        { name: 'class_weight', label: 'Peso das Classes', type: 'select', default: null, options: [{ value: null, label: 'Nenhum' }, { value: 'balanced', label: 'Balanceado' }], description: 'Balancear classes automaticamente', impact: 'high', category: 'basic', gridSearchRange: [null, 'balanced'] },
        { name: 'multi_class', label: 'Multiclass', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: 'ovr', label: 'One-vs-Rest' }, { value: 'multinomial', label: 'Multinomial' }], description: 'Estratégia multiclasse', impact: 'medium', category: 'basic' },
        // Optimization
        { name: 'solver', label: 'Solver', type: 'select', default: 'lbfgs', options: [{ value: 'lbfgs', label: 'LBFGS (Padrão)' }, { value: 'liblinear', label: 'Liblinear' }, { value: 'newton-cg', label: 'Newton-CG' }, { value: 'sag', label: 'SAG' }, { value: 'saga', label: 'SAGA' }], description: 'Algoritmo de otimização', impact: 'medium', category: 'optimization' },
        { name: 'max_iter', label: 'Máx Iterações', type: 'integer', default: 100, min: 100, max: 1000, step: 100, description: 'Máximo de iterações', impact: 'low', category: 'optimization' },
        { name: 'tol', label: 'Tolerância', type: 'number', default: 0.0001, min: 0.00001, max: 0.01, step: 0.0001, description: 'Tolerância para convergência', impact: 'low', category: 'optimization' },
        { name: 'warm_start', label: 'Warm Start', type: 'boolean', default: false, description: 'Reutilizar solução anterior', impact: 'low', category: 'optimization' },
        // Advanced
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'n_jobs', label: 'Número de Jobs', type: 'integer', default: null, min: -1, max: 16, description: 'CPUs (-1=todas)', impact: 'low', category: 'advanced' },
        { name: 'verbose', label: 'Verbose', type: 'integer', default: 0, min: 0, max: 2, description: 'Verbosidade', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'default', label: 'Padrão', description: 'Configuração padrão', config: { penalty: 'l2', C: 1.0, solver: 'lbfgs', max_iter: 200, random_state: 42 }, estimatedTime: '<1s', expectedAccuracy: 'AUC 0.75-0.85' },
        { name: 'imbalanced', label: 'Dados Desbalanceados', description: 'Para churn, fraude, conversão', config: { penalty: 'l2', C: 1.0, class_weight: 'balanced', solver: 'lbfgs', max_iter: 200, random_state: 42 }, estimatedTime: '<1s', expectedAccuracy: 'AUC 0.78-0.88' },
        { name: 'feature_selection', label: 'Seleção de Features', description: 'Com regularização L1', config: { penalty: 'l1', C: 0.1, solver: 'saga', max_iter: 500, random_state: 42 }, estimatedTime: '~2s', expectedAccuracy: 'AUC 0.72-0.82' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 1000, maxSamples: null, minFeatures: 2, maxFeatures: null },
    baseAccuracy: 0.78
};

export const DECISION_TREE_CLASSIFIER: AlgorithmDefinition = {
    id: 'decision_tree_classifier',
    name: 'Decision Tree Classifier',
    category: 'classification',
    library: 'sklearn.tree.DecisionTreeClassifier',
    description: 'Árvore de decisão única para classificação interpretável.',
    hyperparameters: [
        // Tree
        { name: 'criterion', label: 'Critério', type: 'select', default: 'gini', options: [{ value: 'gini', label: 'Gini Impurity' }, { value: 'entropy', label: 'Entropy' }, { value: 'log_loss', label: 'Log Loss' }], description: 'Métrica de qualidade do split', impact: 'medium', category: 'tree' },
        { name: 'splitter', label: 'Splitter', type: 'select', default: 'best', options: [{ value: 'best', label: 'Best' }, { value: 'random', label: 'Random' }], description: 'Estratégia de split', impact: 'low', category: 'tree' },
        { name: 'max_depth', label: 'Profundidade Máxima', type: 'integer', default: null, min: 3, max: 20, description: 'Profundidade máxima (null=ilimitado)', impact: 'high', category: 'tree', gridSearchRange: [3, 5, 7, 10, 15] },
        { name: 'min_samples_split', label: 'Mín Samples Split', type: 'integer', default: 2, min: 2, max: 50, description: 'Mínimo para dividir nó', impact: 'high', category: 'tree', gridSearchRange: [2, 10, 20] },
        { name: 'min_samples_leaf', label: 'Mín Samples Folha', type: 'integer', default: 1, min: 1, max: 20, description: 'Mínimo por folha', impact: 'high', category: 'tree', gridSearchRange: [1, 5, 10] },
        { name: 'min_weight_fraction_leaf', label: 'Peso Mín Folha', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, description: 'Fração mínima de peso', impact: 'medium', category: 'tree' },
        { name: 'max_features', label: 'Max Features', type: 'select', default: null, options: [{ value: 'sqrt', label: 'Sqrt' }, { value: 'log2', label: 'Log2' }, { value: null, label: 'Todas' }], description: 'Features por split', impact: 'medium', category: 'tree' },
        { name: 'max_leaf_nodes', label: 'Máx Leaf Nodes', type: 'integer', default: null, min: 10, max: 1000, description: 'Número máximo de folhas', impact: 'medium', category: 'tree' },
        { name: 'min_impurity_decrease', label: 'Mín Impurity Decrease', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, description: 'Redução mínima para split', impact: 'medium', category: 'tree' },
        { name: 'ccp_alpha', label: 'CCP Alpha', type: 'number', default: 0, min: 0, max: 0.1, step: 0.001, description: 'Poda de complexidade', impact: 'medium', category: 'tree' },
        // Basic
        { name: 'class_weight', label: 'Peso das Classes', type: 'select', default: null, options: [{ value: null, label: 'Nenhum' }, { value: 'balanced', label: 'Balanceado' }], description: 'Balancear classes', impact: 'high', category: 'basic', gridSearchRange: [null, 'balanced'] },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'simple', label: 'Simples', description: 'Árvore interpretável', config: { criterion: 'gini', max_depth: 5, min_samples_split: 20, min_samples_leaf: 10, random_state: 42 }, estimatedTime: '<1s', expectedAccuracy: 'AUC 0.70-0.80' },
        { name: 'balanced', label: 'Balanceado', description: 'Padrão', config: { criterion: 'gini', max_depth: 10, min_samples_split: 10, min_samples_leaf: 5, class_weight: 'balanced', random_state: 42 }, estimatedTime: '<1s', expectedAccuracy: 'AUC 0.75-0.85' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 1000, maxSamples: null, minFeatures: 2, maxFeatures: null },
    baseAccuracy: 0.75
};

export const RANDOM_FOREST_CLASSIFIER: AlgorithmDefinition = {
    id: 'random_forest_classifier',
    name: 'Random Forest Classifier',
    category: 'classification',
    library: 'sklearn.ensemble.RandomForestClassifier',
    description: 'Ensemble de árvores para classificação robusta.',
    hyperparameters: [
        // Ensemble
        { name: 'n_estimators', label: 'Número de Árvores', type: 'integer', default: 100, min: 50, max: 1000, step: 50, description: 'Número de árvores', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300] },
        { name: 'bootstrap', label: 'Bootstrap', type: 'boolean', default: true, description: 'Usar bootstrap', impact: 'medium', category: 'ensemble' },
        { name: 'oob_score', label: 'OOB Score', type: 'boolean', default: false, description: 'Score out-of-bag', impact: 'low', category: 'ensemble' },
        { name: 'max_samples', label: 'Max Samples', type: 'number', default: null, min: 0.5, max: 1.0, step: 0.1, description: 'Fração de samples por árvore', impact: 'medium', category: 'ensemble' },
        // Tree
        { name: 'criterion', label: 'Critério', type: 'select', default: 'gini', options: [{ value: 'gini', label: 'Gini' }, { value: 'entropy', label: 'Entropy' }, { value: 'log_loss', label: 'Log Loss' }], description: 'Métrica de split', impact: 'medium', category: 'tree' },
        { name: 'max_depth', label: 'Profundidade Máxima', type: 'integer', default: null, min: 3, max: 30, description: 'Prof. máxima', impact: 'high', category: 'tree', gridSearchRange: [10, 15, 20, null] },
        { name: 'min_samples_split', label: 'Mín Samples Split', type: 'integer', default: 2, min: 2, max: 20, description: 'Mínimo para split', impact: 'high', category: 'tree', gridSearchRange: [2, 5, 10] },
        { name: 'min_samples_leaf', label: 'Mín Samples Folha', type: 'integer', default: 1, min: 1, max: 10, description: 'Mínimo por folha', impact: 'high', category: 'tree' },
        { name: 'min_weight_fraction_leaf', label: 'Peso Mín Folha', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, description: 'Fração mínima de peso', impact: 'medium', category: 'tree' },
        { name: 'max_features', label: 'Max Features', type: 'select', default: 'sqrt', options: [{ value: 'sqrt', label: 'Sqrt (Raiz)' }, { value: 'log2', label: 'Log2' }, { value: null, label: 'Todas' }], description: 'Features por split', impact: 'high', category: 'tree', gridSearchRange: ['sqrt', 'log2'] },
        { name: 'max_leaf_nodes', label: 'Máx Leaf Nodes', type: 'integer', default: null, min: 10, max: 1000, description: 'Máximo de folhas', impact: 'medium', category: 'tree' },
        { name: 'min_impurity_decrease', label: 'Mín Impurity Decrease', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, description: 'Redução mínima', impact: 'medium', category: 'tree' },
        { name: 'ccp_alpha', label: 'CCP Alpha', type: 'number', default: 0, min: 0, max: 0.1, step: 0.001, description: 'Poda', impact: 'medium', category: 'tree' },
        // Basic
        { name: 'class_weight', label: 'Peso das Classes', type: 'select', default: null, options: [{ value: null, label: 'Nenhum' }, { value: 'balanced', label: 'Balanceado' }, { value: 'balanced_subsample', label: 'Balanced Subsample' }], description: 'Balancear classes', impact: 'high', category: 'basic', gridSearchRange: [null, 'balanced', 'balanced_subsample'] },
        // Advanced
        { name: 'n_jobs', label: 'Número de Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'CPUs', impact: 'low', category: 'advanced' },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'verbose', label: 'Verbose', type: 'integer', default: 0, min: 0, max: 2, description: 'Verbosidade', impact: 'low', category: 'advanced' },
        { name: 'warm_start', label: 'Warm Start', type: 'boolean', default: false, description: 'Reutilizar árvores', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Treinamento rápido', config: { n_estimators: 100, max_depth: 10, min_samples_split: 5, max_features: 'sqrt', n_jobs: -1, random_state: 42 }, estimatedTime: '~15s', expectedAccuracy: 'AUC ~0.82' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 300, max_depth: 15, min_samples_split: 2, max_features: 'sqrt', class_weight: 'balanced', n_jobs: -1, random_state: 42 }, estimatedTime: '~40s', expectedAccuracy: 'AUC ~0.87' },
        { name: 'accurate', label: 'Preciso', description: 'Melhor acurácia', config: { n_estimators: 500, max_depth: 20, min_samples_split: 2, min_samples_leaf: 1, max_features: 'sqrt', class_weight: 'balanced_subsample', n_jobs: -1, random_state: 42 }, estimatedTime: '~80s', expectedAccuracy: 'AUC ~0.89' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 5000, maxSamples: null, minFeatures: 3, maxFeatures: null },
    baseAccuracy: 0.85
};

export const XGBOOST_CLASSIFIER: AlgorithmDefinition = {
    id: 'xgboost_classifier',
    name: 'XGBoost Classifier',
    category: 'classification',
    library: 'xgboost.XGBClassifier',
    description: 'Gradient boosting otimizado para classificação.',
    hyperparameters: [
        // Core
        { name: 'n_estimators', label: 'Número de Árvores', type: 'integer', default: 100, min: 50, max: 2000, step: 50, description: 'Rounds de boosting', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300, 500] },
        { name: 'learning_rate', label: 'Taxa de Aprendizado', type: 'number', default: 0.1, min: 0.001, max: 0.5, step: 0.01, description: 'Step size', impact: 'high', category: 'optimization', gridSearchRange: [0.01, 0.05, 0.1] },
        { name: 'booster', label: 'Booster', type: 'select', default: 'gbtree', options: [{ value: 'gbtree', label: 'GBTree' }, { value: 'gblinear', label: 'GBLinear' }, { value: 'dart', label: 'DART' }], description: 'Tipo de booster', impact: 'medium', category: 'basic' },
        { name: 'objective', label: 'Objetivo', type: 'select', default: 'binary:logistic', options: [{ value: 'binary:logistic', label: 'Binary Logistic' }, { value: 'multi:softprob', label: 'Multi Softprob' }], description: 'Função objetivo', impact: 'medium', category: 'basic' },
        { name: 'tree_method', label: 'Método de Árvore', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: 'exact', label: 'Exato' }, { value: 'approx', label: 'Aproximado' }, { value: 'hist', label: 'Histograma' }], description: 'Algoritmo', impact: 'medium', category: 'optimization' },
        { name: 'eval_metric', label: 'Métrica', type: 'select', default: 'auc', options: [{ value: 'auc', label: 'AUC' }, { value: 'logloss', label: 'Log Loss' }], description: 'Métrica de avaliação', impact: 'low', category: 'basic' },
        // Tree
        { name: 'max_depth', label: 'Profundidade Máxima', type: 'integer', default: 6, min: 2, max: 15, description: 'Prof. da árvore', impact: 'high', category: 'tree', gridSearchRange: [3, 5, 7, 9] },
        { name: 'min_child_weight', label: 'Peso Mínimo Filho', type: 'integer', default: 1, min: 1, max: 20, description: 'Peso mínimo', impact: 'high', category: 'tree', gridSearchRange: [1, 3, 5] },
        { name: 'gamma', label: 'Gamma', type: 'number', default: 0, min: 0, max: 10, step: 0.1, description: 'Mínimo para split', impact: 'high', category: 'tree', gridSearchRange: [0, 0.1, 0.2] },
        { name: 'max_delta_step', label: 'Max Delta Step', type: 'integer', default: 0, min: 0, max: 10, description: 'Limite delta step', impact: 'low', category: 'tree' },
        // Sampling
        { name: 'subsample', label: 'Subsample', type: 'number', default: 1.0, min: 0.5, max: 1.0, step: 0.1, description: 'Amostragem de linhas', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        { name: 'colsample_bytree', label: 'Column Sample Tree', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Features por árvore', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        { name: 'colsample_bylevel', label: 'Column Sample Level', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Features por nível', impact: 'medium', category: 'ensemble' },
        { name: 'colsample_bynode', label: 'Column Sample Node', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Features por nó', impact: 'medium', category: 'ensemble' },
        // Regularization
        { name: 'reg_alpha', label: 'Regularização L1', type: 'number', default: 0, min: 0, max: 10, step: 0.01, description: 'L1', impact: 'high', category: 'regularization', gridSearchRange: [0, 0.01, 0.1] },
        { name: 'reg_lambda', label: 'Regularização L2', type: 'number', default: 1, min: 0, max: 10, step: 0.1, description: 'L2', impact: 'high', category: 'regularization', gridSearchRange: [1, 5, 10] },
        // Class Balance
        { name: 'scale_pos_weight', label: 'Scale Pos Weight', type: 'number', default: 1, min: 1, max: 100, step: 1, description: 'Peso classe positiva (ratio neg/pos)', impact: 'high', category: 'basic', gridSearchRange: [1, 5, 10, 20] },
        // Advanced
        { name: 'base_score', label: 'Base Score', type: 'number', default: 0.5, min: 0, max: 1, step: 0.1, description: 'Score inicial', impact: 'low', category: 'advanced' },
        { name: 'importance_type', label: 'Tipo Importância', type: 'select', default: 'gain', options: [{ value: 'gain', label: 'Gain' }, { value: 'weight', label: 'Weight' }, { value: 'cover', label: 'Cover' }], description: 'Tipo de importância', impact: 'low', category: 'advanced' },
        { name: 'early_stopping_rounds', label: 'Early Stopping', type: 'integer', default: null, min: 10, max: 100, description: 'Rounds sem melhoria', impact: 'medium', category: 'optimization' },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'n_jobs', label: 'Número de Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'CPUs', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Treinamento rápido', config: { n_estimators: 100, learning_rate: 0.1, max_depth: 5, subsample: 0.8, colsample_bytree: 0.8, n_jobs: -1, random_state: 42, eval_metric: 'auc' }, estimatedTime: '~10s', expectedAccuracy: 'AUC ~0.86' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 300, learning_rate: 0.05, max_depth: 6, min_child_weight: 3, gamma: 0.1, subsample: 0.8, colsample_bytree: 0.8, scale_pos_weight: 1, reg_alpha: 0.1, reg_lambda: 1, n_jobs: -1, random_state: 42, eval_metric: 'auc' }, estimatedTime: '~30s', expectedAccuracy: 'AUC ~0.91' },
        { name: 'imbalanced', label: 'Dados Desbalanceados', description: 'Para churn/fraude (~5% positivos)', config: { n_estimators: 500, learning_rate: 0.03, max_depth: 6, min_child_weight: 1, gamma: 0, subsample: 0.8, colsample_bytree: 0.8, scale_pos_weight: 19, reg_alpha: 0.05, reg_lambda: 1, n_jobs: -1, random_state: 42, eval_metric: 'auc' }, estimatedTime: '~50s', expectedAccuracy: 'AUC ~0.93' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 10000, maxSamples: null, minFeatures: 5, maxFeatures: null },
    baseAccuracy: 0.88
};

export const LIGHTGBM_CLASSIFIER: AlgorithmDefinition = {
    id: 'lightgbm_classifier',
    name: 'LightGBM Classifier',
    category: 'classification',
    library: 'lightgbm.LGBMClassifier',
    description: 'Gradient boosting rápido para classificação.',
    hyperparameters: [
        // Core
        { name: 'boosting_type', label: 'Tipo Boosting', type: 'select', default: 'gbdt', options: [{ value: 'gbdt', label: 'GBDT' }, { value: 'dart', label: 'DART' }, { value: 'goss', label: 'GOSS' }, { value: 'rf', label: 'RF' }], description: 'Algoritmo', impact: 'medium', category: 'basic' },
        { name: 'objective', label: 'Objetivo', type: 'select', default: 'binary', options: [{ value: 'binary', label: 'Binary' }, { value: 'multiclass', label: 'Multiclass' }], description: 'Objetivo', impact: 'medium', category: 'basic' },
        { name: 'n_estimators', label: 'Número de Árvores', type: 'integer', default: 100, min: 50, max: 2000, step: 50, description: 'Iterações', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300] },
        { name: 'learning_rate', label: 'Taxa de Aprendizado', type: 'number', default: 0.1, min: 0.001, max: 0.5, step: 0.01, description: 'Step size', impact: 'high', category: 'optimization', gridSearchRange: [0.01, 0.05, 0.1] },
        // Tree
        { name: 'num_leaves', label: 'Número de Folhas', type: 'integer', default: 31, min: 10, max: 500, step: 10, description: 'Folhas por árvore', impact: 'high', category: 'tree', gridSearchRange: [31, 63, 127] },
        { name: 'max_depth', label: 'Profundidade Máxima', type: 'integer', default: -1, min: -1, max: 20, description: 'Prof. máxima (-1=ilimitado)', impact: 'high', category: 'tree' },
        { name: 'min_split_gain', label: 'Ganho Mínimo Split', type: 'number', default: 0, min: 0, max: 1, step: 0.01, description: 'Ganho mínimo', impact: 'high', category: 'tree' },
        { name: 'min_child_weight', label: 'Peso Mínimo Filho', type: 'number', default: 0.001, min: 0, max: 0.1, step: 0.001, description: 'Hessian em folha', impact: 'medium', category: 'tree' },
        { name: 'min_child_samples', label: 'Mín Amostras Filho', type: 'integer', default: 20, min: 5, max: 200, step: 5, description: 'Dados em folha', impact: 'high', category: 'tree', gridSearchRange: [20, 30, 50] },
        // Sampling
        { name: 'subsample', label: 'Subsample', type: 'number', default: 1.0, min: 0.5, max: 1.0, step: 0.1, description: 'Amostragem', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        { name: 'subsample_freq', label: 'Freq Subsample', type: 'integer', default: 0, min: 0, max: 10, description: 'Frequência', impact: 'medium', category: 'ensemble' },
        { name: 'colsample_bytree', label: 'Column Sample', type: 'number', default: 1.0, min: 0.3, max: 1.0, step: 0.1, description: 'Features', impact: 'high', category: 'ensemble', gridSearchRange: [0.7, 0.8, 0.9] },
        // Regularization
        { name: 'reg_alpha', label: 'Regularização L1', type: 'number', default: 0, min: 0, max: 10, step: 0.01, description: 'L1', impact: 'high', category: 'regularization', gridSearchRange: [0, 0.01, 0.1] },
        { name: 'reg_lambda', label: 'Regularização L2', type: 'number', default: 0, min: 0, max: 10, step: 0.01, description: 'L2', impact: 'high', category: 'regularization', gridSearchRange: [0, 0.01, 0.1] },
        // Class Balance
        { name: 'class_weight', label: 'Peso das Classes', type: 'select', default: null, options: [{ value: null, label: 'Nenhum' }, { value: 'balanced', label: 'Balanceado' }], description: 'Balancear', impact: 'high', category: 'basic', gridSearchRange: [null, 'balanced'] },
        { name: 'is_unbalance', label: 'Is Unbalance', type: 'boolean', default: false, description: 'Auto-balancear classes', impact: 'high', category: 'basic' },
        { name: 'scale_pos_weight', label: 'Scale Pos Weight', type: 'number', default: 1.0, min: 1, max: 100, step: 1, description: 'Peso classe positiva', impact: 'high', category: 'basic' },
        // Advanced
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'n_jobs', label: 'Número de Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'CPUs', impact: 'low', category: 'advanced' },
        { name: 'importance_type', label: 'Tipo Importância', type: 'select', default: 'split', options: [{ value: 'split', label: 'Split' }, { value: 'gain', label: 'Gain' }], description: 'Importância', impact: 'low', category: 'advanced' },
        { name: 'verbose', label: 'Verbose', type: 'integer', default: -1, min: -1, max: 2, description: 'Verbosidade', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Muito rápido', config: { n_estimators: 100, learning_rate: 0.1, num_leaves: 31, min_child_samples: 20, subsample: 0.8, colsample_bytree: 0.8, n_jobs: -1, random_state: 42, verbose: -1 }, estimatedTime: '~5s', expectedAccuracy: 'AUC ~0.86' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 300, learning_rate: 0.05, num_leaves: 63, min_child_samples: 30, subsample: 0.8, colsample_bytree: 0.8, class_weight: 'balanced', reg_alpha: 0.1, reg_lambda: 0.1, n_jobs: -1, random_state: 42, verbose: -1 }, estimatedTime: '~15s', expectedAccuracy: 'AUC ~0.91' },
        { name: 'imbalanced', label: 'Dados Desbalanceados', description: 'Para detecção', config: { n_estimators: 500, learning_rate: 0.03, num_leaves: 127, max_depth: 8, min_child_samples: 20, subsample: 0.8, colsample_bytree: 0.8, is_unbalance: true, reg_alpha: 0.05, reg_lambda: 0.1, n_jobs: -1, random_state: 42, verbose: -1 }, estimatedTime: '~25s', expectedAccuracy: 'AUC ~0.93' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 10000, maxSamples: null, minFeatures: 5, maxFeatures: null },
    baseAccuracy: 0.88
};

export const NAIVE_BAYES: AlgorithmDefinition = {
    id: 'naive_bayes',
    name: 'Naive Bayes (GaussianNB)',
    category: 'classification',
    library: 'sklearn.naive_bayes.GaussianNB',
    description: 'Classificador probabilístico assumindo independência de features.',
    hyperparameters: [
        { name: 'priors', label: 'Priors', type: 'select', default: null, options: [{ value: null, label: 'Auto (dados)' }], description: 'Probabilidades a priori das classes', impact: 'medium', category: 'basic' },
        { name: 'var_smoothing', label: 'Var Smoothing', type: 'number', default: 1e-9, min: 1e-11, max: 1e-7, step: 1e-10, description: 'Suavização de variância para estabilidade', impact: 'medium', category: 'basic', gridSearchRange: [1e-11, 1e-10, 1e-9, 1e-8, 1e-7] }
    ],
    presets: [
        { name: 'default', label: 'Padrão', description: 'Configuração padrão', config: { var_smoothing: 1e-9 }, estimatedTime: '<1s', expectedAccuracy: 'AUC 0.70-0.80' }
    ],
    dataRequirements: { minSamples: 30, idealSamples: 1000, maxSamples: null, minFeatures: 2, maxFeatures: null, notes: 'Muito rápido, bom para baseline' },
    baseAccuracy: 0.72
};

export const SVM_CLASSIFIER: AlgorithmDefinition = {
    id: 'svm_classifier',
    name: 'SVM (Support Vector Machine)',
    category: 'classification',
    library: 'sklearn.svm.SVC',
    description: 'Encontra hiperplano ótimo separando classes.',
    hyperparameters: [
        // Core
        { name: 'C', label: 'C (Regularização)', type: 'number', default: 1.0, min: 0.1, max: 100, step: 0.1, description: 'Força da regularização (maior=margem menor)', impact: 'high', category: 'regularization', gridSearchRange: [0.1, 1, 10, 100] },
        { name: 'kernel', label: 'Kernel', type: 'select', default: 'rbf', options: [{ value: 'linear', label: 'Linear' }, { value: 'rbf', label: 'RBF (Gaussiano)' }, { value: 'poly', label: 'Polinomial' }, { value: 'sigmoid', label: 'Sigmoide' }], description: 'Tipo de kernel', impact: 'high', category: 'basic', gridSearchRange: ['linear', 'rbf', 'poly'] },
        { name: 'degree', label: 'Degree (poly)', type: 'integer', default: 3, min: 2, max: 5, description: 'Grau do kernel polinomial', impact: 'medium', category: 'basic' },
        { name: 'gamma', label: 'Gamma', type: 'select', default: 'scale', options: [{ value: 'scale', label: 'Scale (1/n_features*X.var)' }, { value: 'auto', label: 'Auto (1/n_features)' }], description: 'Coeficiente do kernel RBF/poly/sigmoid', impact: 'high', category: 'basic', gridSearchRange: ['scale', 'auto'] },
        { name: 'coef0', label: 'Coef0', type: 'number', default: 0, min: 0, max: 1, step: 0.1, description: 'Termo independente (poly/sigmoid)', impact: 'low', category: 'advanced' },
        // Options
        { name: 'shrinking', label: 'Shrinking', type: 'boolean', default: true, description: 'Usar heurística shrinking', impact: 'low', category: 'optimization' },
        { name: 'probability', label: 'Probability', type: 'boolean', default: true, description: 'Estimar probabilidades (necessário para AUC)', impact: 'medium', category: 'basic' },
        { name: 'tol', label: 'Tolerância', type: 'number', default: 0.001, min: 0.0001, max: 0.01, step: 0.0001, description: 'Tolerância para convergência', impact: 'low', category: 'optimization' },
        { name: 'cache_size', label: 'Cache Size (MB)', type: 'integer', default: 200, min: 100, max: 1000, step: 100, description: 'Tamanho do cache em MB', impact: 'low', category: 'optimization' },
        { name: 'class_weight', label: 'Peso das Classes', type: 'select', default: null, options: [{ value: null, label: 'Nenhum' }, { value: 'balanced', label: 'Balanceado' }], description: 'Balancear classes', impact: 'high', category: 'basic', gridSearchRange: [null, 'balanced'] },
        { name: 'max_iter', label: 'Máx Iterações', type: 'integer', default: -1, min: -1, max: 10000, description: 'Máx iterações (-1=ilimitado)', impact: 'low', category: 'optimization' },
        { name: 'decision_function_shape', label: 'Decision Shape', type: 'select', default: 'ovr', options: [{ value: 'ovr', label: 'One-vs-Rest' }, { value: 'ovo', label: 'One-vs-One' }], description: 'Formato da função de decisão', impact: 'low', category: 'advanced' },
        { name: 'break_ties', label: 'Break Ties', type: 'boolean', default: false, description: 'Desempatar em multiclasse', impact: 'low', category: 'advanced' },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'linear', label: 'Linear', description: 'Para dados linearmente separáveis', config: { C: 1.0, kernel: 'linear', probability: true, random_state: 42 }, estimatedTime: '~10s', expectedAccuracy: 'AUC 0.78-0.85' },
        { name: 'rbf', label: 'RBF', description: 'Uso geral (padrão)', config: { C: 1.0, kernel: 'rbf', gamma: 'scale', probability: true, class_weight: 'balanced', random_state: 42 }, estimatedTime: '~30s', expectedAccuracy: 'AUC 0.82-0.90' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 5000, maxSamples: 10000, minFeatures: 2, maxFeatures: null, notes: '⚠️ LENTO em datasets > 10k amostras!' },
    baseAccuracy: 0.82
};

export const GRADIENT_BOOSTING_CLASSIFIER: AlgorithmDefinition = {
    id: 'gradient_boosting_classifier',
    name: 'Gradient Boosting Classifier',
    category: 'classification',
    library: 'sklearn.ensemble.GradientBoostingClassifier',
    description: 'Ensemble sequencial para classificação.',
    hyperparameters: [
        // Basic
        { name: 'loss', label: 'Loss', type: 'select', default: 'log_loss', options: [{ value: 'log_loss', label: 'Log Loss' }, { value: 'exponential', label: 'Exponential' }], description: 'Função de loss', impact: 'medium', category: 'basic' },
        // Optimization
        { name: 'learning_rate', label: 'Taxa de Aprendizado', type: 'number', default: 0.1, min: 0.001, max: 0.5, step: 0.01, description: 'Shrinkage', impact: 'high', category: 'optimization', gridSearchRange: [0.01, 0.05, 0.1] },
        { name: 'n_estimators', label: 'Número de Árvores', type: 'integer', default: 100, min: 50, max: 1000, step: 50, description: 'Boosting stages', impact: 'high', category: 'ensemble', gridSearchRange: [100, 200, 300] },
        { name: 'subsample', label: 'Subsample', type: 'number', default: 1.0, min: 0.5, max: 1.0, step: 0.1, description: 'Fração de amostras', impact: 'high', category: 'ensemble', gridSearchRange: [0.8, 1.0] },
        // Tree
        { name: 'criterion', label: 'Critério', type: 'select', default: 'friedman_mse', options: [{ value: 'friedman_mse', label: 'Friedman MSE' }, { value: 'squared_error', label: 'Squared Error' }], description: 'Métrica de split', impact: 'low', category: 'tree' },
        { name: 'min_samples_split', label: 'Mín Samples Split', type: 'integer', default: 2, min: 2, max: 20, description: 'Mínimo split', impact: 'high', category: 'tree' },
        { name: 'min_samples_leaf', label: 'Mín Samples Folha', type: 'integer', default: 1, min: 1, max: 10, description: 'Mínimo folha', impact: 'medium', category: 'tree' },
        { name: 'min_weight_fraction_leaf', label: 'Peso Mín Folha', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, description: 'Fração peso', impact: 'medium', category: 'tree' },
        { name: 'max_depth', label: 'Profundidade Máxima', type: 'integer', default: 3, min: 2, max: 10, description: 'Prof. árvore', impact: 'high', category: 'tree', gridSearchRange: [3, 5, 7] },
        { name: 'min_impurity_decrease', label: 'Mín Impurity Decrease', type: 'number', default: 0, min: 0, max: 0.5, step: 0.01, description: 'Redução mínima', impact: 'medium', category: 'tree' },
        { name: 'max_features', label: 'Max Features', type: 'select', default: null, options: [{ value: 'sqrt', label: 'Sqrt' }, { value: 'log2', label: 'Log2' }, { value: null, label: 'Todas' }], description: 'Features por split', impact: 'medium', category: 'tree' },
        { name: 'max_leaf_nodes', label: 'Máx Leaf Nodes', type: 'integer', default: null, min: 10, max: 1000, description: 'Máximo folhas', impact: 'medium', category: 'tree' },
        { name: 'ccp_alpha', label: 'CCP Alpha', type: 'number', default: 0, min: 0, max: 0.1, step: 0.001, description: 'Poda', impact: 'medium', category: 'tree' },
        // Early Stopping
        { name: 'validation_fraction', label: 'Fração Validação', type: 'number', default: 0.1, min: 0.1, max: 0.3, step: 0.05, description: 'Set de validação', impact: 'low', category: 'optimization' },
        { name: 'n_iter_no_change', label: 'Early Stopping', type: 'integer', default: null, min: 5, max: 50, description: 'Iterações sem melhoria', impact: 'medium', category: 'optimization' },
        { name: 'tol', label: 'Tolerância', type: 'number', default: 0.0001, min: 0.00001, max: 0.01, step: 0.0001, description: 'Tolerância', impact: 'low', category: 'optimization' },
        // Advanced
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'verbose', label: 'Verbose', type: 'integer', default: 0, min: 0, max: 2, description: 'Verbosidade', impact: 'low', category: 'advanced' },
        { name: 'warm_start', label: 'Warm Start', type: 'boolean', default: false, description: 'Reutilizar', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'fast', label: 'Rápido', description: 'Rápido', config: { n_estimators: 100, learning_rate: 0.1, max_depth: 3, random_state: 42 }, estimatedTime: '~20s', expectedAccuracy: 'AUC ~0.80' },
        { name: 'balanced', label: 'Balanceado', description: 'Recomendado', config: { n_estimators: 200, learning_rate: 0.05, max_depth: 5, subsample: 0.8, random_state: 42 }, estimatedTime: '~40s', expectedAccuracy: 'AUC ~0.84' }
    ],
    dataRequirements: { minSamples: 100, idealSamples: 5000, maxSamples: 100000, minFeatures: 3, maxFeatures: null },
    baseAccuracy: 0.83
};
