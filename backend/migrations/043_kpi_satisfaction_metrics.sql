-- Migration: Customer KPIs and Satisfaction Metrics
-- Created: 2025-12-07
-- Purpose: Add tables for NPS, CSAT, retention tracking, and internal health metrics

-- ============================================
-- 1. NPS SURVEYS (Net Promoter Score)
-- ============================================
CREATE TABLE IF NOT EXISTS nps_surveys (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  client_id INTEGER, -- References clients(id) in crossover DB
  customer_id UUID REFERENCES unified_customers(id) ON DELETE SET NULL,
  
  -- NPS Score (0-10)
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  category VARCHAR(20) GENERATED ALWAYS AS (
    CASE 
      WHEN score >= 9 THEN 'promoter'
      WHEN score >= 7 THEN 'passive'
      ELSE 'detractor'
    END
  ) STORED,
  
  -- Context
  feedback TEXT,
  touchpoint VARCHAR(100), -- project_delivery, support_call, monthly_review
  project_id INTEGER,
  
  -- Timestamps
  survey_sent_at TIMESTAMP,
  responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nps_tenant ON nps_surveys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nps_client ON nps_surveys(client_id);
CREATE INDEX IF NOT EXISTS idx_nps_date ON nps_surveys(responded_at DESC);

-- ============================================
-- 2. CSAT SURVEYS (Client Satisfaction Score)
-- ============================================
CREATE TABLE IF NOT EXISTS csat_surveys (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  client_id INTEGER,
  customer_id UUID REFERENCES unified_customers(id) ON DELETE SET NULL,
  
  -- CSAT Score (1-5)
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  
  -- Context
  feedback TEXT,
  category VARCHAR(50), -- service_quality, communication, deliverables, timeliness
  project_id INTEGER,
  campaign_id INTEGER,
  
  -- Timestamps
  survey_sent_at TIMESTAMP,
  responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_csat_tenant ON csat_surveys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_csat_client ON csat_surveys(client_id);
CREATE INDEX IF NOT EXISTS idx_csat_date ON csat_surveys(responded_at DESC);

-- ============================================
-- 3. CLIENT HEALTH METRICS (Monthly Snapshot)
-- ============================================
CREATE TABLE IF NOT EXISTS client_health_metrics (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  client_id INTEGER NOT NULL,
  
  -- Period
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  
  -- Revenue Metrics
  mrr DECIMAL(12,2) DEFAULT 0, -- Monthly Recurring Revenue
  revenue_change_pct DECIMAL(5,2) DEFAULT 0,
  
  -- Engagement Metrics
  interactions_count INTEGER DEFAULT 0,
  response_time_avg_hours DECIMAL(5,2),
  meetings_count INTEGER DEFAULT 0,
  
  -- Satisfaction Metrics
  nps_score DECIMAL(4,2),
  csat_score DECIMAL(4,2),
  
  -- Health Indicators
  churn_risk VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
  health_score INTEGER DEFAULT 100, -- 0-100
  
  -- Timestamps
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, client_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_health_client ON client_health_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_health_period ON client_health_metrics(period_year, period_month);

-- ============================================
-- 4. AGENCY KPI SNAPSHOTS (Daily/Monthly)
-- ============================================
CREATE TABLE IF NOT EXISTS agency_kpi_snapshots (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  
  -- Period
  snapshot_date DATE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly
  
  -- Financial Health
  mrr DECIMAL(12,2) DEFAULT 0,
  arr DECIMAL(12,2) DEFAULT 0,
  revenue_total DECIMAL(12,2) DEFAULT 0,
  expenses_total DECIMAL(12,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  
  -- Client Metrics
  total_clients INTEGER DEFAULT 0,
  new_clients INTEGER DEFAULT 0,
  churned_clients INTEGER DEFAULT 0,
  retention_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Acquisition Metrics
  cac DECIMAL(12,2) DEFAULT 0, -- Customer Acquisition Cost
  avg_clv DECIMAL(12,2) DEFAULT 0, -- Average Customer Lifetime Value
  ltv_cac_ratio DECIMAL(5,2) DEFAULT 0,
  
  -- Satisfaction Metrics
  avg_nps DECIMAL(4,2),
  avg_csat DECIMAL(4,2),
  nps_responses INTEGER DEFAULT 0,
  csat_responses INTEGER DEFAULT 0,
  
  -- Operational Metrics
  active_projects INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  avg_project_margin DECIMAL(5,2) DEFAULT 0,
  
  -- Team Metrics
  team_utilization DECIMAL(5,2) DEFAULT 0, -- % of billable time
  employee_count INTEGER DEFAULT 0,
  
  -- Timestamps
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, snapshot_date, period_type)
);

CREATE INDEX IF NOT EXISTS idx_kpi_tenant ON agency_kpi_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kpi_date ON agency_kpi_snapshots(snapshot_date DESC);

-- ============================================
-- 5. EMPLOYEE HAPPINESS SURVEYS
-- ============================================
CREATE TABLE IF NOT EXISTS employee_happiness (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  user_id INTEGER, -- References users(id) in crossover DB
  
  -- Score (1-10)
  happiness_score INTEGER NOT NULL CHECK (happiness_score >= 1 AND happiness_score <= 10),
  workload_score INTEGER CHECK (workload_score >= 1 AND workload_score <= 5),
  
  -- Categories
  feedback TEXT,
  areas_to_improve TEXT[],
  
  -- Period
  survey_week DATE, -- Week starting date
  
  -- Timestamps
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_anonymous BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_happiness_tenant ON employee_happiness(tenant_id);
CREATE INDEX IF NOT EXISTS idx_happiness_week ON employee_happiness(survey_week DESC);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE nps_surveys IS 'Net Promoter Score survey responses (0-10 scale)';
COMMENT ON TABLE csat_surveys IS 'Client Satisfaction Score responses (1-5 scale)';
COMMENT ON TABLE client_health_metrics IS 'Monthly snapshot of individual client health';
COMMENT ON TABLE agency_kpi_snapshots IS 'Daily/monthly agency-wide KPI tracking';
COMMENT ON TABLE employee_happiness IS 'Weekly employee satisfaction tracking';
