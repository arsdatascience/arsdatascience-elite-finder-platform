-- Migration: AI Insights Table
-- Stores AI-generated insights for customer journey analysis

CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    insight_type VARCHAR(50) NOT NULL, -- 'customer_journey_all', 'customer_journey_churn', 'customer_journey_upsell'
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    full_analysis JSONB NOT NULL DEFAULT '{}',
    data_sources JSONB DEFAULT '{}', -- {crossover: {...}, megalev: {...}}
    qdrant_context JSONB DEFAULT '[]', -- Context retrieved from vector DB
    report_url TEXT, -- S3 URL for generated report
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_tenant ON ai_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created ON ai_insights(created_at DESC);

-- Comments
COMMENT ON TABLE ai_insights IS 'AI-generated insights for customer journey analysis';
COMMENT ON COLUMN ai_insights.full_analysis IS 'Complete JSON with keyFindings, opportunities, risks, recommendations';
COMMENT ON COLUMN ai_insights.data_sources IS 'Summary of data sources used (Crossover, Megalev)';
COMMENT ON COLUMN ai_insights.qdrant_context IS 'Context retrieved from Qdrant vector search';
COMMENT ON COLUMN ai_insights.report_url IS 'S3 URL for downloadable HTML report';
