-- Migration to expand tasks table with detailed fields

-- Identification
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reference_code VARCHAR(50); -- e.g. PROJ-001

-- Responsibility
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS collaborators_ids INTEGER[]; -- Array of User IDs
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approvers_ids INTEGER[]; -- Array of User IDs
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS stakeholders_ids INTEGER[]; -- Array of User IDs
-- assignee_id already exists

-- Specs & Formats
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deliverable_format VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS technical_specs TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS brand_guidelines TEXT;

-- Progress & Dependencies
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS percent_complete INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependency_ids INTEGER[]; -- Predecessors
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blockers TEXT;

-- Assets & Resources
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS briefing_link TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visual_references TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS support_materials TEXT;

-- Results & Feedback
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS final_delivery_link TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_reference_code ON tasks(reference_code);
