-- =====================================================
-- ML MODULE - COMPLETE DATABASE SCHEMA
-- Tables for ALL algorithms + Market Area Results
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS ml_predictions CASCADE;
DROP TABLE IF EXISTS ml_model_versions CASCADE;
DROP TABLE IF EXISTS ml_experiments CASCADE;
DROP TABLE IF EXISTS ml_datasets CASCADE;
DROP TABLE IF EXISTS ml_algorithm_configs CASCADE;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- 1. ML Datasets (metadata for uploaded files)
CREATE TABLE ml_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT,
    row_count INTEGER,
    column_count INTEGER,
    columns JSONB,
    statistics JSONB,
    market_area VARCHAR(100), -- sales, marketing, customers, finance, operations
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ML Experiments (training runs)
CREATE TABLE ml_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    name VARCHAR(255) NOT NULL,
    dataset_id UUID, -- FK removed for synthetic data import
    algorithm VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    target_column VARCHAR(100),
    feature_columns JSONB,
    hyperparameters JSONB,
    preset VARCHAR(50),
    metrics JSONB,
    feature_importance JSONB,
    predictions_sample JSONB,
    confusion_matrix JSONB,
    training_duration INTEGER,
    error_message TEXT,
    model_path VARCHAR(500),
    is_deployed BOOLEAN DEFAULT FALSE,
    market_area VARCHAR(100),
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ML Predictions
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    experiment_id UUID, -- FK removed for synthetic data import
    input_data JSONB,
    predictions JSONB,
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ML Algorithm Configurations
CREATE TABLE ml_algorithm_configs (
    id SERIAL PRIMARY KEY,
    algorithm VARCHAR(100) NOT NULL UNIQUE,
    task_type VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    description TEXT,
    complexity VARCHAR(20),
    estimated_time VARCHAR(50),
    hyperparameters JSONB,
    suitable_for JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- RESULT TABLES PER ALGORITHM TYPE
-- =====================================================

-- REGRESSION RESULTS
CREATE TABLE ml_regression_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID, -- FK removed for synthetic data import
    r2_score FLOAT,
    rmse FLOAT,
    mae FLOAT,
    mape FLOAT,
    mse FLOAT,
    adjusted_r2 FLOAT,
    residuals JSONB,
    predicted_vs_actual JSONB,
    coefficients JSONB,
    intercept FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CLASSIFICATION RESULTS
CREATE TABLE ml_classification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID, -- FK removed for synthetic data import
    accuracy FLOAT,
    precision_score FLOAT,
    recall FLOAT,
    f1_score FLOAT,
    roc_auc FLOAT,
    confusion_matrix JSONB,
    classification_report JSONB,
    roc_curve JSONB,
    precision_recall_curve JSONB,
    class_distribution JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CLUSTERING RESULTS
CREATE TABLE ml_clustering_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID, -- FK removed for synthetic data import
    silhouette_score FLOAT,
    davies_bouldin_index FLOAT,
    calinski_harabasz_score FLOAT,
    n_clusters INTEGER,
    cluster_centers JSONB,
    cluster_sizes JSONB,
    cluster_labels JSONB,
    inertia FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TIME SERIES RESULTS
CREATE TABLE ml_timeseries_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID, -- FK removed for synthetic data import
    mape FLOAT,
    rmse FLOAT,
    mae FLOAT,
    forecast_values JSONB,
    trend JSONB,
    seasonality JSONB,
    residuals JSONB,
    confidence_intervals JSONB,
    forecast_horizon INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MARKET AREA SPECIFIC TABLES
-- =====================================================

-- SALES ANALYTICS
CREATE TABLE ml_sales_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID, -- FK removed for synthetic data import
    period VARCHAR(50),
    total_sales DECIMAL(15,2),
    predicted_sales DECIMAL(15,2),
    growth_rate FLOAT,
    conversion_rate FLOAT,
    avg_ticket DECIMAL(10,2),
    top_products JSONB,
    sales_by_region JSONB,
    sales_trend JSONB,
    seasonality_index JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MARKETING ANALYTICS
CREATE TABLE ml_marketing_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID, -- FK removed for synthetic data import
    campaign_name VARCHAR(255),
    roi FLOAT,
    cac DECIMAL(10,2),
    cpl DECIMAL(10,2),
    ctr FLOAT,
    conversion_rate FLOAT,
    impressions BIGINT,
    clicks BIGINT,
    leads INTEGER,
    channel_performance JSONB,
    audience_segments JSONB,
    predicted_roi FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMER ANALYTICS
CREATE TABLE ml_customer_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID, -- FK removed for synthetic data import
    total_customers INTEGER,
    new_customers INTEGER,
    churned_customers INTEGER,
    churn_rate FLOAT,
    clv DECIMAL(10,2),
    retention_rate FLOAT,
    nps_score FLOAT,
    customer_segments JSONB,
    rfm_analysis JSONB,
    churn_risk_distribution JSONB,
    predicted_churn JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FINANCIAL ANALYTICS
CREATE TABLE ml_financial_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID, -- FK removed for synthetic data import
    period VARCHAR(50),
    revenue DECIMAL(15,2),
    expenses DECIMAL(15,2),
    profit DECIMAL(15,2),
    profit_margin FLOAT,
    cashflow DECIMAL(15,2),
    predicted_revenue DECIMAL(15,2),
    revenue_trend JSONB,
    expense_breakdown JSONB,
    financial_forecast JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INSERT ALGORITHM CONFIGURATIONS (ALL 22 ALGORITHMS)
-- =====================================================

INSERT INTO ml_algorithm_configs (algorithm, task_type, display_name, description, complexity, estimated_time, hyperparameters, suitable_for) VALUES
-- REGRESSION (8 algorithms)
('linear_regression', 'regression', 'Linear Regression', 'Modelo linear simples para prever valores contínuos', 'low', '< 1 min', '{}', '["sales", "finance", "pricing"]'),
('ridge_regression', 'regression', 'Ridge Regression', 'Regressão com regularização L2 para evitar overfitting', 'low', '< 1 min', '{"alpha": {"min": 0.001, "max": 10, "default": 1}}', '["sales", "finance"]'),
('lasso_regression', 'regression', 'Lasso Regression', 'Regressão com regularização L1 e seleção de features', 'low', '< 1 min', '{"alpha": {"min": 0.001, "max": 10, "default": 1}}', '["marketing", "sales"]'),
('elasticnet', 'regression', 'ElasticNet', 'Combinação de L1 e L2 para melhor generalização', 'low', '< 1 min', '{"alpha": {"min": 0.001, "max": 10, "default": 1}, "l1_ratio": {"min": 0, "max": 1, "default": 0.5}}', '["finance", "operations"]'),
('random_forest_regressor', 'regression', 'Random Forest Regressor', 'Ensemble de árvores para previsões robustas', 'medium', '2-5 min', '{"n_estimators": {"min": 10, "max": 500, "default": 100}, "max_depth": {"min": 3, "max": 30, "default": 10}}', '["sales", "marketing", "finance"]'),
('xgboost_regressor', 'regression', 'XGBoost Regressor', 'Gradient boosting de alta performance', 'high', '5-10 min', '{"n_estimators": {"min": 50, "max": 1000, "default": 100}, "max_depth": {"min": 3, "max": 15, "default": 6}, "learning_rate": {"min": 0.01, "max": 0.3, "default": 0.1}}', '["sales", "customers", "finance"]'),
('lightgbm_regressor', 'regression', 'LightGBM Regressor', 'Gradient boosting rápido e eficiente', 'high', '3-8 min', '{"n_estimators": {"min": 50, "max": 1000, "default": 100}, "max_depth": {"min": 3, "max": 15, "default": -1}, "learning_rate": {"min": 0.01, "max": 0.3, "default": 0.1}}', '["marketing", "operations"]'),
('gradient_boosting_regressor', 'regression', 'Gradient Boosting Regressor', 'Boosting sequencial preciso', 'high', '5-15 min', '{"n_estimators": {"min": 50, "max": 500, "default": 100}, "max_depth": {"min": 3, "max": 10, "default": 3}, "learning_rate": {"min": 0.01, "max": 0.3, "default": 0.1}}', '["finance", "sales"]'),

-- CLASSIFICATION (7 algorithms)
('logistic_regression', 'classification', 'Logistic Regression', 'Classificação probabilística linear', 'low', '< 1 min', '{"C": {"min": 0.001, "max": 100, "default": 1}}', '["customers", "marketing"]'),
('decision_tree_classifier', 'classification', 'Decision Tree', 'Árvore de decisão interpretável', 'low', '< 1 min', '{"max_depth": {"min": 3, "max": 30, "default": 10}}', '["customers", "operations"]'),
('random_forest_classifier', 'classification', 'Random Forest Classifier', 'Ensemble robusto para classificação', 'medium', '2-5 min', '{"n_estimators": {"min": 10, "max": 500, "default": 100}, "max_depth": {"min": 3, "max": 30, "default": 10}}', '["customers", "marketing", "sales"]'),
('xgboost_classifier', 'classification', 'XGBoost Classifier', 'Classificação de alta precisão', 'high', '5-10 min', '{"n_estimators": {"min": 50, "max": 1000, "default": 100}, "max_depth": {"min": 3, "max": 15, "default": 6}, "learning_rate": {"min": 0.01, "max": 0.3, "default": 0.1}}', '["customers", "fraud", "churn"]'),
('lightgbm_classifier', 'classification', 'LightGBM Classifier', 'Classificação rápida e eficiente', 'high', '3-8 min', '{"n_estimators": {"min": 50, "max": 1000, "default": 100}, "max_depth": {"min": 3, "max": 15, "default": -1}, "learning_rate": {"min": 0.01, "max": 0.3, "default": 0.1}}', '["marketing", "customers"]'),
('naive_bayes', 'classification', 'Naive Bayes', 'Classificador probabilístico simples', 'low', '< 1 min', '{}', '["text", "spam", "sentiment"]'),
('svm_classifier', 'classification', 'SVM', 'Support Vector Machine para margens ótimas', 'medium', '2-10 min', '{"C": {"min": 0.1, "max": 100, "default": 1}, "kernel": {"options": ["linear", "rbf", "poly"], "default": "rbf"}}', '["customers", "fraud"]'),

-- CLUSTERING (3 algorithms)
('kmeans', 'clustering', 'K-Means', 'Segmentação por particionamento', 'low', '< 1 min', '{"n_clusters": {"min": 2, "max": 20, "default": 5}}', '["customers", "products", "marketing"]'),
('dbscan', 'clustering', 'DBSCAN', 'Clustering baseado em densidade', 'medium', '1-5 min', '{"eps": {"min": 0.1, "max": 10, "default": 0.5}, "min_samples": {"min": 2, "max": 20, "default": 5}}', '["customers", "anomalies"]'),
('hierarchical', 'clustering', 'Hierarchical Clustering', 'Clustering hierárquico aglomerativo', 'medium', '2-5 min', '{"n_clusters": {"min": 2, "max": 20, "default": 5}}', '["products", "customers"]'),

-- TIME SERIES (4 algorithms)
('prophet', 'timeseries', 'Prophet', 'Previsão de séries temporais com sazonalidade', 'medium', '2-5 min', '{"seasonality_mode": {"options": ["additive", "multiplicative"], "default": "additive"}}', '["sales", "demand", "traffic"]'),
('arima', 'timeseries', 'ARIMA', 'Modelo autoregressivo integrado', 'medium', '1-3 min', '{"p": {"min": 0, "max": 5, "default": 1}, "d": {"min": 0, "max": 2, "default": 1}, "q": {"min": 0, "max": 5, "default": 1}}', '["finance", "sales"]'),
('sarima', 'timeseries', 'SARIMA', 'ARIMA sazonal para padrões periódicos', 'high', '3-10 min', '{"p": {"min": 0, "max": 3, "default": 1}, "d": {"min": 0, "max": 2, "default": 1}, "q": {"min": 0, "max": 3, "default": 1}, "seasonal_period": {"min": 4, "max": 52, "default": 12}}', '["sales", "retail"]'),
('exponential_smoothing', 'timeseries', 'Exponential Smoothing', 'Suavização para tendências e sazonalidade', 'low', '< 1 min', '{"trend": {"options": ["add", "mul", null], "default": "add"}, "seasonal": {"options": ["add", "mul", null], "default": "add"}}', '["inventory", "demand"]');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_ml_datasets_tenant ON ml_datasets(tenant_id);
CREATE INDEX idx_ml_datasets_market ON ml_datasets(market_area);
CREATE INDEX idx_ml_experiments_tenant ON ml_experiments(tenant_id);
CREATE INDEX idx_ml_experiments_dataset ON ml_experiments(dataset_id);
CREATE INDEX idx_ml_experiments_status ON ml_experiments(status);
CREATE INDEX idx_ml_experiments_algorithm ON ml_experiments(algorithm);
CREATE INDEX idx_ml_experiments_market ON ml_experiments(market_area);
CREATE INDEX idx_ml_predictions_experiment ON ml_predictions(experiment_id);
