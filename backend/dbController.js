const { Pool } = require('pg');
const { triggerWebhook } = require('./services/webhookService');
const { getTenantScope } = require('./utils/tenantSecurity');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5, // Limit pool size to prevent OOM on Railway
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
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
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { isSuperAdmin, tenantId } = getTenantScope(req);

    try {
        let query = `
            SELECT u.id, u.name, u.first_name, u.last_name, u.email, u.role, u.avatar_url, u.created_at, u.status,
                   t.name as tenant_name
            FROM users u
            LEFT JOIN tenants t ON u.tenant_id = t.id
        `;
        const params = [];

        // SAAS FIX: Filter users by tenant unless Super Admin
        // SAAS FIX: Filter users by tenant unless Super Admin
        // if (!isSuperAdmin) {
        //    query += ` WHERE u.tenant_id = $1`;
        //    params.push(tenantId);
        // }

        query += ` ORDER BY u.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// ============================================
// CLIENTS
// ============================================
const { encrypt, decrypt } = require('./utils/crypto');
const bcrypt = require('bcryptjs');

// ... (existing imports)

// ============================================
// CLIENTS
// ============================================
const getClients = async (req, res) => {
    if (!req.user) {
        console.error('❌ Critical: req.user is undefined in getClients. Auth middleware missing?');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { isSuperAdmin, tenantId } = getTenantScope(req);
    console.log(`🔍 getClients: User=${req.user.email}, Role=${req.user.role}, Tenant=${tenantId}, IsSuper=${isSuperAdmin}`);

    try {
        let query = 'SELECT * FROM clients';
        const params = [];

        // SAAS FIX: Filter clients by tenant unless Super Admin
        // SAAS FIX: Filter clients by tenant unless Super Admin
        // if (!isSuperAdmin) {
        //    query += ' WHERE tenant_id = $1';
        //    params.push(tenantId);
        // }

        query += ' ORDER BY name';

        const result = await pool.query(query, params);

        // DECRYPT SENSITIVE DATA FOR DISPLAY
        const clients = result.rows.map(client => ({
            ...client,
            document: decrypt(client.document),
            phone: decrypt(client.phone),
            whatsapp: decrypt(client.whatsapp),
            address_street: decrypt(client.address_street),
            address_number: decrypt(client.address_number),
            address_complement: decrypt(client.address_complement)
        }));

        res.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

const createClient = async (req, res) => {
    const { isSuperAdmin, tenantId } = getTenantScope(req);
    const {
        name, type, email, phone, whatsapp, document, foundationDate,
        cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_district,
        instagramUrl, facebookUrl, linkedinUrl, website,
        notes, company_size, industry,
        username, password,
        terms_accepted, privacy_accepted, data_consent, marketing_optin,
        rg, birth_date, gender, marital_status, nationality, mother_name,
        fantasy_name, state_registration, municipal_registration, cnae,
        legal_rep_name, legal_rep_cpf, legal_rep_role, legal_rep_email, legal_rep_phone,
        bank_name, bank_agency, bank_account, bank_account_type, pix_key,
        referral_source, client_references
    } = req.body;

    try {
        let password_hash = null;
        if (password) {
            password_hash = await bcrypt.hash(password, 10);
        }

        // ENCRYPT SENSITIVE DATA
        const encryptedPhone = encrypt(phone);
        const encryptedWhatsapp = whatsapp ? encrypt(whatsapp) : null;
        const encryptedDocument = document ? encrypt(document) : null;
        const encryptedStreet = address_street ? encrypt(address_street) : null;
        const encryptedNumber = address_number ? encrypt(address_number) : null;
        const encryptedComplement = address_complement ? encrypt(address_complement) : null;
        const encryptedRg = rg ? encrypt(rg) : null;
        const encryptedLegalRepCpf = legal_rep_cpf ? encrypt(legal_rep_cpf) : null;
        const encryptedBankAccount = bank_account ? encrypt(bank_account) : null;
        const encryptedPixKey = pix_key ? encrypt(pix_key) : null;

        // SAAS FIX: Insert with tenant_id
        const result = await pool.query(
            `INSERT INTO clients (
                tenant_id, name, type, email, phone, whatsapp, document, foundation_date,
                address_zip, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_district,
                instagram_url, facebook_url, linkedin_url, website,
                notes, company_size, industry,
                username, password_hash,
                terms_accepted, privacy_accepted, data_consent, marketing_optin,
                rg, birth_date, gender, marital_status, nationality, mother_name,
                fantasy_name, state_registration, municipal_registration, cnae,
                legal_rep_name, legal_rep_cpf, legal_rep_role, legal_rep_email, legal_rep_phone,
                bank_name, bank_agency, bank_account, bank_account_type, pix_key,
                referral_source, client_references
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50) RETURNING *`,
            [
                tenantId,
                name, type, email, encryptedPhone, encryptedWhatsapp, encryptedDocument, foundationDate || null,
                cep, encryptedStreet, encryptedNumber, encryptedComplement, address_neighborhood, address_city, address_state, address_district,
                instagramUrl, facebookUrl, linkedinUrl, website,
                notes, company_size, industry,
                username, password_hash,
                terms_accepted, privacy_accepted, data_consent, marketing_optin,
                encryptedRg, birth_date || null, gender, marital_status, nationality, mother_name,
                fantasy_name, state_registration, municipal_registration, cnae,
                legal_rep_name, encryptedLegalRepCpf, legal_rep_role, legal_rep_email, legal_rep_phone,
                bank_name, bank_agency, encryptedBankAccount, bank_account_type, encryptedPixKey,
                referral_source, client_references
            ]
        );

        // Return decrypted data to the creator
        const newClient = result.rows[0];
        // We can create a helper to decrypt everything, but for now specific overrides
        newClient.phone = phone;
        newClient.whatsapp = whatsapp;
        newClient.document = document;
        newClient.address_street = address_street;
        newClient.address_number = address_number;
        newClient.address_complement = address_complement;

        res.status(201).json(newClient);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
};

const updateClient = async (req, res) => {
    const { id } = req.params;
    const { isSuperAdmin, tenantId } = getTenantScope(req);
    const {
        name, type, email, phone, whatsapp, document, foundationDate,
        cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_district,
        instagramUrl, facebookUrl, linkedinUrl, website,
        notes, company_size, industry,
        username, password,
        terms_accepted, privacy_accepted, data_consent, marketing_optin,
        rg, birth_date, gender, marital_status, nationality, mother_name,
        fantasy_name, state_registration, municipal_registration, cnae,
        legal_rep_name, legal_rep_cpf, legal_rep_role, legal_rep_email, legal_rep_phone,
        bank_name, bank_agency, bank_account, bank_account_type, pix_key,
        referral_source, client_references
    } = req.body;

    try {
        const encryptedPhone = phone ? encrypt(phone) : null;
        const encryptedWhatsapp = whatsapp ? encrypt(whatsapp) : null;
        const encryptedDocument = document ? encrypt(document) : null;
        const encryptedStreet = address_street ? encrypt(address_street) : null;
        const encryptedNumber = address_number ? encrypt(address_number) : null;
        const encryptedComplement = address_complement ? encrypt(address_complement) : null;
        const encryptedRg = rg ? encrypt(rg) : null;
        const encryptedLegalRepCpf = legal_rep_cpf ? encrypt(legal_rep_cpf) : null;
        const encryptedBankAccount = bank_account ? encrypt(bank_account) : null;
        const encryptedPixKey = pix_key ? encrypt(pix_key) : null;

        let query = `
            UPDATE clients SET 
                name = COALESCE($1, name), type = COALESCE($2, type), email = COALESCE($3, email), 
                phone = COALESCE($4, phone), whatsapp = COALESCE($5, whatsapp), document = COALESCE($6, document), 
                foundation_date = COALESCE($7, foundation_date),
                address_zip = COALESCE($8, address_zip), address_street = COALESCE($9, address_street), 
                address_number = COALESCE($10, address_number), address_complement = COALESCE($11, address_complement), 
                address_neighborhood = COALESCE($12, address_neighborhood), address_city = COALESCE($13, address_city), 
                address_state = COALESCE($14, address_state), address_district = COALESCE($15, address_district),
                instagram_url = COALESCE($16, instagram_url), facebook_url = COALESCE($17, facebook_url), 
                linkedin_url = COALESCE($18, linkedin_url), website = COALESCE($19, website),
                notes = COALESCE($20, notes), company_size = COALESCE($21, company_size), industry = COALESCE($22, industry),
                username = COALESCE($23, username),
                terms_accepted = COALESCE($24, terms_accepted), privacy_accepted = COALESCE($25, privacy_accepted),
                data_consent = COALESCE($26, data_consent), marketing_optin = COALESCE($27, marketing_optin),
                rg = COALESCE($28, rg), birth_date = COALESCE($29, birth_date),
                gender = COALESCE($30, gender), marital_status = COALESCE($31, marital_status),
                nationality = COALESCE($32, nationality), mother_name = COALESCE($33, mother_name),
                fantasy_name = COALESCE($34, fantasy_name), state_registration = COALESCE($35, state_registration),
                municipal_registration = COALESCE($36, municipal_registration), cnae = COALESCE($37, cnae),
                legal_rep_name = COALESCE($38, legal_rep_name), legal_rep_cpf = COALESCE($39, legal_rep_cpf),
                legal_rep_role = COALESCE($40, legal_rep_role), legal_rep_email = COALESCE($41, legal_rep_email),
                legal_rep_phone = COALESCE($42, legal_rep_phone),
                bank_name = COALESCE($43, bank_name), bank_agency = COALESCE($44, bank_agency),
                bank_account = COALESCE($45, bank_account), bank_account_type = COALESCE($46, bank_account_type),
                pix_key = COALESCE($47, pix_key),
                referral_source = COALESCE($48, referral_source), client_references = COALESCE($49, client_references),
                updated_at = NOW()
        `;

        const params = [
            name, type, email, encryptedPhone, encryptedWhatsapp, encryptedDocument, foundationDate || null,
            cep, encryptedStreet, encryptedNumber, encryptedComplement, address_neighborhood, address_city, address_state, address_district,
            instagramUrl, facebookUrl, linkedinUrl, website,
            notes, company_size, industry,
            username,
            terms_accepted, privacy_accepted, data_consent, marketing_optin,
            encryptedRg, birth_date || null,
            gender, marital_status,
            nationality, mother_name,
            fantasy_name, state_registration,
            municipal_registration, cnae,
            legal_rep_name, encryptedLegalRepCpf,
            legal_rep_role, legal_rep_email,
            legal_rep_phone,
            bank_name, bank_agency,
            encryptedBankAccount, bank_account_type,
            encryptedPixKey,
            referral_source, client_references
        ];

        let paramIndex = 50;

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            query += `, password_hash = $${paramIndex}`;
            params.push(password_hash);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`;
        params.push(id, tenantId);

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found or access denied' });
        }

        // Decrypt for response
        const updatedClient = result.rows[0];
        updatedClient.phone = updatedClient.phone ? decrypt(updatedClient.phone) : null;
        updatedClient.whatsapp = updatedClient.whatsapp ? decrypt(updatedClient.whatsapp) : null;
        updatedClient.document = updatedClient.document ? decrypt(updatedClient.document) : null;
        updatedClient.address_street = updatedClient.address_street ? decrypt(updatedClient.address_street) : null;
        updatedClient.address_number = updatedClient.address_number ? decrypt(updatedClient.address_number) : null;
        updatedClient.address_complement = updatedClient.address_complement ? decrypt(updatedClient.address_complement) : null;

        res.json(updatedClient);
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
        const { isSuperAdmin, tenantId } = getTenantScope(req);

        let query = `
            SELECT cmp.* 
            FROM campaigns cmp
            JOIN clients c ON cmp.client_id = c.id
        `;
        let params = [];

        // if (!isSuperAdmin) {
        //    query += ` WHERE c.tenant_id = $1`;
        //    params.push(tenantId);
        // }

        if (client_id && client_id !== 'all') {
            const whereOrAnd = params.length > 0 ? 'AND' : 'WHERE';
            query += ` ${whereOrAnd} cmp.client_id = $${params.length + 1}`;
        }

        query += ` ORDER BY cmp.created_at DESC`;

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
        const { isSuperAdmin, tenantId } = getTenantScope(req);

        let query = `
            SELECT 
                l.id, l.name, l.email, l.phone, l.source, l.value::float, l.status, l.notes, l.tags,
                l.client_id as "clientId", 
                l.product_interest as "productInterest", 
                l.assigned_to as "assignedTo", 
                l.last_contact as "lastContact", 
                l.created_at as "createdAt"
            FROM leads l
            LEFT JOIN clients c ON l.client_id = c.id
        `;
        let params = [];

        // if (!isSuperAdmin) {
        //    query += ` WHERE c.tenant_id = $1`;
        //    params.push(tenantId);
        // }

        if (client_id && client_id !== 'all') {
            const whereOrAnd = params.length > 0 ? 'AND' : 'WHERE';
            query += ` ${whereOrAnd} l.client_id = $${params.length + 1}`;
            params.push(client_id);
        }

        if (status) {
            const whereOrAnd = params.length > 0 ? 'AND' : 'WHERE';
            query += ` ${whereOrAnd} l.status = $${params.length + 1}`;
            params.push(status);
        }

        query += ' ORDER BY l.created_at DESC';

        console.log('🔍 getLeads Params:', { client_id, status, isSuperAdmin, tenantId });
        console.log('🔍 getLeads Query:', query);
        console.log('🔍 getLeads DB Params:', params);

        const result = await pool.query(query, params);
        console.log(`✅ getLeads found ${result.rows.length} records.`);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
};

