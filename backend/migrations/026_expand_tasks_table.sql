-- Migration to add new fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workspace VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS channel VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS stage VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS stage_due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS effort_time VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS origin VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS squad VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS campaign_plan TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by INTEGER; -- Ref Core DB
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_manager_id INTEGER; -- Ref Core DB
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delayed_stage BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_but_late BOOLEAN DEFAULT FALSE;

-- Ensure priority has correct values if enum doesn't exist or update
-- (Assuming priority column exists as text or varchar)
-- Check constraint for status if needed, but existing status column is likely fine.
