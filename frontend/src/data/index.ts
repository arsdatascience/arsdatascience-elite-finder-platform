// Index file - Exports all algorithm configurations
import { AlgorithmDefinition, HyperparameterDefinition, AlgorithmPreset, DataRequirements } from './algorithmConfigs';
export type { AlgorithmDefinition, HyperparameterDefinition, AlgorithmPreset, DataRequirements };

// Linear Regression Algorithms
export { LINEAR_REGRESSION, RIDGE_REGRESSION, LASSO_REGRESSION, ELASTICNET_REGRESSION } from './algorithmConfigs';

// Ensemble Regression Algorithms
export { RANDOM_FOREST_REGRESSOR, GRADIENT_BOOSTING_REGRESSOR, XGBOOST_REGRESSOR, LIGHTGBM_REGRESSOR } from './algorithmConfigsEnsemble';

// Classification Algorithms
export {
    LOGISTIC_REGRESSION,
    DECISION_TREE_CLASSIFIER,
    RANDOM_FOREST_CLASSIFIER,
    XGBOOST_CLASSIFIER,
    LIGHTGBM_CLASSIFIER,
    NAIVE_BAYES,
    SVM_CLASSIFIER,
    GRADIENT_BOOSTING_CLASSIFIER
} from './algorithmConfigsClassification';

// Clustering and Time Series Algorithms
export {
    KMEANS,
    DBSCAN,
    HIERARCHICAL_CLUSTERING,
    PROPHET,
    ARIMA,
    SARIMA,
    EXPONENTIAL_SMOOTHING
} from './algorithmConfigsClusteringTS';

// Import all for the complete map
import { LINEAR_REGRESSION, RIDGE_REGRESSION, LASSO_REGRESSION, ELASTICNET_REGRESSION } from './algorithmConfigs';
import { RANDOM_FOREST_REGRESSOR, GRADIENT_BOOSTING_REGRESSOR, XGBOOST_REGRESSOR, LIGHTGBM_REGRESSOR } from './algorithmConfigsEnsemble';
import { LOGISTIC_REGRESSION, DECISION_TREE_CLASSIFIER, RANDOM_FOREST_CLASSIFIER, XGBOOST_CLASSIFIER, LIGHTGBM_CLASSIFIER, NAIVE_BAYES, SVM_CLASSIFIER, GRADIENT_BOOSTING_CLASSIFIER } from './algorithmConfigsClassification';
import { KMEANS, DBSCAN, HIERARCHICAL_CLUSTERING, PROPHET, ARIMA, SARIMA, EXPONENTIAL_SMOOTHING } from './algorithmConfigsClusteringTS';

// Complete map of all algorithms (with aliases for MLAlgorithmsGuide compatibility)
export const ALGORITHM_CONFIGS: Record<string, AlgorithmDefinition> = {
    // Regression (8)
    linear_regression: LINEAR_REGRESSION,
    ridge_regression: RIDGE_REGRESSION,
    lasso_regression: LASSO_REGRESSION,
    elasticnet_regression: ELASTICNET_REGRESSION,
    elasticnet: ELASTICNET_REGRESSION, // Alias for MLAlgorithmsGuide
    random_forest_regressor: RANDOM_FOREST_REGRESSOR,
    gradient_boosting_regressor: GRADIENT_BOOSTING_REGRESSOR,
    gradient_boosting: GRADIENT_BOOSTING_REGRESSOR, // Alias for MLAlgorithmsGuide
    xgboost_regressor: XGBOOST_REGRESSOR,
    lightgbm_regressor: LIGHTGBM_REGRESSOR,

    // Classification (8)
    logistic_regression: LOGISTIC_REGRESSION,
    decision_tree_classifier: DECISION_TREE_CLASSIFIER,
    decision_tree: DECISION_TREE_CLASSIFIER, // Alias for MLAlgorithmsGuide
    random_forest_classifier: RANDOM_FOREST_CLASSIFIER,
    gradient_boosting_classifier: GRADIENT_BOOSTING_CLASSIFIER,
    xgboost_classifier: XGBOOST_CLASSIFIER,
    lightgbm_classifier: LIGHTGBM_CLASSIFIER,
    naive_bayes: NAIVE_BAYES,
    svm_classifier: SVM_CLASSIFIER,
    svm: SVM_CLASSIFIER, // Alias for MLAlgorithmsGuide

    // Clustering (3)
    kmeans: KMEANS,
    dbscan: DBSCAN,
    hierarchical_clustering: HIERARCHICAL_CLUSTERING,
    hierarchical: HIERARCHICAL_CLUSTERING, // Alias for MLAlgorithmsGuide

    // Time Series (4)
    prophet: PROPHET,
    arima: ARIMA,
    sarima: SARIMA,
    exponential_smoothing: EXPONENTIAL_SMOOTHING
};

