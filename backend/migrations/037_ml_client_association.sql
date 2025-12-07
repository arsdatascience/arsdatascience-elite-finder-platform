-- =====================================================
-- ML MODULE - CLIENT ASSOCIATION
-- Add client_id to enable per-client analytics
-- Links to clients table in crossover DB
-- =====================================================

-- Add client_id to ml_datasets
ALTER TABLE ml_datasets 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

-- Add client_id to ml_experiments
ALTER TABLE ml_experiments 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

-- Add client_id to ml_segment_analytics
ALTER TABLE ml_segment_analytics 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

-- Add client_id to ml_predictions (for direct association)
ALTER TABLE ml_predictions 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

-- Add client_id to result tables
ALTER TABLE ml_regression_results 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

ALTER TABLE ml_classification_results 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

ALTER TABLE ml_clustering_results 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

ALTER TABLE ml_timeseries_results 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

-- Add client_id to market analytics tables
ALTER TABLE ml_sales_analytics 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

ALTER TABLE ml_marketing_analytics 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

ALTER TABLE ml_customer_analytics 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

ALTER TABLE ml_financial_analytics 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

-- =====================================================
-- INDEXES FOR CLIENT-BASED QUERIES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ml_datasets_client ON ml_datasets(client_id);
CREATE INDEX IF NOT EXISTS idx_ml_experiments_client ON ml_experiments(client_id);
CREATE INDEX IF NOT EXISTS idx_ml_segment_analytics_client ON ml_segment_analytics(client_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_client ON ml_predictions(client_id);
CREATE INDEX IF NOT EXISTS idx_ml_regression_results_client ON ml_regression_results(client_id);
CREATE INDEX IF NOT EXISTS idx_ml_classification_results_client ON ml_classification_results(client_id);
CREATE INDEX IF NOT EXISTS idx_ml_clustering_results_client ON ml_clustering_results(client_id);
CREATE INDEX IF NOT EXISTS idx_ml_timeseries_results_client ON ml_timeseries_results(client_id);
CREATE INDEX IF NOT EXISTS idx_ml_sales_analytics_client ON ml_sales_analytics(client_id);
CREATE INDEX IF NOT EXISTS idx_ml_marketing_analytics_client ON ml_marketing_analytics(client_id);
CREATE INDEX IF NOT EXISTS idx_ml_customer_analytics_client ON ml_customer_analytics(client_id);
CREATE INDEX IF NOT EXISTS idx_ml_financial_analytics_client ON ml_financial_analytics(client_id);

-- =====================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ml_experiments_client_status ON ml_experiments(client_id, status);
CREATE INDEX IF NOT EXISTS idx_ml_experiments_client_algorithm ON ml_experiments(client_id, algorithm);
CREATE INDEX IF NOT EXISTS idx_ml_segment_analytics_client_segment ON ml_segment_analytics(client_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_ml_segment_analytics_client_type ON ml_segment_analytics(client_id, analysis_type);
