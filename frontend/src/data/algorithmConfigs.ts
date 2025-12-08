// ML Algorithm Configurations - Complete definitions for all 23 algorithms
// This file contains all hyperparameters, presets, and validation rules

export interface HyperparameterDefinition {
    name: string;
    label: string;
    type: 'number' | 'integer' | 'boolean' | 'select' | 'multiselect';
    default: number | string | boolean | null;
    min?: number;
    max?: number;
    step?: number;
    options?: { value: string | number | boolean; label: string }[];
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: 'basic' | 'regularization' | 'tree' | 'ensemble' | 'optimization' | 'advanced';
    gridSearchRange?: (number | string)[];
}

export interface AlgorithmPreset {
    name: string;
    label: string;
    description: string;
    config: Record<string, number | string | boolean | null>;
    estimatedTime?: string;
    expectedAccuracy?: string;
}

export interface DataRequirements {
    minSamples: number;
    idealSamples: number;
    maxSamples: number | null;
    minFeatures: number;
    maxFeatures: number | null;
    notes?: string;
}

export interface AlgorithmDefinition {
    id: string;
    name: string;
    category: 'regression' | 'classification' | 'clustering' | 'time_series';
    library: string;
    description: string;
    hyperparameters: HyperparameterDefinition[];
    presets: AlgorithmPreset[];
    dataRequirements: DataRequirements;
    baseAccuracy: number;
}

// ============================
// REGRESSION ALGORITHMS
// ============================

export const LINEAR_REGRESSION: AlgorithmDefinition = {
    id: 'linear_regression',
    name: 'Linear Regression',
    category: 'regression',
    library: 'sklearn.linear_model.LinearRegression',
    description: 'Simple linear regression for modeling linear relationships between features and target.',
    hyperparameters: [
        { name: 'fit_intercept', label: 'Fit Intercept', type: 'boolean', default: true, description: 'Calculate the intercept for the model', impact: 'medium', category: 'basic' },
        { name: 'copy_X', label: 'Copy X', type: 'boolean', default: true, description: 'Copy X data before fitting', impact: 'low', category: 'advanced' },
        { name: 'n_jobs', label: 'Number of Jobs', type: 'integer', default: -1, min: -1, max: 16, description: 'Number of CPUs to use (-1 = all)', impact: 'low', category: 'optimization' },
        { name: 'positive', label: 'Force Positive Coefficients', type: 'boolean', default: false, description: 'Force coefficients to be positive', impact: 'high', category: 'basic' }
    ],
    presets: [
        { name: 'default', label: 'Default', description: 'Standard linear regression', config: { fit_intercept: true, n_jobs: -1, positive: false }, estimatedTime: '<1s', expectedAccuracy: '60-75%' }
    ],
    dataRequirements: { minSamples: 30, idealSamples: 500, maxSamples: null, minFeatures: 1, maxFeatures: null }
    , baseAccuracy: 0.70
};

export const RIDGE_REGRESSION: AlgorithmDefinition = {
    id: 'ridge_regression',
    name: 'Ridge Regression',
    category: 'regression',
    library: 'sklearn.linear_model.Ridge',
    description: 'L2 regularized linear regression to prevent overfitting.',
    hyperparameters: [
        { name: 'alpha', label: 'Alpha (Regularization)', type: 'number', default: 1.0, min: 0.01, max: 100, step: 0.1, description: 'Regularization strength', impact: 'high', category: 'regularization', gridSearchRange: [0.1, 0.5, 1.0, 5.0, 10.0, 50.0, 100.0] },
        { name: 'fit_intercept', label: 'Fit Intercept', type: 'boolean', default: true, description: 'Calculate the intercept', impact: 'medium', category: 'basic' },
        { name: 'copy_X', label: 'Copy X', type: 'boolean', default: true, description: 'Copy X data', impact: 'low', category: 'advanced' },
        { name: 'max_iter', label: 'Max Iterations', type: 'integer', default: 1000, min: 100, max: 10000, description: 'Maximum iterations for solver', impact: 'low', category: 'optimization' },
        { name: 'tol', label: 'Tolerance', type: 'number', default: 0.0001, min: 0.00001, max: 0.01, step: 0.0001, description: 'Tolerance for convergence', impact: 'low', category: 'optimization' },
        { name: 'solver', label: 'Solver', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: 'svd', label: 'SVD' }, { value: 'cholesky', label: 'Cholesky' }, { value: 'lsqr', label: 'LSQR' }, { value: 'saga', label: 'SAGA' }], description: 'Solver algorithm', impact: 'medium', category: 'optimization' },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed for reproducibility', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'weak', label: 'Weak Regularization', description: 'Close to Linear Regression', config: { alpha: 0.1, solver: 'auto' }, estimatedTime: '<1s', expectedAccuracy: '70-80%' },
        { name: 'balanced', label: 'Balanced', description: 'Recommended default', config: { alpha: 1.0, solver: 'auto' }, estimatedTime: '<1s', expectedAccuracy: '72-82%' },
        { name: 'strong', label: 'Strong Regularization', description: 'Prevents overfitting aggressively', config: { alpha: 10.0, solver: 'auto' }, estimatedTime: '<1s', expectedAccuracy: '68-78%' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 1000, maxSamples: null, minFeatures: 1, maxFeatures: null },
    baseAccuracy: 0.75
};

