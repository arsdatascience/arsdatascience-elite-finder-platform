const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// DATABASE INITIALIZATION
// ============================================
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                client_id UUID, -- REFERENCES clients(id) - Removido FK estrita para evitar erros se clients não existir
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                company VARCHAR(255),
                source VARCHAR(50),
                status VARCHAR(50) DEFAULT 'new',
                value DECIMAL(10, 2),
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Leads table initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

// Initialize DB on start
initDb();

// ============================================
// USERS
// ============================================
const getUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, avatar_url, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// ============================================
// CLIENTS
// ============================================
const getClients = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

const createClient = async (req, res) => {
    const { name, type, email, phone, city, company_size, industry } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO clients (name, type, email, phone, city, company_size, industry) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, type, email, phone, city, company_size, industry]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
};

const updateClient = async (req, res) => {
    const { id } = req.params;
    const { name, type, email, phone, city, company_size, industry } = req.body;
    try {
        const result = await pool.query(
            'UPDATE clients SET name = $1, type = $2, email = $3, phone = $4, city = $5, company_size = $6, industry = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
            [name, type, email, phone, city, company_size, industry, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
};

// ============================================
// CAMPAIGNS
// ============================================
const getCampaigns = async (req, res) => {
    try {
        const { client_id } = req.query;
        let query = 'SELECT * FROM campaigns ORDER BY created_at DESC';
        let params = [];

        if (client_id && client_id !== 'all') {
            query = 'SELECT * FROM campaigns WHERE client_id = $1 ORDER BY created_at DESC';
            params = [client_id];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
};

// ============================================
// LEADS
// ============================================
const getLeads = async (req, res) => {
    try {
        const { client_id, status } = req.query;
        let query = 'SELECT * FROM leads ORDER BY created_at DESC';
        let params = [];

        if (client_id && client_id !== 'all') {
            query = 'SELECT * FROM leads WHERE client_id = $1 ORDER BY created_at DESC';
            params = [client_id];
        }

        if (status) {
            query += params.length > 0 ? ' AND status = $2' : ' WHERE status = $1';
            params.push(status);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
};

const createLead = async (req, res) => {
    const { client_id, name, email, phone, company, source, status, value, notes } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO leads (client_id, name, email, phone, company, source, status, value, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [client_id, name, email, phone, company, source, status || 'new', value || 0, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
};

const updateLeadStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
};

// ============================================
// CHAT MESSAGES
// ============================================
const getChatMessages = async (req, res) => {
    const { lead_id } = req.query;
    try {
        const result = await pool.query(
            'SELECT * FROM chat_messages WHERE lead_id = $1 ORDER BY timestamp ASC',
            [lead_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
};

// ============================================
// SOCIAL POSTS
// ============================================
const getSocialPosts = async (req, res) => {
    try {
        const { client_id } = req.query;
        let query = 'SELECT * FROM social_posts ORDER BY created_at DESC';
        let params = [];

        if (client_id && client_id !== 'all') {
            query = 'SELECT * FROM social_posts WHERE client_id = $1 ORDER BY created_at DESC';
            params = [client_id];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching social posts:', error);
        res.status(500).json({ error: 'Failed to fetch social posts' });
    }
};

// ============================================
// AUTOMATION WORKFLOWS
// ============================================
const getWorkflows = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM automation_workflows ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ error: 'Failed to fetch workflows' });
    }
};

const getWorkflowSteps = async (req, res) => {
    const { workflow_id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM automation_workflow_steps WHERE workflow_id = $1 ORDER BY step_order',
            [workflow_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workflow steps:', error);
        res.status(500).json({ error: 'Failed to fetch workflow steps' });
    }
};

// ============================================
// TRAINING MODULES
// ============================================
const getTrainingModules = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM training_modules ORDER BY order_index');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching training modules:', error);
        res.status(500).json({ error: 'Failed to fetch training modules' });
    }
};

const getTrainingProgress = async (req, res) => {
    const { user_id } = req.query;
    try {
        const result = await pool.query(
            'SELECT * FROM training_progress WHERE user_id = $1',
            [user_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching training progress:', error);
        res.status(500).json({ error: 'Failed to fetch training progress' });
    }
};

// ============================================
// KPIS
// ============================================
const getKPIs = async (req, res) => {
    try {
        const { client_id } = req.query;
        let query = 'SELECT * FROM kpis ORDER BY created_at DESC LIMIT 10';
        let params = [];

        if (client_id && client_id !== 'all') {
            query = 'SELECT * FROM kpis WHERE client_id = $1 ORDER BY created_at DESC LIMIT 10';
            params = [client_id];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({ error: 'Failed to fetch KPIs' });
    }
};

// ============================================
// DEVICE STATS
// ============================================
const getDeviceStats = async (req, res) => {
    try {
        const { client_id, campaign_id } = req.query;
        let query = 'SELECT device_type, SUM(percentage) as percentage, SUM(conversions) as conversions FROM device_stats';
        let params = [];
        let conditions = [];

        if (client_id && client_id !== 'all') {
            conditions.push(`client_id = $${params.length + 1}`);
            params.push(client_id);
        }

        if (campaign_id) {
            conditions.push(`campaign_id = $${params.length + 1}`);
            params.push(campaign_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY device_type';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching device stats:', error);
        res.status(500).json({ error: 'Failed to fetch device stats' });
    }
};

module.exports = {
    getUsers,
    getClients,
    createClient,
    updateClient,
    getCampaigns,
    getLeads,
    createLead,
    updateLeadStatus,
    getChatMessages,
    getSocialPosts,
    getWorkflows,
    getWorkflowSteps,
    getTrainingModules,
    getTrainingProgress,
    getKPIs,
    getDeviceStats
};