const createLead = async (req, res) => {
    const { client_id, name, email, phone, company, source, status, value, notes, tags } = req.body;
    const { isSuperAdmin, tenantId } = getTenantScope(req);

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
        // Map to camelCase
        const formattedLead = {
            ...newLead,
            clientId: newLead.client_id,
            productInterest: newLead.product_interest,
            assignedTo: newLead.assigned_to,
            lastContact: newLead.last_contact,
            createdAt: newLead.created_at,
            value: parseFloat(newLead.value)
        };
        res.status(201).json(formattedLead);

        // Webhook
        if (req.user && req.user.id) {
            triggerWebhook(req.user.id, 'lead.created', newLead);
        }

        // --- SISTÊMICO: LEAD SCORING & OMNICHANNEL ---
        try {
            const { calculateLeadScore } = require('./services/scoringService');
            // 1. Calcular Score Inicial
            await calculateLeadScore(newLead.id);

            const { jobsQueue } = require('./queueClient');

            // ... (imports)

            // ... (inside createLead function)
            // 2. Agendar Follow-up Omnichannel (24h)
            await jobsQueue.add('check_follow_up', {
                leadId: newLead.id,
                tenantId: tenantId // Passar contexto do tenant
            }, {
                delay: 24 * 60 * 60 * 1000, // 24 horas
                jobId: `followup_${newLead.id} ` // ID único
            });

            console.log(`🤖 Lead ${newLead.id}: Score calculado e Follow - up agendado via BullMQ.`);
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
    const { isSuperAdmin, tenantId } = getTenantScope(req);

    try {
        let query = `
            UPDATE leads l
            SET status = $1, updated_at = NOW() 
            FROM clients c
            WHERE l.client_id = c.id AND l.id = $2
        `;
        const params = [status, id];

        if (!isSuperAdmin) {
            query += ` AND c.tenant_id = $3`;
            params.push(tenantId);
        }

        query += ` RETURNING l.*`;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found or access denied' });
        }

        const updatedLead = result.rows[0];
        // Map to camelCase
        const formattedLead = {
            ...updatedLead,
            clientId: updatedLead.client_id,
            productInterest: updatedLead.product_interest,
            assignedTo: updatedLead.assigned_to,
            lastContact: updatedLead.last_contact,
            createdAt: updatedLead.created_at,
            value: parseFloat(updatedLead.value)
        };
        res.json(formattedLead);

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
    const { isSuperAdmin, tenantId } = getTenantScope(req);

    try {
        // SAAS FIX: Verify ownership
        const result = await pool.query(
            `UPDATE leads l
             SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), company = COALESCE($4, company), source = COALESCE($5, source), status = COALESCE($6, status), value = COALESCE($7, value), notes = COALESCE($8, notes), tags = COALESCE($9, tags), updated_at = NOW() 
             FROM clients c
             WHERE l.client_id = c.id AND l.id = $10 AND c.tenant_id = $11
             RETURNING l.* `,
            [name, email, phone, company, source, status, value, notes, tags, id, tenantId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found or access denied' });
        }
        const updatedLead = result.rows[0];
        // Map to camelCase
        const formattedLead = {
            ...updatedLead,
            clientId: updatedLead.client_id,
            productInterest: updatedLead.product_interest,
            assignedTo: updatedLead.assigned_to,
            lastContact: updatedLead.last_contact,
            createdAt: updatedLead.created_at,
            value: parseFloat(updatedLead.value)
        };
        res.json(formattedLead);
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
    const { isSuperAdmin, tenantId } = getTenantScope(req);
    try {

        let query = `
             SELECT cm.*
                FROM chat_messages cm
             JOIN leads l ON cm.lead_id = l.id
             JOIN clients c ON l.client_id = c.id
             WHERE cm.lead_id = $1
                `;
        let params = [lead_id];

        // if (!isSuperAdmin) {
        //    query += ` AND c.tenant_id = $2`;
        //    params.push(tenantId);
        // }

        query += ` ORDER BY cm.timestamp ASC`;

        const result = await pool.query(query, params);
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
        const { isSuperAdmin, tenantId } = getTenantScope(req);

        let query = `
            SELECT sp.*
                FROM social_posts sp
            JOIN clients c ON sp.client_id = c.id
                `;
        let params = [];

        // if (!isSuperAdmin) {
        //    query += ` WHERE c.tenant_id = $1`;
        //    params.push(tenantId);
        // }

        if (client_id && client_id !== 'all') {
            const whereOrAnd = params.length > 0 ? 'AND' : 'WHERE';
            query += ` ${whereOrAnd} sp.client_id = $${params.length + 1} `;
            params.push(client_id);
        }

        query += ` ORDER BY sp.created_at DESC`;

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
    const { isSuperAdmin, tenantId } = getTenantScope(req);
    try {
        let query = 'SELECT * FROM automation_workflows';
        let params = [];

        // if (!isSuperAdmin) {
        //    query += ' WHERE user_id IN (SELECT id FROM users WHERE tenant_id = $1)';
        //    params.push(tenantId);
        // }

        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ error: 'Failed to fetch workflows' });
    }
};

const getWorkflowSteps = async (req, res) => {
    const { workflow_id } = req.params;
    const { isSuperAdmin, tenantId } = getTenantScope(req);
    try {

        let query = `
            SELECT s.*
                FROM automation_workflow_steps s
            JOIN automation_workflows w ON s.workflow_id = w.id
            JOIN users u ON w.user_id = u.id
            WHERE s.workflow_id = $1
                `;
        let params = [workflow_id];

        // if (!isSuperAdmin) {
        //    query += ` AND u.tenant_id = $2`;
        //    params.push(tenantId);
        // }

        query += ` ORDER BY s.step_order`;

        const result = await pool.query(query, params);
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
    const { isSuperAdmin, tenantId } = getTenantScope(req);

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

        const isSuperAdmin = req.user.role === 'super_admin' || req.user.role === 'Super Admin' || req.user.role === 'super_user';

        let query = `
            SELECT k.*
                FROM kpis k
            JOIN clients c ON k.client_id = c.id
                `;
        let params = [];

        // if (!isSuperAdmin) {
        //    query += ` WHERE c.tenant_id = $1`;
        //    params.push(tenantId);
        // }

        if (client_id && client_id !== 'all') {
            const whereOrAnd = params.length > 0 ? 'AND' : 'WHERE';
            query += ` ${whereOrAnd} k.client_id = $${params.length + 1} `;
            params.push(client_id);
        }

        query += ` ORDER BY k.created_at DESC LIMIT 10`;

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
        const { isSuperAdmin, tenantId } = getTenantScope(req);

        let query = `
            SELECT ds.device_type, SUM(ds.percentage) as percentage, SUM(ds.conversions) as conversions 
            FROM device_stats ds
            JOIN clients c ON ds.client_id = c.id
                `;
        let params = [];

        // if (!isSuperAdmin) {
        //    query += ` WHERE c.tenant_id = $1`;
        //    params.push(tenantId);
        // }

        if (client_id && client_id !== 'all') {
            const whereOrAnd = params.length > 0 ? 'AND' : 'WHERE';
            query += ` ${whereOrAnd} ds.client_id = $${params.length + 1} `;
            params.push(client_id);
        }

        if (campaign_id) {
            const whereOrAnd = params.length > 0 ? 'AND' : 'WHERE';
            query += ` ${whereOrAnd} ds.campaign_id = $${params.length + 1} `;
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
