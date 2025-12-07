-- Migration: Phase 2 - Operations & Knowledge (Asset Library, Approvals, Templates)

-- 1. ASSET FOLDERS (Hierarchical Structure)
CREATE TABLE IF NOT EXISTS asset_folders (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER, -- Ref Core DB
    parent_id INTEGER REFERENCES asset_folders(id) ON DELETE CASCADE,
    client_id INTEGER, -- Ref Core DB
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, -- Optional: Folders for specific projects
    
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) DEFAULT '#cbd5e1',
    is_system BOOLEAN DEFAULT false, -- e.g., "All Files", "Trash"
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_tenant ON asset_folders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON asset_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_client ON asset_folders(client_id);

-- 2. ASSETS (Digital Library Files)
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER, -- Ref Core DB
    folder_id INTEGER REFERENCES asset_folders(id) ON DELETE SET NULL,
    uploader_id INTEGER, -- Ref Core DB
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    file_key VARCHAR(500) NOT NULL, -- S3 Key
    file_url VARCHAR(1000) NOT NULL, -- Public/Signed URL
    file_type VARCHAR(100), -- MIME type
    file_size BIGINT, -- Bytes
    
    tags TEXT[],
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_folder ON assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_assets_tenant ON assets(tenant_id);

-- 3. APPROVAL REQUESTS (Comunicação e Aprovação)
CREATE TABLE IF NOT EXISTS approval_requests (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER, -- Ref Core DB
    
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE, -- Can approve a file/art
    social_post_id INTEGER, -- Ref Core DB (social_posts)
    
    requester_id INTEGER, -- Ref Core DB
    client_contact_id INTEGER, -- External client contact (future feature)
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, changes_requested
    title VARCHAR(255) NOT NULL,
    notes TEXT, -- Comments from requester
    
    review_token VARCHAR(255) UNIQUE, -- For external access without login (magic link)
    reviewed_at TIMESTAMP,
    reviewer_comments TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_tenant ON approval_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approvals_token ON approval_requests(review_token);

-- 4. PROJECT TEMPLATES (Processos e Modelos)
CREATE TABLE IF NOT EXISTS project_templates (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER, -- Ref Core DB
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    default_tasks JSONB DEFAULT '[]', -- Array of task definitions { title, desc, relative_due_day }
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. SERVICE CATALOG (Gestão de Produto)
CREATE TABLE IF NOT EXISTS service_catalog (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER, -- Ref Core DB
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2),
    billing_cycle VARCHAR(50) DEFAULT 'one_time', -- monthly, yearly, one_time
    
    deliverables JSONB DEFAULT '[]', -- List of standard deliverables
    
    created_at TIMESTAMP DEFAULT NOW()
);
