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
// ============================================
// USERS
// ============================================
const getUsers = async (req, res) => {
    const tenantId = req.user.tenant_id;
    try {
        // SAAS FIX: Filter users by tenant
        const result = await pool.query(`
            SELECT u.id, u.name, u.first_name, u.last_name, u.email, u.role, u.avatar_url, u.created_at, u.status,
                   t.name as tenant_name
            FROM users u
            LEFT JOIN tenants t ON u.tenant_id = t.id
            WHERE u.tenant_id = $1
            ORDER BY u.created_at DESC
        `, [tenantId]);
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
    const tenantId = req.user.tenant_id;
    try {
        // SAAS FIX: Filter clients by tenant
        const result = await pool.query('SELECT * FROM clients WHERE tenant_id = $1 ORDER BY name', [tenantId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

const createClient = async (req, res) => {
    const tenantId = req.user.tenant_id;
    const {
        name, type, email, phone, whatsapp, document, foundationDate,
        cep, street, number, complement, neighborhood, city, state,
        instagramUrl, facebookUrl, linkedinUrl, website,
        notes, company_size, industry
    } = req.body;

    try {
        // SAAS FIX: Insert with tenant_id
        const result = await pool.query(
            `INSERT INTO clients (
                tenant_id, name, type, email, phone, whatsapp, document, foundation_date,
                address_zip, address_street, address_number, address_complement, address_neighborhood, address_city, address_state,
                instagram_url, facebook_url, linkedin_url, website,
                notes, company_size, industry
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING *`,
            [
                tenantId,
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
    const tenantId = req.user.tenant_id;
    const {
        name, type, email, phone, whatsapp, document, foundationDate,
        cep, street, number, complement, neighborhood, city, state,
        instagramUrl, facebookUrl, linkedinUrl, website,
        notes, company_size, industry
    } = req.body;

    try {
        // SAAS FIX: Ensure tenant_id matches
        const result = await pool.query(
            `UPDATE clients SET 
                name = $1, type = $2, email = $3, phone = $4, whatsapp = $5, document = $6, foundation_date = $7,
                address_zip = $8, address_street = $9, address_number = $10, address_complement = $11, address_neighborhood = $12, address_city = $13, address_state = $14,
                instagram_url = $15, facebook_url = $16, linkedin_url = $17, website = $18,
                notes = $19, company_size = $20, industry = $21, 
                updated_at = NOW() 
            WHERE id = $22 AND tenant_id = $23 RETURNING *`,
            [
                name, type, email, phone, whatsapp, document, foundationDate || null,
                cep, street, number, complement, neighborhood, city, state,
                instagramUrl, facebookUrl, linkedinUrl, website,
                notes, company_size, industry,
                id,
                tenantId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found or access denied' });
        }

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
        const tenantId = req.user.tenant_id;

        // SAAS FIX: Filter by tenant via JOIN
        let query = `
            SELECT cmp.* 
            FROM campaigns cmp
            JOIN clients c ON cmp.client_id = c.id
            WHERE c.tenant_id = $1
            ORDER BY cmp.created_at DESC
        `;
        let params = [tenantId];

        if (client_id && client_id !== 'all') {
            query = `
                SELECT cmp.* 
                FROM campaigns cmp
                JOIN clients c ON cmp.client_id = c.id
                WHERE c.tenant_id = $1 AND cmp.client_id = $2
                ORDER BY cmp.created_at DESC
            `;
            params = [tenantId, client_id];
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
// ============================================
// LEADS
// ============================================
const getLeads = async (req, res) => {
    try {
        const { client_id, status } = req.query;
        const tenantId = req.user.tenant_id;

        // SAAS FIX: Filter leads by tenant via JOIN
        let query = `
            SELECT l.* 
            FROM leads l
            JOIN clients c ON l.client_id = c.id
            WHERE c.tenant_id = $1
        `;
        let params = [tenantId];

        if (client_id && client_id !== 'all') {
            query += ` AND l.client_id = $${params.length + 1}`;
            params.push(client_id);
        }

        if (status) {
            query += ` AND l.status = $${params.length + 1}`;
            params.push(status);
        }

        query += ' ORDER BY l.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
};

const createLead = async (req, res) => {
    const { client_id, name, email, phone, company, source, status, value, notes, tags } = req.body;
    const tenantId = req.user.tenant_id;

    try {
        // SAAS FIX: Verify if client belongs to tenant
        const clientCheck = await pool.query('SELECT id FROM clients WHERE id = $1 AND tenant_id = $2', [client_id, tenantId]);
        if (clientCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied: Client does not belong to your tenant' });
        }

        const result = await pool.query(
            'INSERT INTO leads (client_id, name, email, phone, company, source, status, value, notes, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [client_id, name, email, phone, company, source, status || 'new', value || 0, notes, tags || []]
        );
        const newLead = result.rows[0];
        res.status(201).json(newLead);

        // Webhook
        if (req.user && req.user.id) {
            triggerWebhook(req.user.id, 'lead.created', newLead);
        }

        // --- SISTÊMICO: LEAD SCORING & OMNICHANNEL ---
        try {
            const { calculateLeadScore } = require('./services/scoringService');
            // 1. Calcular Score Inicial
            await calculateLeadScore(newLead.id);

            // 2. Agendar Follow-up Omnichannel (24h)
            await pool.query(`
                INSERT INTO jobs (type, payload, scheduled_for, status)
                VALUES ($1, $2, NOW() + INTERVAL '24 hours', 'pending')
            `, ['check_follow_up', { leadId: newLead.id }]);

            console.log(`🤖 Lead ${newLead.id}: Score calculado e Follow-up agendado.`);
        } catch (sysErr) {
            console.error('Erro nos processos sistêmicos de Lead:', sysErr);
        }
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
};

const updateLeadStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.user.tenant_id;

    try {
        // SAAS FIX: Verify ownership
        const result = await pool.query(
            `UPDATE leads l
             SET status = $1, updated_at = NOW() 
             FROM clients c
             WHERE l.client_id = c.id AND l.id = $2 AND c.tenant_id = $3
             RETURNING l.*`,
            [status, id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found or access denied' });
        }

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
        res.status(500).json({ error: 'Failed to update lead status' });
    }
};

const updateLead = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, company, source, status, value, notes, tags } = req.body;
    const tenantId = req.user.tenant_id;

    try {
        // SAAS FIX: Verify ownership
        const result = await pool.query(
            `UPDATE leads l
             SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), company = COALESCE($4, company), source = COALESCE($5, source), status = COALESCE($6, status), value = COALESCE($7, value), notes = COALESCE($8, notes), tags = COALESCE($9, tags), updated_at = NOW() 
             FROM clients c
             WHERE l.client_id = c.id AND l.id = $10 AND c.tenant_id = $11
             RETURNING l.*`,
            [name, email, phone, company, source, status, value, notes, tags, id, tenantId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found or access denied' });
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
    const tenantId = req.user.tenant_id;
    try {
        // SAAS FIX: Filter by tenant
        const result = await pool.query(
            `SELECT cm.* 
             FROM chat_messages cm
             JOIN leads l ON cm.lead_id = l.id
             JOIN clients c ON l.client_id = c.id
             WHERE cm.lead_id = $1 AND c.tenant_id = $2
             ORDER BY cm.timestamp ASC`,
            [lead_id, tenantId]
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
        const tenantId = req.user.tenant_id;

        // SAAS FIX: Filter by tenant
        let query = `
            SELECT sp.* 
            FROM social_posts sp
            JOIN clients c ON sp.client_id = c.id
            WHERE c.tenant_id = $1
            ORDER BY sp.created_at DESC
        `;
        let params = [tenantId];

        if (client_id && client_id !== 'all') {
            query = `
                SELECT sp.* 
                FROM social_posts sp
                JOIN clients c ON sp.client_id = c.id
                WHERE c.tenant_id = $1 AND sp.client_id = $2
                ORDER BY sp.created_at DESC
            `;
            params = [tenantId, client_id];
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
    const tenantId = req.user.tenant_id;
    try {
        // SAAS FIX: Filter by tenant (assuming workflows have tenant_id or user_id)
        // If workflows are global templates, this might need adjustment. Assuming user-specific for now.
        // If workflows table doesn't have tenant_id, we might need to add it.
        // For now, assuming they are linked to user_id which links to tenant.
        const result = await pool.query('SELECT * FROM automation_workflows WHERE user_id IN (SELECT id FROM users WHERE tenant_id = $1) ORDER BY created_at DESC', [tenantId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ error: 'Failed to fetch workflows' });
    }
};

const getWorkflowSteps = async (req, res) => {
    const { workflow_id } = req.params;
    const tenantId = req.user.tenant_id;
    try {
        // SAAS FIX: Verify ownership via workflow
        const result = await pool.query(
            `SELECT s.* 
             FROM automation_workflow_steps s
             JOIN automation_workflows w ON s.workflow_id = w.id
             JOIN users u ON w.user_id = u.id
             WHERE s.workflow_id = $1 AND u.tenant_id = $2
             ORDER BY s.step_order`,
            [workflow_id, tenantId]
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
        // Public/Global modules are fine, but if tenant-specific, filter here.
        // Assuming global for now.
        const result = await pool.query('SELECT * FROM training_modules ORDER BY order_index');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching training modules:', error);
        res.status(500).json({ error: 'Failed to fetch training modules' });
    }
};

const getTrainingProgress = async (req, res) => {
    const { user_id } = req.query;
    const tenantId = req.user.tenant_id;

    // Only allow viewing own progress or if admin of same tenant
    // Simplified: Allow if user belongs to same tenant
    try {
        const result = await pool.query(
            `SELECT tp.* 
             FROM training_progress tp
             JOIN users u ON tp.user_id = u.id
             WHERE tp.user_id = $1 AND u.tenant_id = $2`,
            [user_id, tenantId]
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
        const tenantId = req.user.tenant_id;

        // SAAS FIX: Filter by tenant
        let query = `
            SELECT k.* 
            FROM kpis k
            JOIN clients c ON k.client_id = c.id
            WHERE c.tenant_id = $1
            ORDER BY k.created_at DESC LIMIT 10
        `;
        let params = [tenantId];

        if (client_id && client_id !== 'all') {
            query = `
                SELECT k.* 
                FROM kpis k
                JOIN clients c ON k.client_id = c.id
                WHERE c.tenant_id = $1 AND k.client_id = $2
                ORDER BY k.created_at DESC LIMIT 10
            `;
            params = [tenantId, client_id];
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
        const tenantId = req.user.tenant_id;

        // SAAS FIX: Filter by tenant
        let query = `
            SELECT ds.device_type, SUM(ds.percentage) as percentage, SUM(ds.conversions) as conversions 
            FROM device_stats ds
            JOIN clients c ON ds.client_id = c.id
            WHERE c.tenant_id = $1
        `;
        let params = [tenantId];

        if (client_id && client_id !== 'all') {
            query += ` AND ds.client_id = $${params.length + 1}`;
            params.push(client_id);
        }

        if (campaign_id) {
            query += ` AND ds.campaign_id = $${params.length + 1}`;
            params.push(campaign_id);
        }

        query += ' GROUP BY ds.device_type';

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