// Get algorithm by ID
export function getAlgorithmConfig(algorithmId: string): AlgorithmDefinition | undefined {
    return ALGORITHM_CONFIGS[algorithmId];
}

// Get algorithms by category
export function getAlgorithmsByCategory(category: 'regression' | 'classification' | 'clustering' | 'time_series'): AlgorithmDefinition[] {
    return Object.values(ALGORITHM_CONFIGS).filter(algo => algo.category === category);
}

// Get all algorithm IDs
export function getAllAlgorithmIds(): string[] {
    return Object.keys(ALGORITHM_CONFIGS);
}

// Get default config for an algorithm
export function getDefaultConfig(algorithmId: string): Record<string, any> {
    const algo = ALGORITHM_CONFIGS[algorithmId];
    if (!algo) return {};

    const config: Record<string, any> = {};
    algo.hyperparameters.forEach(hp => {
        config[hp.name] = hp.default;
    });
    return config;
}

// Get preset config for an algorithm
export function getPresetConfig(algorithmId: string, presetName: string): Record<string, any> | undefined {
    const algo = ALGORITHM_CONFIGS[algorithmId];
    if (!algo) return undefined;

    const preset = algo.presets.find(p => p.name === presetName);
    if (!preset) return undefined;

    // Start with defaults
    const config = getDefaultConfig(algorithmId);

    // Override with preset values
    Object.assign(config, preset.config);

    return config;
}

// Validate config against algorithm constraints
export function validateConfig(algorithmId: string, config: Record<string, any>): { valid: boolean; errors: string[] } {
    const algo = ALGORITHM_CONFIGS[algorithmId];
    if (!algo) return { valid: false, errors: ['Algorithm not found'] };

    const errors: string[] = [];

    algo.hyperparameters.forEach(hp => {
        const value = config[hp.name];

        if (value === undefined || value === null) return;

        if (hp.type === 'number' || hp.type === 'integer') {
            if (hp.min !== undefined && value < hp.min) {
                errors.push(`${hp.label}: valor ${value} abaixo do mínimo ${hp.min}`);
            }
            if (hp.max !== undefined && value > hp.max) {
                errors.push(`${hp.label}: valor ${value} acima do máximo ${hp.max}`);
            }
        }
    });

    // LightGBM specific validation
    if (algorithmId.includes('lightgbm')) {
        const numLeaves = config.num_leaves;
        const maxDepth = config.max_depth;
        if (maxDepth && maxDepth > 0 && numLeaves > Math.pow(2, maxDepth)) {
            errors.push(`num_leaves (${numLeaves}) deve ser menor que 2^max_depth (${Math.pow(2, maxDepth)})`);
        }
    }

    return { valid: errors.length === 0, errors };
}

