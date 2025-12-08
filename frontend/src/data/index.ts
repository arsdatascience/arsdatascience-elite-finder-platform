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

// Complete map of all algorithms
export const ALGORITHM_CONFIGS: Record<string, AlgorithmDefinition> = {
    // Regression (8)
    linear_regression: LINEAR_REGRESSION,
    ridge_regression: RIDGE_REGRESSION,
    lasso_regression: LASSO_REGRESSION,
    elasticnet_regression: ELASTICNET_REGRESSION,
    random_forest_regressor: RANDOM_FOREST_REGRESSOR,
    gradient_boosting_regressor: GRADIENT_BOOSTING_REGRESSOR,
    xgboost_regressor: XGBOOST_REGRESSOR,
    lightgbm_regressor: LIGHTGBM_REGRESSOR,

    // Classification (8)
    logistic_regression: LOGISTIC_REGRESSION,
    decision_tree_classifier: DECISION_TREE_CLASSIFIER,
    random_forest_classifier: RANDOM_FOREST_CLASSIFIER,
    gradient_boosting_classifier: GRADIENT_BOOSTING_CLASSIFIER,
    xgboost_classifier: XGBOOST_CLASSIFIER,
    lightgbm_classifier: LIGHTGBM_CLASSIFIER,
    naive_bayes: NAIVE_BAYES,
    svm_classifier: SVM_CLASSIFIER,

    // Clustering (3)
    kmeans: KMEANS,
    dbscan: DBSCAN,
    hierarchical_clustering: HIERARCHICAL_CLUSTERING,

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

// Calculate estimated accuracy based on config
export function calculateEstimatedAccuracy(algorithmId: string, config: Record<string, any>): { accuracy: number; tips: string[] } {
    const algo = ALGORITHM_CONFIGS[algorithmId];
    if (!algo) return { accuracy: 0.5, tips: [] };

    let accuracy = algo.baseAccuracy;
    const tips: string[] = [];

    // Adjust based on hyperparameters
    algo.hyperparameters.forEach(hp => {
        const value = config[hp.name];
        if (value === undefined) return;

        if (hp.impact === 'high') {
            // Simple heuristic: being closer to default is better
            const defaultVal = hp.default;
            if (typeof value === 'number' && typeof defaultVal === 'number') {
                const deviation = Math.abs(value - defaultVal) / (hp.max! - hp.min! || 1);
                if (deviation > 0.5) {
                    accuracy -= 0.02;
                    tips.push(`${hp.label}: value is far from optimal default`);
                }
            }
        }
    });

    // Ensemble-specific boosts
    if (config.n_estimators) {
        if (config.n_estimators >= 300) accuracy += 0.02;
        if (config.n_estimators >= 500) accuracy += 0.01;
        if (config.n_estimators < 100) {
            accuracy -= 0.03;
            tips.push('Aumentar n_estimators pode melhorar a precisão');
        }
    }

    // Learning rate adjustments
    if (config.learning_rate) {
        if (config.learning_rate <= 0.05) accuracy += 0.01;
        if (config.learning_rate >= 0.2) {
            accuracy -= 0.02;
            tips.push('Learning rate muito alto pode causar overfitting');
        }
    }

    // Regularization adjustments
    if (config.reg_alpha || config.reg_lambda) {
        if ((config.reg_alpha || 0) > 0 || (config.reg_lambda || 0) > 0) {
            accuracy += 0.01;
        }
    }

    // Clamp accuracy
    accuracy = Math.max(0.5, Math.min(0.99, accuracy));

    return { accuracy: Math.round(accuracy * 100) / 100, tips };
}

// Total algorithm count
export const TOTAL_ALGORITHMS = Object.keys(ALGORITHM_CONFIGS).length;
