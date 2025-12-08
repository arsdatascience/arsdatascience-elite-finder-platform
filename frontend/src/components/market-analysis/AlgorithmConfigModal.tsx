import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Sliders, Database, Gauge, Info, AlertTriangle,
    CheckCircle, TrendingUp, Zap, Clock, Brain
} from 'lucide-react';

// Types
export interface AlgorithmHyperparameter {
    name: string;
    label: string;
    description: string;
    type: 'number' | 'select' | 'boolean';
    default: number | string | boolean;
    min?: number;
    max?: number;
    step?: number;
    options?: { value: string; label: string }[];
    accuracyImpact: 'low' | 'medium' | 'high';
    tipLow?: string;
    tipHigh?: string;
}

export interface AlgorithmDataRequirements {
    minSamples: number;
    idealSamples: number;
    maxSamples: string;
    minFeatures: number;
    maxFeatures: number | string;
    note?: string;
}

export interface AlgorithmConfig {
    id: string;
    name: string;
    category: string;
    baseAccuracy: number;
    hyperparameters: AlgorithmHyperparameter[];
    dataRequirements: AlgorithmDataRequirements;
}

// Algorithm configurations with detailed hyperparameters
export const ALGORITHM_CONFIGS: Record<string, AlgorithmConfig> = {
    linear_regression: {
        id: 'linear_regression',
        name: 'Linear Regression',
        category: 'regression',
        baseAccuracy: 75,
        hyperparameters: [
            { name: 'fit_intercept', label: 'Calcular Intercepto', description: 'Se deve calcular o intercepto (b0) do modelo', type: 'boolean', default: true, accuracyImpact: 'low' },
            { name: 'normalize', label: 'Normalizar Features', description: 'Normaliza as features antes do treinamento', type: 'boolean', default: false, accuracyImpact: 'medium', tipLow: 'Dados já normalizados', tipHigh: 'Features em escalas diferentes' },
            { name: 'copy_X', label: 'Copiar Dados', description: 'Se deve copiar X ou sobrescrever', type: 'boolean', default: true, accuracyImpact: 'low' }
        ],
        dataRequirements: { minSamples: 30, idealSamples: 500, maxSamples: 'Ilimitado', minFeatures: 1, maxFeatures: 100, note: 'Funciona bem com poucos dados se relação é linear' }
    },
    ridge_regression: {
        id: 'ridge_regression',
        name: 'Ridge Regression',
        category: 'regression',
        baseAccuracy: 78,
        hyperparameters: [
            { name: 'alpha', label: 'Alpha (Regularização)', description: 'Força da regularização L2. Valores maiores = menos overfitting', type: 'number', default: 1.0, min: 0.01, max: 100, step: 0.1, accuracyImpact: 'high', tipLow: 'Modelo mais flexível, risco de overfitting', tipHigh: 'Modelo mais simples, pode underfit' },
            { name: 'fit_intercept', label: 'Calcular Intercepto', description: 'Se deve calcular o intercepto', type: 'boolean', default: true, accuracyImpact: 'low' },
            { name: 'solver', label: 'Solver', description: 'Algoritmo de otimização', type: 'select', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: 'svd', label: 'SVD' }, { value: 'cholesky', label: 'Cholesky' }, { value: 'lsqr', label: 'LSQR' }], accuracyImpact: 'low' }
        ],
        dataRequirements: { minSamples: 50, idealSamples: 1000, maxSamples: 'Ilimitado', minFeatures: 2, maxFeatures: 500, note: 'Ideal quando features são correlacionadas' }
    },
    lasso_regression: {
        id: 'lasso_regression',
        name: 'Lasso Regression',
        category: 'regression',
        baseAccuracy: 76,
        hyperparameters: [
            { name: 'alpha', label: 'Alpha (Seleção)', description: 'Força da regularização L1. Maiores valores eliminam mais features', type: 'number', default: 1.0, min: 0.01, max: 10, step: 0.1, accuracyImpact: 'high', tipLow: 'Mantém mais features', tipHigh: 'Elimina mais features' },
            { name: 'max_iter', label: 'Iterações Máximas', description: 'Número máximo de iterações', type: 'number', default: 1000, min: 100, max: 10000, step: 100, accuracyImpact: 'medium' },
            { name: 'tol', label: 'Tolerância', description: 'Tolerância para convergência', type: 'number', default: 0.0001, min: 0.00001, max: 0.01, step: 0.0001, accuracyImpact: 'low' }
        ],
        dataRequirements: { minSamples: 50, idealSamples: 1000, maxSamples: 'Ilimitado', minFeatures: 5, maxFeatures: 1000, note: 'Melhor quando muitas features são irrelevantes' }
    },
    elasticnet: {
        id: 'elasticnet',
        name: 'ElasticNet Regression',
        category: 'regression',
        baseAccuracy: 79,
        hyperparameters: [
            { name: 'alpha', label: 'Alpha Total', description: 'Força total da regularização', type: 'number', default: 1.0, min: 0.01, max: 10, step: 0.1, accuracyImpact: 'high' },
            { name: 'l1_ratio', label: 'Ratio L1/L2', description: '0=Ridge, 1=Lasso, 0.5=Balanceado', type: 'number', default: 0.5, min: 0, max: 1, step: 0.1, accuracyImpact: 'high', tipLow: 'Comportamento Ridge', tipHigh: 'Comportamento Lasso' },
            { name: 'max_iter', label: 'Iterações Máximas', description: 'Número máximo de iterações', type: 'number', default: 1000, min: 100, max: 10000, step: 100, accuracyImpact: 'medium' }
        ],
        dataRequirements: { minSamples: 100, idealSamples: 2000, maxSamples: 'Ilimitado', minFeatures: 10, maxFeatures: 1000, note: 'Combina benefícios de Ridge e Lasso' }
    },
    random_forest_regressor: {
        id: 'random_forest_regressor',
        name: 'Random Forest Regressor',
        category: 'regression',
        baseAccuracy: 85,
        hyperparameters: [
            { name: 'n_estimators', label: 'Número de Árvores', description: 'Quantidade de árvores no ensemble', type: 'number', default: 100, min: 10, max: 1000, step: 10, accuracyImpact: 'high', tipLow: 'Mais rápido, menos preciso', tipHigh: 'Mais lento, mais preciso' },
            { name: 'max_depth', label: 'Profundidade Máxima', description: 'Limita profundidade das árvores', type: 'number', default: 10, min: 2, max: 50, step: 1, accuracyImpact: 'high', tipLow: 'Modelo simples', tipHigh: 'Modelo complexo, risco overfitting' },
            { name: 'min_samples_split', label: 'Min Samples Split', description: 'Mínimo de amostras para dividir nó', type: 'number', default: 2, min: 2, max: 20, step: 1, accuracyImpact: 'medium' },
            { name: 'min_samples_leaf', label: 'Min Samples Folha', description: 'Mínimo de amostras por folha', type: 'number', default: 1, min: 1, max: 20, step: 1, accuracyImpact: 'medium' },
            { name: 'max_features', label: 'Features por Árvore', description: 'Número de features consideradas', type: 'select', default: 'sqrt', options: [{ value: 'sqrt', label: 'Raiz Quadrada' }, { value: 'log2', label: 'Log2' }, { value: 'auto', label: 'Auto' }], accuracyImpact: 'medium' }
        ],
        dataRequirements: { minSamples: 100, idealSamples: 5000, maxSamples: '100k+', minFeatures: 3, maxFeatures: 200, note: 'Escala bem, mas usa muita memória' }
    },
    xgboost_regressor: {
        id: 'xgboost_regressor',
        name: 'XGBoost Regressor',
        category: 'regression',
        baseAccuracy: 88,
        hyperparameters: [
            { name: 'n_estimators', label: 'Número de Árvores', description: 'Boosting rounds', type: 'number', default: 100, min: 50, max: 1000, step: 10, accuracyImpact: 'high' },
            { name: 'learning_rate', label: 'Learning Rate (eta)', description: 'Taxa de aprendizado. Menor = mais robusto', type: 'number', default: 0.1, min: 0.01, max: 0.3, step: 0.01, accuracyImpact: 'high', tipLow: 'Aprendizado lento, precisa mais árvores', tipHigh: 'Aprendizado rápido, risco overfitting' },
            { name: 'max_depth', label: 'Profundidade Máxima', description: 'Profundidade de cada árvore', type: 'number', default: 6, min: 3, max: 15, step: 1, accuracyImpact: 'high' },
            { name: 'subsample', label: 'Subsample', description: 'Fração de amostras por árvore', type: 'number', default: 0.8, min: 0.5, max: 1, step: 0.1, accuracyImpact: 'medium' },
            { name: 'colsample_bytree', label: 'Features por Árvore', description: 'Fração de features por árvore', type: 'number', default: 0.8, min: 0.5, max: 1, step: 0.1, accuracyImpact: 'medium' },
            { name: 'reg_alpha', label: 'Reg Alpha (L1)', description: 'Regularização L1', type: 'number', default: 0, min: 0, max: 10, step: 0.1, accuracyImpact: 'medium' },
            { name: 'reg_lambda', label: 'Reg Lambda (L2)', description: 'Regularização L2', type: 'number', default: 1, min: 0, max: 10, step: 0.1, accuracyImpact: 'medium' }
        ],
        dataRequirements: { minSamples: 500, idealSamples: 10000, maxSamples: '1M+', minFeatures: 5, maxFeatures: 500, note: 'Estado da arte para dados tabulares' }
    },
    lightgbm_regressor: {
        id: 'lightgbm_regressor',
        name: 'LightGBM Regressor',
        category: 'regression',
        baseAccuracy: 87,
        hyperparameters: [
            { name: 'n_estimators', label: 'Número de Árvores', description: 'Boosting iterations', type: 'number', default: 100, min: 50, max: 2000, step: 50, accuracyImpact: 'high' },
            { name: 'learning_rate', label: 'Learning Rate', description: 'Taxa de aprendizado', type: 'number', default: 0.1, min: 0.01, max: 0.3, step: 0.01, accuracyImpact: 'high' },
            { name: 'num_leaves', label: 'Número de Folhas', description: 'Folhas por árvore (controla complexidade)', type: 'number', default: 31, min: 10, max: 150, step: 5, accuracyImpact: 'high', tipLow: 'Modelo simples', tipHigh: 'Mais preciso mas pode overfit' },
            { name: 'max_depth', label: 'Profundidade Máxima', description: 'Limite de profundidade (-1 = sem limite)', type: 'number', default: -1, min: -1, max: 20, step: 1, accuracyImpact: 'medium' },
            { name: 'min_child_samples', label: 'Min Child Samples', description: 'Mínimo de dados por folha', type: 'number', default: 20, min: 5, max: 100, step: 5, accuracyImpact: 'medium' },
            { name: 'feature_fraction', label: 'Feature Fraction', description: 'Fração de features por iteração', type: 'number', default: 0.9, min: 0.5, max: 1, step: 0.1, accuracyImpact: 'medium' }
        ],
        dataRequirements: { minSamples: 1000, idealSamples: 50000, maxSamples: '10M+', minFeatures: 5, maxFeatures: 1000, note: '10-20x mais rápido que XGBoost' }
    },
    gradient_boosting: {
        id: 'gradient_boosting',
        name: 'Gradient Boosting Regressor',
        category: 'regression',
        baseAccuracy: 82,
        hyperparameters: [
            { name: 'n_estimators', label: 'Número de Árvores', description: 'Boosting stages', type: 'number', default: 100, min: 50, max: 500, step: 10, accuracyImpact: 'high' },
            { name: 'learning_rate', label: 'Learning Rate', description: 'Shrinkage', type: 'number', default: 0.1, min: 0.01, max: 0.5, step: 0.01, accuracyImpact: 'high' },
            { name: 'max_depth', label: 'Profundidade Máxima', description: 'Profundidade das árvores', type: 'number', default: 3, min: 1, max: 10, step: 1, accuracyImpact: 'high' },
            { name: 'subsample', label: 'Subsample', description: 'Fração de amostras', type: 'number', default: 1.0, min: 0.5, max: 1, step: 0.1, accuracyImpact: 'medium' }
        ],
        dataRequirements: { minSamples: 200, idealSamples: 5000, maxSamples: '50k', minFeatures: 3, maxFeatures: 100, note: 'Scikit-learn nativo, sem dependências extras' }
    },
    logistic_regression: {
        id: 'logistic_regression',
        name: 'Logistic Regression',
        category: 'classification',
        baseAccuracy: 76,
        hyperparameters: [
            { name: 'C', label: 'C (Inverso Regularização)', description: 'Valores menores = mais regularização', type: 'number', default: 1.0, min: 0.01, max: 100, step: 0.1, accuracyImpact: 'high', tipLow: 'Mais regularizado, menos overfitting', tipHigh: 'Menos regularizado, mais flexível' },
            { name: 'penalty', label: 'Tipo de Penalidade', description: 'Tipo de regularização', type: 'select', default: 'l2', options: [{ value: 'l1', label: 'L1 (Lasso)' }, { value: 'l2', label: 'L2 (Ridge)' }, { value: 'elasticnet', label: 'ElasticNet' }, { value: 'none', label: 'Nenhuma' }], accuracyImpact: 'medium' },
            { name: 'solver', label: 'Solver', description: 'Algoritmo de otimização', type: 'select', default: 'lbfgs', options: [{ value: 'lbfgs', label: 'LBFGS' }, { value: 'liblinear', label: 'Liblinear' }, { value: 'saga', label: 'SAGA' }], accuracyImpact: 'low' },
            { name: 'max_iter', label: 'Iterações Máximas', description: 'Limite de iterações', type: 'number', default: 100, min: 50, max: 1000, step: 50, accuracyImpact: 'low' }
        ],
        dataRequirements: { minSamples: 50, idealSamples: 1000, maxSamples: 'Ilimitado', minFeatures: 2, maxFeatures: 500, note: 'Retorna probabilidades calibradas' }
    },
    decision_tree: {
        id: 'decision_tree',
        name: 'Decision Tree Classifier',
        category: 'classification',
        baseAccuracy: 72,
        hyperparameters: [
            { name: 'max_depth', label: 'Profundidade Máxima', description: 'Controla complexidade da árvore', type: 'number', default: 5, min: 1, max: 30, step: 1, accuracyImpact: 'high', tipLow: 'Árvore simples, interpretável', tipHigh: 'Árvore complexa, risco overfitting' },
            { name: 'min_samples_split', label: 'Min Samples Split', description: 'Mínimo para dividir nó', type: 'number', default: 2, min: 2, max: 50, step: 1, accuracyImpact: 'medium' },
            { name: 'min_samples_leaf', label: 'Min Samples Folha', description: 'Mínimo por folha', type: 'number', default: 1, min: 1, max: 50, step: 1, accuracyImpact: 'medium' },
            { name: 'criterion', label: 'Critério', description: 'Função para medir qualidade do split', type: 'select', default: 'gini', options: [{ value: 'gini', label: 'Gini' }, { value: 'entropy', label: 'Entropia' }], accuracyImpact: 'low' }
        ],
        dataRequirements: { minSamples: 30, idealSamples: 500, maxSamples: '10k', minFeatures: 2, maxFeatures: 50, note: 'Muito interpretável, mas propenso a overfitting' }
    },
    random_forest_classifier: {
        id: 'random_forest_classifier',
        name: 'Random Forest Classifier',
        category: 'classification',
        baseAccuracy: 84,
        hyperparameters: [
            { name: 'n_estimators', label: 'Número de Árvores', description: 'Quantidade de árvores', type: 'number', default: 100, min: 10, max: 500, step: 10, accuracyImpact: 'high' },
            { name: 'max_depth', label: 'Profundidade Máxima', description: 'Limite de profundidade', type: 'number', default: 10, min: 3, max: 30, step: 1, accuracyImpact: 'high' },
            { name: 'min_samples_split', label: 'Min Samples Split', description: 'Mínimo para split', type: 'number', default: 2, min: 2, max: 20, step: 1, accuracyImpact: 'medium' },
            { name: 'class_weight', label: 'Peso das Classes', description: 'Balanceamento de classes', type: 'select', default: 'None', options: [{ value: 'None', label: 'Nenhum' }, { value: 'balanced', label: 'Balanceado' }], accuracyImpact: 'high' }
        ],
        dataRequirements: { minSamples: 200, idealSamples: 5000, maxSamples: '100k+', minFeatures: 5, maxFeatures: 200, note: 'Robusto e preciso sem muito tuning' }
    },
    xgboost_classifier: {
        id: 'xgboost_classifier',
        name: 'XGBoost Classifier',
        category: 'classification',
        baseAccuracy: 89,
        hyperparameters: [
            { name: 'n_estimators', label: 'Número de Árvores', description: 'Boosting rounds', type: 'number', default: 100, min: 50, max: 1000, step: 10, accuracyImpact: 'high' },
            { name: 'learning_rate', label: 'Learning Rate', description: 'Taxa de aprendizado', type: 'number', default: 0.1, min: 0.01, max: 0.3, step: 0.01, accuracyImpact: 'high' },
            { name: 'max_depth', label: 'Profundidade Máxima', description: 'Profundidade das árvores', type: 'number', default: 6, min: 3, max: 15, step: 1, accuracyImpact: 'high' },
            { name: 'scale_pos_weight', label: 'Peso Classe Positiva', description: 'Para dados desbalanceados', type: 'number', default: 1, min: 1, max: 100, step: 1, accuracyImpact: 'high' },
            { name: 'subsample', label: 'Subsample', description: 'Fração de amostras', type: 'number', default: 0.8, min: 0.5, max: 1, step: 0.1, accuracyImpact: 'medium' }
        ],
        dataRequirements: { minSamples: 500, idealSamples: 10000, maxSamples: '1M+', minFeatures: 5, maxFeatures: 500, note: 'Melhor precisão para classificação tabular' }
    },
    lightgbm_classifier: {
        id: 'lightgbm_classifier',
        name: 'LightGBM Classifier',
        category: 'classification',
        baseAccuracy: 88,
        hyperparameters: [
            { name: 'n_estimators', label: 'Número de Árvores', description: 'Boosting iterations', type: 'number', default: 100, min: 50, max: 2000, step: 50, accuracyImpact: 'high' },
            { name: 'learning_rate', label: 'Learning Rate', description: 'Taxa de aprendizado', type: 'number', default: 0.1, min: 0.01, max: 0.3, step: 0.01, accuracyImpact: 'high' },
            { name: 'num_leaves', label: 'Número de Folhas', description: 'Folhas por árvore', type: 'number', default: 31, min: 10, max: 150, step: 5, accuracyImpact: 'high' },
            { name: 'is_unbalance', label: 'Dados Desbalanceados', description: 'Ativar para dados desbalanceados', type: 'boolean', default: false, accuracyImpact: 'high' }
        ],
        dataRequirements: { minSamples: 1000, idealSamples: 50000, maxSamples: '10M+', minFeatures: 5, maxFeatures: 1000, note: 'Extremamente rápido para datasets grandes' }
    },
    naive_bayes: {
        id: 'naive_bayes',
        name: 'Naive Bayes',
        category: 'classification',
        baseAccuracy: 75,
        hyperparameters: [
            { name: 'var_smoothing', label: 'Smoothing', description: 'Suavização de variância (evita divisão por zero)', type: 'number', default: 0.000000001, min: 0.0000000001, max: 0.001, step: 0.0000001, accuracyImpact: 'medium' }
        ],
        dataRequirements: { minSamples: 20, idealSamples: 500, maxSamples: 'Ilimitado', minFeatures: 2, maxFeatures: 10000, note: 'Excelente para texto e alta dimensionalidade' }
    },
    svm: {
        id: 'svm',
        name: 'Support Vector Machine',
        category: 'classification',
        baseAccuracy: 80,
        hyperparameters: [
            { name: 'C', label: 'C (Regularização)', description: 'Penalidade por erro. Maior = margem menor', type: 'number', default: 1.0, min: 0.1, max: 100, step: 0.1, accuracyImpact: 'high' },
            { name: 'kernel', label: 'Kernel', description: 'Tipo de kernel', type: 'select', default: 'rbf', options: [{ value: 'linear', label: 'Linear' }, { value: 'rbf', label: 'RBF (Gaussiano)' }, { value: 'poly', label: 'Polinomial' }, { value: 'sigmoid', label: 'Sigmoid' }], accuracyImpact: 'high' },
            { name: 'gamma', label: 'Gamma', description: 'Coeficiente do kernel', type: 'select', default: 'scale', options: [{ value: 'scale', label: 'Scale' }, { value: 'auto', label: 'Auto' }], accuracyImpact: 'high' }
        ],
        dataRequirements: { minSamples: 50, idealSamples: 1000, maxSamples: '10k', minFeatures: 2, maxFeatures: 500, note: 'Muito lento em datasets grandes' }
    },
    kmeans: {
        id: 'kmeans',
        name: 'K-Means',
        category: 'clustering',
        baseAccuracy: 70,
        hyperparameters: [
            { name: 'n_clusters', label: 'Número de Clusters (K)', description: 'Quantidade de grupos a formar', type: 'number', default: 5, min: 2, max: 20, step: 1, accuracyImpact: 'high', tipLow: 'Poucos grupos grandes', tipHigh: 'Muitos grupos pequenos' },
            { name: 'init', label: 'Inicialização', description: 'Método de inicialização dos centróides', type: 'select', default: 'k-means++', options: [{ value: 'k-means++', label: 'K-Means++' }, { value: 'random', label: 'Aleatório' }], accuracyImpact: 'medium' },
            { name: 'n_init', label: 'Número de Inicializações', description: 'Vezes que roda com diferentes centroides', type: 'number', default: 10, min: 1, max: 30, step: 1, accuracyImpact: 'medium' },
            { name: 'max_iter', label: 'Iterações Máximas', description: 'Limite de iterações', type: 'number', default: 300, min: 100, max: 1000, step: 50, accuracyImpact: 'low' }
        ],
        dataRequirements: { minSamples: 50, idealSamples: 5000, maxSamples: '1M+', minFeatures: 2, maxFeatures: 100, note: 'Precisa definir K antecipadamente. Use método Elbow' }
    },
    dbscan: {
        id: 'dbscan',
        name: 'DBSCAN',
        category: 'clustering',
        baseAccuracy: 72,
        hyperparameters: [
            { name: 'eps', label: 'Epsilon (Raio)', description: 'Distância máxima entre pontos do mesmo cluster', type: 'number', default: 0.5, min: 0.1, max: 5, step: 0.1, accuracyImpact: 'high', tipLow: 'Clusters pequenos e densos', tipHigh: 'Clusters maiores e esparsos' },
            { name: 'min_samples', label: 'Min Samples', description: 'Mínimo de pontos para formar cluster', type: 'number', default: 5, min: 2, max: 50, step: 1, accuracyImpact: 'high', tipLow: 'Mais clusters, mais outliers', tipHigh: 'Menos clusters, menos outliers' },
            { name: 'metric', label: 'Métrica de Distância', description: 'Como calcular distância', type: 'select', default: 'euclidean', options: [{ value: 'euclidean', label: 'Euclidiana' }, { value: 'manhattan', label: 'Manhattan' }, { value: 'cosine', label: 'Cosseno' }], accuracyImpact: 'medium' }
        ],
        dataRequirements: { minSamples: 100, idealSamples: 5000, maxSamples: '50k', minFeatures: 2, maxFeatures: 50, note: 'Não precisa definir K, detecta outliers automaticamente' }
    },
    hierarchical: {
        id: 'hierarchical',
        name: 'Hierarchical Clustering',
        category: 'clustering',
        baseAccuracy: 73,
        hyperparameters: [
            { name: 'n_clusters', label: 'Número de Clusters', description: 'Onde cortar o dendrograma', type: 'number', default: 5, min: 2, max: 20, step: 1, accuracyImpact: 'high' },
            { name: 'linkage', label: 'Método de Ligação', description: 'Como medir distância entre clusters', type: 'select', default: 'ward', options: [{ value: 'ward', label: 'Ward' }, { value: 'complete', label: 'Complete' }, { value: 'average', label: 'Average' }, { value: 'single', label: 'Single' }], accuracyImpact: 'high' },
            { name: 'metric', label: 'Métrica de Distância', description: 'Distância entre pontos', type: 'select', default: 'euclidean', options: [{ value: 'euclidean', label: 'Euclidiana' }, { value: 'manhattan', label: 'Manhattan' }, { value: 'cosine', label: 'Cosseno' }], accuracyImpact: 'medium' }
        ],
        dataRequirements: { minSamples: 30, idealSamples: 1000, maxSamples: '5k', minFeatures: 2, maxFeatures: 50, note: 'Dendrograma visual, mas O(n³) complexidade' }
    },
    prophet: {
        id: 'prophet',
        name: 'Prophet (Facebook)',
        category: 'timeseries',
        baseAccuracy: 82,
        hyperparameters: [
            { name: 'seasonality_mode', label: 'Modo de Sazonalidade', description: 'Como aplicar sazonalidade', type: 'select', default: 'additive', options: [{ value: 'additive', label: 'Aditivo' }, { value: 'multiplicative', label: 'Multiplicativo' }], accuracyImpact: 'high' },
            { name: 'changepoint_prior_scale', label: 'Flexibilidade de Tendência', description: 'Quanto a tendência pode mudar', type: 'number', default: 0.05, min: 0.001, max: 0.5, step: 0.01, accuracyImpact: 'high', tipLow: 'Tendência mais estável', tipHigh: 'Tendência mais flexível' },
            { name: 'seasonality_prior_scale', label: 'Força da Sazonalidade', description: 'Quanto sazonalidade pode variar', type: 'number', default: 10, min: 0.1, max: 50, step: 1, accuracyImpact: 'medium' },
            { name: 'yearly_seasonality', label: 'Sazonalidade Anual', description: 'Ativar padrão anual', type: 'boolean', default: true, accuracyImpact: 'medium' },
            { name: 'weekly_seasonality', label: 'Sazonalidade Semanal', description: 'Ativar padrão semanal', type: 'boolean', default: true, accuracyImpact: 'medium' }
        ],
        dataRequirements: { minSamples: 365, idealSamples: 730, maxSamples: 'Ilimitado', minFeatures: 1, maxFeatures: 1, note: 'Mínimo 1 ano de dados para sazonalidade anual' }
    },
    arima: {
        id: 'arima',
        name: 'ARIMA',
        category: 'timeseries',
        baseAccuracy: 78,
        hyperparameters: [
            { name: 'p', label: 'P (Auto-Regressivo)', description: 'Ordem do componente AR', type: 'number', default: 1, min: 0, max: 10, step: 1, accuracyImpact: 'high' },
            { name: 'd', label: 'D (Diferenciação)', description: 'Grau de diferenciação', type: 'number', default: 1, min: 0, max: 3, step: 1, accuracyImpact: 'high' },
            { name: 'q', label: 'Q (Média Móvel)', description: 'Ordem do componente MA', type: 'number', default: 1, min: 0, max: 10, step: 1, accuracyImpact: 'high' }
        ],
        dataRequirements: { minSamples: 50, idealSamples: 200, maxSamples: '1000', minFeatures: 1, maxFeatures: 1, note: 'Série deve ser estacionária ou diferenciável' }
    },
    sarima: {
        id: 'sarima',
        name: 'SARIMA',
        category: 'timeseries',
        baseAccuracy: 83,
        hyperparameters: [
            { name: 'p', label: 'P (AR)', description: 'Ordem AR', type: 'number', default: 1, min: 0, max: 5, step: 1, accuracyImpact: 'high' },
            { name: 'd', label: 'D (Diferenciação)', description: 'Diferenciação não-sazonal', type: 'number', default: 1, min: 0, max: 2, step: 1, accuracyImpact: 'high' },
            { name: 'q', label: 'Q (MA)', description: 'Ordem MA', type: 'number', default: 1, min: 0, max: 5, step: 1, accuracyImpact: 'high' },
            { name: 'P', label: 'P Sazonal', description: 'AR sazonal', type: 'number', default: 1, min: 0, max: 3, step: 1, accuracyImpact: 'high' },
            { name: 'D', label: 'D Sazonal', description: 'Diferenciação sazonal', type: 'number', default: 1, min: 0, max: 2, step: 1, accuracyImpact: 'high' },
            { name: 'Q', label: 'Q Sazonal', description: 'MA sazonal', type: 'number', default: 1, min: 0, max: 3, step: 1, accuracyImpact: 'high' },
            { name: 's', label: 'S (Período Sazonal)', description: 'Período da sazonalidade (12=mensal, 7=diário)', type: 'number', default: 12, min: 2, max: 52, step: 1, accuracyImpact: 'high' }
        ],
        dataRequirements: { minSamples: 104, idealSamples: 520, maxSamples: '2000', minFeatures: 1, maxFeatures: 1, note: 'Precisa de 2+ ciclos sazonais completos' }
    },
    exponential_smoothing: {
        id: 'exponential_smoothing',
        name: 'Exponential Smoothing',
        category: 'timeseries',
        baseAccuracy: 75,
        hyperparameters: [
            { name: 'trend', label: 'Tipo de Tendência', description: 'Como modelar tendência', type: 'select', default: 'add', options: [{ value: 'add', label: 'Aditiva' }, { value: 'mul', label: 'Multiplicativa' }, { value: 'None', label: 'Nenhuma' }], accuracyImpact: 'high' },
            { name: 'seasonal', label: 'Tipo de Sazonalidade', description: 'Como modelar sazonalidade', type: 'select', default: 'add', options: [{ value: 'add', label: 'Aditiva' }, { value: 'mul', label: 'Multiplicativa' }, { value: 'None', label: 'Nenhuma' }], accuracyImpact: 'high' },
            { name: 'seasonal_periods', label: 'Período Sazonal', description: 'Período da sazonalidade', type: 'number', default: 12, min: 2, max: 52, step: 1, accuracyImpact: 'high' },
            { name: 'damped_trend', label: 'Damped Trend', description: 'Amortecer tendência no longo prazo', type: 'boolean', default: false, accuracyImpact: 'medium' }
        ],
        dataRequirements: { minSamples: 24, idealSamples: 100, maxSamples: '500', minFeatures: 1, maxFeatures: 1, note: 'Melhor para forecasts de curto prazo (1-7 dias)' }
    }
};