// Calculate estimated accuracy based on config - COMPLETE IMPLEMENTATION
export function calculateEstimatedAccuracy(algorithmId: string, config: Record<string, any>): { accuracy: number; tips: string[] } {
    const algo = ALGORITHM_CONFIGS[algorithmId];
    if (!algo) return { accuracy: 0.5, tips: ['Algoritmo não encontrado'] };

    let accuracy = algo.baseAccuracy;
    const tips: string[] = [];

    // ========== ENSEMBLE ALGORITHMS (Random Forest, XGBoost, LightGBM, Gradient Boosting) ==========
    if (algo.category === 'regression' || algo.category === 'classification') {

        // N_ESTIMATORS (Número de árvores) - HIGH IMPACT
        if (config.n_estimators !== undefined) {
            if (config.n_estimators >= 500) {
                accuracy += 0.03;
            } else if (config.n_estimators >= 300) {
                accuracy += 0.02;
            } else if (config.n_estimators >= 100) {
                accuracy += 0.01;
            } else if (config.n_estimators < 100) {
                accuracy -= 0.03;
                tips.push('⚠️ n_estimators < 100 pode resultar em underfitting');
            }
        }

        // LEARNING_RATE - HIGH IMPACT (inverse relationship)
        if (config.learning_rate !== undefined) {
            if (config.learning_rate <= 0.03) {
                accuracy += 0.02;
                tips.push('✓ Learning rate baixo é mais preciso, mas requer mais árvores');
            } else if (config.learning_rate <= 0.1) {
                accuracy += 0.01;
            } else if (config.learning_rate >= 0.2) {
                accuracy -= 0.03;
                tips.push('⚠️ Learning rate alto pode causar overfitting');
            }
        }

        // MAX_DEPTH - MEDIUM-HIGH IMPACT
        if (config.max_depth !== undefined && config.max_depth !== null && config.max_depth > 0) {
            if (config.max_depth >= 3 && config.max_depth <= 8) {
                accuracy += 0.01; // Sweet spot for boosting
            } else if (config.max_depth > 15) {
                accuracy -= 0.02;
                tips.push('⚠️ Profundidade muito alta pode causar overfitting');
            }
        }

        // SUBSAMPLE & COLSAMPLE - MEDIUM IMPACT (regularization)
        if (config.subsample !== undefined && config.subsample < 1.0) {
            if (config.subsample >= 0.7 && config.subsample <= 0.9) {
                accuracy += 0.01;
                tips.push('✓ Subsample entre 0.7-0.9 ajuda na generalização');
            }
        }
        if (config.colsample_bytree !== undefined && config.colsample_bytree < 1.0) {
            if (config.colsample_bytree >= 0.7 && config.colsample_bytree <= 0.9) {
                accuracy += 0.01;
            }
        }

        // REGULARIZATION (reg_alpha, reg_lambda) - HIGH IMPACT
        const regAlpha = config.reg_alpha ?? 0;
        const regLambda = config.reg_lambda ?? 0;
        if (regAlpha > 0 || regLambda > 0) {
            accuracy += 0.015;
            tips.push('✓ Regularização ativa melhora generalização');
        }

        // MIN_CHILD_WEIGHT / MIN_SAMPLES_LEAF - MEDIUM IMPACT
        if (config.min_child_weight !== undefined && config.min_child_weight > 1) {
            accuracy += 0.005;
        }
        if (config.min_samples_leaf !== undefined && config.min_samples_leaf > 1) {
            accuracy += 0.005;
        }

        // GAMMA (XGBoost) - MEDIUM IMPACT
        if (config.gamma !== undefined && config.gamma > 0) {
            if (config.gamma <= 0.2) {
                accuracy += 0.01;
            } else if (config.gamma > 0.5) {
                accuracy -= 0.01;
                tips.push('⚠️ Gamma muito alto pode subajustar o modelo');
            }
        }

        // LightGBM specific: NUM_LEAVES
        if (config.num_leaves !== undefined) {
            if (config.num_leaves >= 31 && config.num_leaves <= 127) {
                accuracy += 0.01;
            } else if (config.num_leaves > 255) {
                accuracy -= 0.02;
                tips.push('⚠️ num_leaves muito alto pode causar overfitting');
            }
        }

        // CLASS BALANCE (for classification)
        if (algo.category === 'classification') {
            if (config.class_weight === 'balanced' || config.is_unbalance === true) {
                accuracy += 0.02;
                tips.push('✓ Balanceamento de classes ativado');
            }
            if (config.scale_pos_weight !== undefined && config.scale_pos_weight > 1) {
                accuracy += 0.015;
                tips.push(`✓ scale_pos_weight=${config.scale_pos_weight} ajustado para desbalanceamento`);
            }
        }
    }

    // ========== LINEAR MODELS (Ridge, Lasso, ElasticNet, Logistic) ==========
    if (algorithmId.includes('ridge') || algorithmId.includes('lasso') || algorithmId.includes('elasticnet') || algorithmId.includes('logistic')) {

        // ALPHA / C (regularization strength)
        if (config.alpha !== undefined) {
            if (config.alpha >= 0.5 && config.alpha <= 10) {
                accuracy += 0.01;
                tips.push('✓ Alpha em faixa balanceada');
            } else if (config.alpha > 50) {
                accuracy -= 0.02;
                tips.push('⚠️ Alpha muito alto pode subajustar');
            }
        }
        if (config.C !== undefined) {
            if (config.C >= 0.1 && config.C <= 10) {
                accuracy += 0.01;
            } else if (config.C > 100) {
                accuracy -= 0.02;
                tips.push('⚠️ C muito alto pode causar overfitting');
            }
        }

        // L1_RATIO (ElasticNet)
        if (config.l1_ratio !== undefined && config.l1_ratio > 0 && config.l1_ratio < 1) {
            accuracy += 0.01;
            tips.push('✓ Mix L1/L2 ativado em ElasticNet');
        }
    }

    // ========== CLUSTERING (K-Means, DBSCAN, Hierarchical) ==========
    if (algo.category === 'clustering') {

        // K-Means specific
        if (config.n_init !== undefined && config.n_init >= 20) {
            accuracy += 0.02;
            tips.push('✓ Múltiplas inicializações melhoram estabilidade');
        }
        if (config.init === 'k-means++') {
            accuracy += 0.01;
        }

        // DBSCAN
        if (config.eps !== undefined && config.min_samples !== undefined) {
            tips.push('💡 Use K-distance graph para otimizar eps');
        }

        // Hierarchical
        if (config.linkage === 'ward') {
            accuracy += 0.01;
            tips.push('✓ Linkage "ward" geralmente é mais robusto');
        }
    }

    // ========== TIME SERIES (Prophet, ARIMA, SARIMA, ExpSmoothing) ==========
    if (algo.category === 'time_series') {

        // Prophet
        if (algorithmId === 'prophet') {
            if (config.seasonality_mode === 'multiplicative') {
                accuracy += 0.01;
                tips.push('✓ Modo multiplicativo bom para dados com sazonalidade crescente');
            }
            if (config.changepoint_prior_scale !== undefined) {
                if (config.changepoint_prior_scale >= 0.01 && config.changepoint_prior_scale <= 0.1) {
                    accuracy += 0.01;
                } else if (config.changepoint_prior_scale > 0.3) {
                    accuracy -= 0.02;
                    tips.push('⚠️ changepoint_prior_scale alto pode causar overfitting em tendência');
                }
            }
            if (config.seasonality_prior_scale !== undefined && config.seasonality_prior_scale >= 5 && config.seasonality_prior_scale <= 20) {
                accuracy += 0.01;
            }
        }

        // ARIMA/SARIMA
        if (algorithmId === 'arima' || algorithmId === 'sarima') {
            if (config.d !== undefined && config.d >= 1 && config.d <= 2) {
                accuracy += 0.01;
                tips.push('✓ Diferenciação aplicada para estacionariedade');
            }
            if (algorithmId === 'sarima' && config.s !== undefined) {
                accuracy += 0.02;
                tips.push(`✓ Período sazonal s=${config.s} configurado`);
            }
        }

        // Exponential Smoothing
        if (algorithmId === 'exponential_smoothing') {
            if (config.trend !== null && config.seasonal !== null) {
                accuracy += 0.02;
                tips.push('✓ Holt-Winters completo (tendência + sazonalidade)');
            } else if (config.trend !== null) {
                accuracy += 0.01;
            }
            if (config.damped_trend === true) {
                accuracy += 0.01;
                tips.push('✓ Tendência amortecida é mais conservadora');
            }
            if (config.optimized === true) {
                accuracy += 0.01;
            }
        }
    }

    // ========== SVM ==========
    if (algorithmId.includes('svm')) {
        if (config.kernel === 'rbf') {
            accuracy += 0.01;
            tips.push('✓ Kernel RBF é versátil para dados não-lineares');
        }
        if (config.probability === true) {
            tips.push('✓ Probabilidades habilitadas para AUC');
        }
        if (config.C !== undefined && config.C >= 1 && config.C <= 10) {
            accuracy += 0.01;
        }
    }

    // ========== NAIVE BAYES ==========
    if (algorithmId === 'naive_bayes') {
        if (config.var_smoothing !== undefined && config.var_smoothing >= 1e-10 && config.var_smoothing <= 1e-8) {
            accuracy += 0.01;
        }
        tips.push('💡 Naive Bayes é rápido mas assume independência de features');
    }

    // Clamp accuracy between 0.5 and 0.99
    accuracy = Math.max(0.5, Math.min(0.99, accuracy));

    // Round to 2 decimal places
    return {
        accuracy: Math.round(accuracy * 100) / 100,
        tips: tips.slice(0, 5) // Limit to 5 tips
    };
}

// Total algorithm count
export const TOTAL_ALGORITHMS = Object.keys(ALGORITHM_CONFIGS).length;
