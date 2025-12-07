-- Migration: Project Management Module
-- Description: Adds tables for Projects, Tasks, Members, and Comments with strict Tenant isolation.
-- NOTE: client_id references clients.id in crossover database (no FK possible across DBs)

-- 1. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    client_id INTEGER, -- References clients(id) in crossover DB - Optional link to Client
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,    -- Project Manager
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    
    settings JSONB DEFAULT '{}', -- Flexible settings (e.g., custom statuses)
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 2. PROJECT MEMBERS (System Users assigned to Project)
CREATE TABLE IF NOT EXISTS project_members (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- manager, member, viewer
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- 3. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE, -- Redundant but safer for queries
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL, -- For Subtasks
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    status VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, review, done (customizable via project settings ideally, but hardcoded fallback)
    priority VARCHAR(20) DEFAULT 'medium',
    
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    due_date TIMESTAMP,
    start_date TIMESTAMP,
    completed_at TIMESTAMP,
    
    estimated_minutes INTEGER DEFAULT 0,
    logged_minutes INTEGER DEFAULT 0,
    
    tags TEXT[],
    column_order INTEGER DEFAULT 0, -- For Kanban ordering
    
    metadata JSONB DEFAULT '{}', -- For custom fields or integrations
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- 4. TASK COMMENTS (Collaboration)
CREATE TABLE IF NOT EXISTS task_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- If true, hidden from clients (future proofing)
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. TASK ATTACHMENTS (Linking to S3/Storage)
CREATE TABLE IF NOT EXISTS task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. AUDIT LOG (Track changes)
CREATE TABLE IF NOT EXISTS project_activity_log (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    action_type VARCHAR(50) NOT NULL, -- created, updated, deleted, comment, status_change
    details JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);