// Calculate estimated accuracy based on configuration
const calculateEstimatedAccuracy = (
    config: AlgorithmConfig,
    values: Record<string, number | string | boolean>
): { accuracy: number; warnings: string[]; tips: string[] } => {
    let accuracy = config.baseAccuracy;
    const warnings: string[] = [];
    const tips: string[] = [];

    config.hyperparameters.forEach(hp => {
        const value = values[hp.name] ?? hp.default;

        if (hp.type === 'number' && hp.min !== undefined && hp.max !== undefined) {
            const numValue = value as number;
            const range = hp.max - hp.min;
            const position = (numValue - hp.min) / range;

            // Impact based on position in range
            if (hp.accuracyImpact === 'high') {
                // Optimal is usually in middle or depends on context
                const optimalDeviation = Math.abs(position - 0.5);
                if (optimalDeviation > 0.4) {
                    accuracy -= 3;
                    if (position < 0.2 && hp.tipLow) tips.push(hp.tipLow);
                    if (position > 0.8 && hp.tipHigh) tips.push(hp.tipHigh);
                }
            }
        }
    });

    // Add warnings based on common issues
    if (accuracy < config.baseAccuracy - 5) {
        warnings.push('Configuração pode não ser ideal para o caso geral');
    }

    return {
        accuracy: Math.max(50, Math.min(95, accuracy)),
        warnings,
        tips
    };
};

