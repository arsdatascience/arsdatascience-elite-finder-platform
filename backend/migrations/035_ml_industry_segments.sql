-- =====================================================
-- ML MODULE - INDUSTRY SEGMENTS EXTENSION
-- Add industry segment dimension and visualization data
-- Migration 035
-- =====================================================

-- 1. INDUSTRY SEGMENTS DIMENSION TABLE
CREATE TABLE IF NOT EXISTS ml_industry_segments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_pt VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    typical_metrics JSONB DEFAULT '[]',
    typical_algorithms JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. SEGMENT ANALYTICS TABLE (Algorithm results per segment)
CREATE TABLE IF NOT EXISTS ml_segment_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id INTEGER, -- FK removed for synthetic data import
    experiment_id UUID, -- FK removed for synthetic data import
    tenant_id UUID,
    
    -- Analysis metadata
    analysis_date DATE DEFAULT CURRENT_DATE,
    analysis_type VARCHAR(50), -- regression, classification, clustering, timeseries
    algorithm VARCHAR(100),
    
    -- Results
    primary_metric_name VARCHAR(100),
    primary_metric_value FLOAT,
    secondary_metrics JSONB DEFAULT '{}',
    
    -- Visualization data
    chart_data JSONB DEFAULT '{}',
    table_data JSONB DEFAULT '[]',
    
    -- Context
    sample_size INTEGER,
    confidence_level FLOAT DEFAULT 0.95,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. REGRESSION VISUALIZATION DATA
CREATE TABLE IF NOT EXISTS ml_viz_regression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_analytics_id UUID, -- FK removed for synthetic data import
    
    -- Regression-specific visualizations
    scatter_data JSONB,         -- actual vs predicted points
    residual_plot JSONB,        -- residuals distribution
    coefficient_chart JSONB,    -- feature coefficients
    trend_line JSONB,           -- fitted line data
    
    -- Metrics for display
    r2 FLOAT,
    rmse FLOAT,
    mae FLOAT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CLASSIFICATION VISUALIZATION DATA
CREATE TABLE IF NOT EXISTS ml_viz_classification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_analytics_id UUID, -- FK removed for synthetic data import
    
    -- Classification-specific visualizations
    confusion_matrix JSONB,     -- matrix data for heatmap
    roc_curve JSONB,            -- ROC curve points
    pr_curve JSONB,             -- Precision-Recall curve
    class_distribution JSONB,   -- bar chart data
    
    -- Metrics for display
    accuracy FLOAT,
    precision_score FLOAT,
    recall FLOAT,
    f1 FLOAT,
    auc FLOAT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. CLUSTERING VISUALIZATION DATA
CREATE TABLE IF NOT EXISTS ml_viz_clustering (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_analytics_id UUID, -- FK removed for synthetic data import
    
    -- Clustering-specific visualizations
    cluster_scatter JSONB,      -- 2D projection of clusters
    cluster_sizes JSONB,        -- pie/bar chart data
    centroid_radar JSONB,       -- radar chart for centroids
    elbow_plot JSONB,           -- elbow method visualization
    
    -- Metrics for display
    n_clusters INTEGER,
    silhouette_score FLOAT,
    inertia FLOAT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TIME SERIES VISUALIZATION DATA
CREATE TABLE IF NOT EXISTS ml_viz_timeseries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_analytics_id UUID, -- FK removed for synthetic data import
    
    -- Time series-specific visualizations
    historical_data JSONB,      -- line chart historical
    forecast_data JSONB,        -- forecast with confidence bands
    seasonality_chart JSONB,    -- seasonal decomposition
    trend_chart JSONB,          -- trend component
    
    -- Metrics for display
    mape FLOAT,
    rmse FLOAT,
    forecast_horizon INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INSERT BASE INDUSTRY SEGMENTS
-- =====================================================

INSERT INTO ml_industry_segments (code, name_pt, name_en, description, icon, color, typical_metrics, typical_algorithms) VALUES
('ecommerce', 'E-commerce', 'E-commerce', 
 'Comércio eletrônico e marketplaces online', 
 'ShoppingCart', '#3B82F6',
 '["GMV", "CAC", "LTV", "Conversion Rate", "Cart Abandonment", "AOV"]',
 '["xgboost_classifier", "random_forest_classifier", "prophet", "kmeans"]'),

('retail', 'Varejo', 'Retail', 
 'Lojas físicas e redes de varejo tradicional', 
 'Store', '#10B981',
 '["Ticket Médio", "Vendas/m²", "Giro de Estoque", "Margem", "Footfall"]',
 '["random_forest_regressor", "xgboost_regressor", "arima", "kmeans"]'),

('technology', 'Tecnologia', 'Technology', 
 'Empresas de software, SaaS e serviços digitais', 
 'Cpu', '#8B5CF6',
 '["MRR", "ARR", "Churn Rate", "ARPU", "NPS", "LTV:CAC"]',
 '["xgboost_classifier", "logistic_regression", "prophet", "dbscan"]'),

('agriculture', 'Agricultura', 'Agriculture', 
 'Agronegócio, produção rural e commodities', 
 'Sprout', '#22C55E',
 '["Produtividade/ha", "Custo/ha", "Yield", "Preço Commodity", "Área Plantada"]',
 '["random_forest_regressor", "gradient_boosting_regressor", "arima", "kmeans"]'),

('automotive', 'Concessionárias', 'Automotive Dealers', 
 'Concessionárias e revendas de veículos', 
 'Car', '#F59E0B',
 '["Vendas Unidades", "Ticket Médio", "Financiamento %", "Margem Veículos", "Pós-Venda"]',
 '["xgboost_regressor", "random_forest_classifier", "sarima", "hierarchical"]'),

('aesthetics', 'Clínicas Estética', 'Aesthetic Clinics', 
 'Clínicas de estética, beleza e bem-estar', 
 'Sparkles', '#EC4899',
 '["Recorrência", "LTV", "Cancelamentos", "Ticket Serviço", "Ocupação Agenda"]',
 '["logistic_regression", "xgboost_classifier", "prophet", "kmeans"]')

ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_segment_analytics_segment ON ml_segment_analytics(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_analytics_experiment ON ml_segment_analytics(experiment_id);
CREATE INDEX IF NOT EXISTS idx_segment_analytics_type ON ml_segment_analytics(analysis_type);
CREATE INDEX IF NOT EXISTS idx_segment_analytics_algorithm ON ml_segment_analytics(algorithm);
CREATE INDEX IF NOT EXISTS idx_segment_analytics_date ON ml_segment_analytics(analysis_date);

CREATE INDEX IF NOT EXISTS idx_viz_regression_segment ON ml_viz_regression(segment_analytics_id);
CREATE INDEX IF NOT EXISTS idx_viz_classification_segment ON ml_viz_classification(segment_analytics_id);
CREATE INDEX IF NOT EXISTS idx_viz_clustering_segment ON ml_viz_clustering(segment_analytics_id);
CREATE INDEX IF NOT EXISTS idx_viz_timeseries_segment ON ml_viz_timeseries(segment_analytics_id);
