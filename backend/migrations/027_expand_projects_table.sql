-- Migration to expand projects table with detailed planning fields

-- Objectives & Strategy
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketing_objectives TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS value_proposition TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brand_positioning TEXT;

-- Planning
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketing_channels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS timeline_activities TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dependencies TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS key_milestones JSONB DEFAULT '[]'::jsonb;

-- Resources
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_structure JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tools_platforms TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS external_suppliers TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS creative_assets TEXT;

-- Metrics & Tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS kpis TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS goals TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS analysis_tools TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS reporting_frequency VARCHAR(100);

-- Detailed Budget
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_media DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_production DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_contingency DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_breakdown JSONB DEFAULT '{}'::jsonb;

-- Risks
ALTER TABLE projects ADD COLUMN IF NOT EXISTS risks TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS mitigation_plan TEXT;

-- Approvals & Docs
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS creative_brief_link TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assets_link TEXT;
