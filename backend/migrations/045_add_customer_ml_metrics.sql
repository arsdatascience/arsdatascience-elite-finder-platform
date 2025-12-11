-- Migration: Add ML Metrics to Unified Customers
-- Purpose: Store calculated AI metrics for caching and fast access

ALTER TABLE unified_customers 
ADD COLUMN IF NOT EXISTS churn_probability DECIMAL(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;

-- Index for filtering high risk/high engagement customers
CREATE INDEX IF NOT EXISTS idx_unified_customers_churn ON unified_customers(churn_probability);
CREATE INDEX IF NOT EXISTS idx_unified_customers_engagement ON unified_customers(engagement_score);