// Modal Component
interface AlgorithmConfigModalProps {
    algorithmId: string;
    isOpen: boolean;
    onClose: () => void;
}

const AlgorithmConfigModal: React.FC<AlgorithmConfigModalProps> = ({
    algorithmId,
    isOpen,
    onClose
}) => {
    const config = ALGORITHM_CONFIGS[algorithmId];
    const [values, setValues] = useState<Record<string, number | string | boolean>>({});

    useEffect(() => {
        if (config) {
            const defaults: Record<string, number | string | boolean> = {};
            config.hyperparameters.forEach(hp => {
                defaults[hp.name] = hp.default;
            });
            setValues(defaults);
        }
    }, [config, algorithmId]);

    if (!isOpen || !config) return null;

    const { accuracy, warnings, tips } = calculateEstimatedAccuracy(config, values);

    const handleChange = (name: string, value: number | string | boolean) => {
        setValues(prev => ({ ...prev, [name]: value }));
    };

    const getAccuracyColor = (acc: number) => {
        if (acc >= 85) return 'text-green-400';
        if (acc >= 75) return 'text-yellow-400';
        if (acc >= 65) return 'text-orange-400';
        return 'text-red-400';
    };

    const getAccuracyBg = (acc: number) => {
        if (acc >= 85) return 'bg-green-500';
        if (acc >= 75) return 'bg-yellow-500';
        if (acc >= 65) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-primary/20 to-purple-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Sliders className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{config.name}</h2>
                            <p className="text-sm text-gray-400">Configuração de Hiperparâmetros</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row">
                    {/* Configuration Panel */}
                    <div className="flex-1 p-6 overflow-y-auto max-h-[60vh] lg:max-h-[70vh]">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-primary" />
                            Hiperparâmetros
                        </h3>

                        <div className="space-y-6">
                            {config.hyperparameters.map(hp => (
                                <div key={hp.name} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                            {hp.label}
                                            <span className={`text-xs px-2 py-0.5 rounded ${hp.accuracyImpact === 'high' ? 'bg-red-500/20 text-red-400' :
                                                hp.accuracyImpact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {hp.accuracyImpact === 'high' ? 'Alto Impacto' :
                                                    hp.accuracyImpact === 'medium' ? 'Médio' : 'Baixo'}
                                            </span>
                                        </label>
                                        {hp.type === 'number' && (
                                            <span className="text-sm text-primary font-mono">
                                                {values[hp.name]}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-500">{hp.description}</p>

                                    {hp.type === 'number' && hp.min !== undefined && hp.max !== undefined && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 w-12">{hp.min}</span>
                                            <input
                                                type="range"
                                                min={hp.min}
                                                max={hp.max}
                                                step={hp.step}
                                                value={values[hp.name] as number}
                                                onChange={e => handleChange(hp.name, parseFloat(e.target.value))}
                                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                            <span className="text-xs text-gray-500 w-12 text-right">{hp.max}</span>
                                        </div>
                                    )}

                                    {hp.type === 'select' && hp.options && (
                                        <select
                                            value={values[hp.name] as string}
                                            onChange={e => handleChange(hp.name, e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary"
                                        >
                                            {hp.options.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    )}

                                    {hp.type === 'boolean' && (
                                        <button
                                            onClick={() => handleChange(hp.name, !values[hp.name])}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${values[hp.name]
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                                                }`}
                                        >
                                            {values[hp.name] ? 'Ativado' : 'Desativado'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Accuracy & Data Panel */}
                    <div className="lg:w-80 p-6 bg-gray-800/50 border-t lg:border-t-0 lg:border-l border-gray-700 space-y-6">
                        {/* Accuracy Gauge */}
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                                <Gauge className="w-5 h-5 text-primary" />
                                Acurácia Estimada
                            </h3>
                            <div className="relative w-32 h-32 mx-auto">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        fill="none"
                                        stroke="#374151"
                                        strokeWidth="12"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        strokeDasharray={`${(accuracy / 100) * 352} 352`}
                                        className={getAccuracyColor(accuracy)}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-3xl font-bold ${getAccuracyColor(accuracy)}`}>
                                        {accuracy}%
                                    </span>
                                </div>
                            </div>
                            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${getAccuracyBg(accuracy)}`}
                                    style={{ width: `${accuracy}%` }}
                                />
                            </div>
                        </div>

                        {/* Warnings & Tips */}
                        {(warnings.length > 0 || tips.length > 0) && (
                            <div className="space-y-2">
                                {warnings.map((w, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded-lg">
                                        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs text-yellow-400">{w}</span>
                                    </div>
                                ))}
                                {tips.map((t, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 bg-blue-500/10 rounded-lg">
                                        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-xs text-blue-400">{t}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Data Requirements */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <Database className="w-5 h-5 text-primary" />
                                Requisitos de Dados
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Mínimo de amostras:</span>
                                    <span className="text-white font-medium">{config.dataRequirements.minSamples.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Ideal:</span>
                                    <span className="text-green-400 font-medium">{config.dataRequirements.idealSamples.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Máximo:</span>
                                    <span className="text-white font-medium">{config.dataRequirements.maxSamples}</span>
                                </div>
                                <div className="border-t border-gray-700 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Features mínimas:</span>
                                        <span className="text-white font-medium">{config.dataRequirements.minFeatures}</span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-gray-400">Features máximas:</span>
                                        <span className="text-white font-medium">{config.dataRequirements.maxFeatures}</span>
                                    </div>
                                </div>
                                {config.dataRequirements.note && (
                                    <div className="p-2 bg-gray-700/50 rounded-lg">
                                        <p className="text-xs text-gray-300 flex items-start gap-2">
                                            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                            {config.dataRequirements.note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Export Config */}
                        <button className="w-full py-3 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Aplicar Configuração
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlgorithmConfigModal;