export const LASSO_REGRESSION: AlgorithmDefinition = {
    id: 'lasso_regression',
    name: 'Lasso Regression',
    category: 'regression',
    library: 'sklearn.linear_model.Lasso',
    description: 'L1 regularized linear regression for feature selection.',
    hyperparameters: [
        { name: 'alpha', label: 'Alpha (Regularization)', type: 'number', default: 1.0, min: 0.01, max: 10, step: 0.01, description: 'Regularization strength', impact: 'high', category: 'regularization', gridSearchRange: [0.01, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0] },
        { name: 'fit_intercept', label: 'Fit Intercept', type: 'boolean', default: true, description: 'Calculate the intercept', impact: 'medium', category: 'basic' },
        { name: 'max_iter', label: 'Max Iterations', type: 'integer', default: 1000, min: 100, max: 10000, description: 'Maximum iterations', impact: 'low', category: 'optimization' },
        { name: 'tol', label: 'Tolerance', type: 'number', default: 0.0001, min: 0.00001, max: 0.01, step: 0.0001, description: 'Tolerance for convergence', impact: 'low', category: 'optimization' },
        { name: 'warm_start', label: 'Warm Start', type: 'boolean', default: false, description: 'Reuse previous solution', impact: 'low', category: 'optimization' },
        { name: 'positive', label: 'Force Positive', type: 'boolean', default: false, description: 'Force positive coefficients', impact: 'medium', category: 'basic' },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'selection', label: 'Selection Method', type: 'select', default: 'cyclic', options: [{ value: 'cyclic', label: 'Cyclic' }, { value: 'random', label: 'Random' }], description: 'Coordinate selection', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'feature_selection', label: 'Feature Selection', description: 'Aggressive feature elimination', config: { alpha: 1.0 }, estimatedTime: '<1s', expectedAccuracy: '68-78%' },
        { name: 'balanced', label: 'Balanced', description: 'Moderate selection', config: { alpha: 0.5 }, estimatedTime: '<1s', expectedAccuracy: '70-80%' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 1000, maxSamples: null, minFeatures: 5, maxFeatures: null, notes: 'Best with many features for selection' },
    baseAccuracy: 0.73
};

export const ELASTICNET_REGRESSION: AlgorithmDefinition = {
    id: 'elasticnet_regression',
    name: 'ElasticNet Regression',
    category: 'regression',
    library: 'sklearn.linear_model.ElasticNet',
    description: 'Combined L1 and L2 regularization for best of both.',
    hyperparameters: [
        { name: 'alpha', label: 'Alpha', type: 'number', default: 1.0, min: 0.1, max: 10, step: 0.1, description: 'Total regularization strength', impact: 'high', category: 'regularization', gridSearchRange: [0.1, 0.5, 1.0, 5.0, 10.0] },
        { name: 'l1_ratio', label: 'L1 Ratio', type: 'number', default: 0.5, min: 0, max: 1, step: 0.1, description: 'Mix between L1 and L2 (0=Ridge, 1=Lasso)', impact: 'high', category: 'regularization', gridSearchRange: [0.1, 0.3, 0.5, 0.7, 0.9] },
        { name: 'fit_intercept', label: 'Fit Intercept', type: 'boolean', default: true, description: 'Calculate the intercept', impact: 'medium', category: 'basic' },
        { name: 'max_iter', label: 'Max Iterations', type: 'integer', default: 1000, min: 100, max: 10000, description: 'Maximum iterations', impact: 'low', category: 'optimization' },
        { name: 'tol', label: 'Tolerance', type: 'number', default: 0.0001, min: 0.00001, max: 0.01, step: 0.0001, description: 'Tolerance', impact: 'low', category: 'optimization' },
        { name: 'warm_start', label: 'Warm Start', type: 'boolean', default: false, description: 'Reuse previous solution', impact: 'low', category: 'optimization' },
        { name: 'positive', label: 'Force Positive', type: 'boolean', default: false, description: 'Force positive coefficients', impact: 'medium', category: 'basic' },
        { name: 'random_state', label: 'Random State', type: 'integer', default: 42, min: 0, max: 999, description: 'Seed', impact: 'low', category: 'advanced' },
        { name: 'selection', label: 'Selection Method', type: 'select', default: 'cyclic', options: [{ value: 'cyclic', label: 'Cyclic' }, { value: 'random', label: 'Random' }], description: 'Coordinate selection', impact: 'low', category: 'advanced' }
    ],
    presets: [
        { name: 'balanced', label: 'Balanced', description: 'Equal L1/L2 mix', config: { alpha: 1.0, l1_ratio: 0.5 }, estimatedTime: '<1s', expectedAccuracy: '72-82%' },
        { name: 'more_ridge', label: 'More Ridge', description: 'More L2 regularization', config: { alpha: 1.0, l1_ratio: 0.2 }, estimatedTime: '<1s', expectedAccuracy: '73-83%' },
        { name: 'more_lasso', label: 'More Lasso', description: 'More L1 regularization', config: { alpha: 1.0, l1_ratio: 0.8 }, estimatedTime: '<1s', expectedAccuracy: '70-80%' }
    ],
    dataRequirements: { minSamples: 50, idealSamples: 1000, maxSamples: null, minFeatures: 5, maxFeatures: null },
    baseAccuracy: 0.76
};
