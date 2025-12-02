const { Pool } = require('pg');
const { triggerWebhook } = require('./services/webhookService');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// DATABASE INITIALIZATION
// ============================================
// ============================================
// DATABASE INITIALIZATION
// ============================================
// A inicialização do banco é feita via schema.sql no server.js

// ============================================
// USERS
// ============================================
const getUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.name, u.first_name, u.last_name, u.email, u.role, u.avatar_url, u.created_at, u.status,
                   t.name as tenant_name
            FROM users u
            LEFT JOIN tenants t ON u.tenant_id = t.id
            ORDER BY u.created_at DESC
        `);
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
    const {
        name, type, email, phone, whatsapp, document, foundationDate,
        cep, street, number, complement, neighborhood, city, state,
        instagramUrl, facebookUrl, linkedinUrl, website,
        notes, company_size, industry
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO clients (
                name, type, email, phone, whatsapp, document, foundation_date,
                address_zip, address_street, address_number, address_complement, address_neighborhood, address_city, address_state,
                instagram_url, facebook_url, linkedin_url, website,
                notes, company_size, industry
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
            [
                name, type, email, phone, whatsapp, document, foundationDate || null,
                cep, street, number, complement, neighborhood, city, state,
                instagramUrl, facebookUrl, linkedinUrl, website,
                notes, company_size, industry
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
};

const updateClient = async (req, res) => {
    const { id } = req.params;
    const {
        name, type, email, phone, whatsapp, document, foundationDate,
        cep, street, number, complement, neighborhood, city, state,
        instagramUrl, facebookUrl, linkedinUrl, website,
        notes, company_size, industry
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE clients SET 
                name = $1, type = $2, email = $3, phone = $4, whatsapp = $5, document = $6, foundation_date = $7,
                address_zip = $8, address_street = $9, address_number = $10, address_complement = $11, address_neighborhood = $12, address_city = $13, address_state = $14,
                instagram_url = $15, facebook_url = $16, linkedin_url = $17, website = $18,
                notes = $19, company_size = $20, industry = $21, 
                updated_at = NOW() 
            WHERE id = $22 RETURNING *`,
            [
                name, type, email, phone, whatsapp, document, foundationDate || null,
                cep, street, number, complement, neighborhood, city, state,
                instagramUrl, facebookUrl, linkedinUrl, website,
                notes, company_size, industry,
                id
            ]
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

        if (result.rows.length === 0) {
            // Mock data for demonstration if DB is empty
            // Mock dinâmico baseado no client_id
            const id = parseInt(client_id) || 1;
            const multiplier = 1 + (id * 0.2);

            return res.json([
                { id: 1, name: `Campanha Performance ${2024 + id}`, platform: 'google', status: 'active', budget: Math.floor(5000 * multiplier), spent: Math.floor(2300 * multiplier), ctr: 2.5, roas: 4.1, conversions: Math.floor(150 * multiplier), created_at: new Date() },
                { id: 2, name: `Promoção ${id === 1 ? 'Tech' : id === 2 ? 'Food' : 'Style'}`, platform: 'meta', status: 'active', budget: Math.floor(3000 * multiplier), spent: Math.floor(1200 * multiplier), ctr: 1.8, roas: 3.5, conversions: Math.floor(80 * multiplier), created_at: new Date() },
                { id: 3, name: 'Retargeting Institucional', platform: 'meta', status: 'paused', budget: Math.floor(1000 * multiplier), spent: Math.floor(450 * multiplier), ctr: 0.9, roas: 2.0, conversions: Math.floor(15 * multiplier), created_at: new Date() },
                { id: 4, name: 'Search Institucional', platform: 'google', status: 'learning', budget: Math.floor(2000 * multiplier), spent: Math.floor(150 * multiplier), ctr: 3.2, roas: 0, conversions: 2, created_at: new Date() }
            ]);
        }

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
        const newLead = result.rows[0];
        res.status(201).json(newLead);

        // Webhook
        if (req.user && req.user.id) {
            triggerWebhook(req.user.id, 'lead.created', newLead);
        }
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
        const updatedLead = result.rows[0];
        res.json(updatedLead);

        // Webhook
        if (req.user && req.user.id) {
            triggerWebhook(req.user.id, 'lead.status_updated', updatedLead);
        }

        // Socket.io Real-time Update
        const io = req.app.get('io');
        if (io) {
            io.emit('lead_updated', updatedLead);
        }
    } catch (error) {
        console.error('Error updating lead:', error);
    }
};

const updateLead = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, company, source, status, value, notes } = req.body;
    try {
        const result = await pool.query(
            'UPDATE leads SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), company = COALESCE($4, company), source = COALESCE($5, source), status = COALESCE($6, status), value = COALESCE($7, value), notes = COALESCE($8, notes), updated_at = NOW() WHERE id = $9 RETURNING *',
            [name, email, phone, company, source, status, value, notes, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }
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
    updateLead,
    getChatMessages,
    getSocialPosts,
    getWorkflows,
    getWorkflowSteps,
    getTrainingModules,
    getTrainingProgress,
    getKPIs,
    getDeviceStats
};
