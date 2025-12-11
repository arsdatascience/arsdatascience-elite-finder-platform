
const { Pool } = require('pg');

const maglevPool = new Pool({
    connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
    ssl: { rejectUnauthorized: false }
});

async function repair() {
    const client = await maglevPool.connect();
    try {
        console.log('🔧 Repairing Maglev Schema...');

        // 1. PROJECT ACTIVITY LOG (from server.js / Project Management)
        console.log('Creating project_activity_log...');
        await client.query(`
          CREATE TABLE IF NOT EXISTS project_activity_log (
              id SERIAL PRIMARY KEY,
              tenant_id INTEGER, -- Ref Core DB
              project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
              task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
              user_id INTEGER, -- Ref Core DB
              
              action_type VARCHAR(50) NOT NULL,
              details JSONB,
              
              created_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('✅ project_activity_log created.');

        // 2. APPROVAL REQUESTS (from 024)
        console.log('Creating approval_requests...');
        await client.query(`
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
        `);
        console.log('✅ approval_requests created.');

        // 3. PROJECT TEMPLATES (from 024)
        console.log('Creating project_templates...');
        await client.query(`
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
        `);
        console.log('✅ project_templates created.');

        // 4. SERVICE CATALOG (from 024)
        console.log('Creating service_catalog...');
        await client.query(`
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
        `);
        console.log('✅ service_catalog created.');

    } catch (err) {
        console.error('❌ REPAIR ERROR:', err.message);
    } finally {
        client.release();
        maglevPool.end();
    }
}

repair();
