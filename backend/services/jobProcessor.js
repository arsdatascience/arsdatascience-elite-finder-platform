const db = require('../database');
const socialService = require('./socialService');
const { decrypt } = require('../utils/crypto');

const processJobs = async () => {
    try {
        // Buscar jobs pendentes agendados para agora ou antes
        const result = await db.query(`
            SELECT * FROM jobs 
            WHERE status = 'pending' 
            AND scheduled_for <= NOW() 
            ORDER BY scheduled_for ASC 
            LIMIT 5
            FOR UPDATE SKIP LOCKED
        `);

        if (result.rows.length === 0) return;

        console.log(`⚙️ Processando ${result.rows.length} jobs...`);

        for (const job of result.rows) {
            await executeJob(job);
        }
    } catch (error) {
        console.error('Erro no processador de jobs:', error);
    }
};

const executeJob = async (job) => {
    try {
        // Marcar como processando
        await db.query("UPDATE jobs SET status = 'processing', updated_at = NOW() WHERE id = $1", [job.id]);

        let resultData = null;

        if (job.type === 'publish_social_post') {
            resultData = await handlePublishSocialPost(job.payload);
        } else if (job.type === 'check_follow_up') {
            resultData = await handleFollowUpCheck(job.payload);
        } else if (job.type === 'roi_analysis') {
            resultData = await handleRoiAnalysis(job.payload);
        }

        // Marcar como concluído
        await db.query("UPDATE jobs SET status = 'completed', result = $1, updated_at = NOW() WHERE id = $2", [JSON.stringify(resultData), job.id]);
        console.log(`✅ Job ${job.id} (${job.type}) concluído.`);

    } catch (error) {
        console.error(`❌ Job ${job.id} falhou:`, error.message);
        await db.query("UPDATE jobs SET status = 'failed', error = $1, updated_at = NOW() WHERE id = $2", [error.message, job.id]);
    }
};

const handlePublishSocialPost = async (payload) => {
    const { platform, integrationId, content, mediaUrl } = payload;

    // Buscar integração e token
    const intResult = await db.query('SELECT * FROM integrations WHERE id = $1', [integrationId]);
    if (intResult.rows.length === 0) throw new Error('Integração não encontrada');

    const integration = intResult.rows[0];
    const accessToken = decrypt(integration.access_token);
    const config = integration.config || {};

    if (!accessToken) throw new Error('Token inválido ou não configurado');

    if (platform === 'instagram') {
        const instagramAccountId = config.instagramAccountId || integration.provider_account_id;
        if (!instagramAccountId) throw new Error('ID da conta Instagram não encontrado');

        return await socialService.publishToInstagram(instagramAccountId, accessToken, content, mediaUrl);
    } else if (platform === 'linkedin') {
        const authorId = config.authorId || integration.provider_account_id;
        return await socialService.publishToLinkedIn(authorId, accessToken, content);
    } else if (platform === 'twitter') {
        return await socialService.publishToTwitter(accessToken, content);
    }

    throw new Error(`Plataforma ${platform} não suportada`);
};

// --- NOVOS HANDLERS SISTÊMICOS ---

const handleFollowUpCheck = async (payload) => {
    const { leadId } = payload;
    console.log(`🕵️ Verificando Follow-up para Lead ${leadId}...`);

    // 1. Verificar status atual e obter tenant_id
    const leadRes = await db.query(`
        SELECT l.*, c.tenant_id 
        FROM leads l
        JOIN clients c ON l.client_id = c.id
        WHERE l.id = $1
    `, [leadId]);

    if (leadRes.rows.length === 0) return { action: 'skipped', reason: 'Lead not found' };

    const lead = leadRes.rows[0];

    // Regra: Se ainda estiver em 'new' e sem interação há 24h
    if (lead.status === 'new') {
        // Verificar se houve troca de mensagens
        // (Simplificação: se status é new, assumimos que não houve qualificação)

        // Enviar WhatsApp de Follow-up
        if (lead.phone) {
            const whatsappService = require('./whatsappService'); // Lazy load
            const message = `Olá ${lead.name.split(' ')[0]}, tudo bem? Vi que você se cadastrou na Elite Finder. Ficou com alguma dúvida sobre nossos planos?`;

            // SAAS FIX: Find a user from this tenant to send the message (context for integration lookup)
            // We need the ID of a user who has the WhatsApp integration configured for this tenant.
            // Usually, integrations are linked to the tenant owner or admin.
            const userRes = await db.query(`
                SELECT id FROM users 
                WHERE tenant_id = $1 AND role IN ('admin', 'super_admin') 
                ORDER BY id ASC LIMIT 1
            `, [lead.tenant_id]);

            if (userRes.rows.length === 0) {
                console.error(`❌ No admin user found for tenant ${lead.tenant_id} to send follow-up.`);
                return { action: 'failed', reason: 'No tenant admin found' };
            }

            const senderId = userRes.rows[0].id;

            // Enviar usando o ID do usuário do tenant correto
            await whatsappService.sendMessage(senderId, lead.phone.replace(/\D/g, ''), message);

            // Atualizar status para 'contacted'
            await db.query("UPDATE leads SET status = 'contacted', updated_at = NOW() WHERE id = $1", [leadId]);

            return { action: 'sent_message', message, senderId };
        }
    }

    return { action: 'skipped', reason: 'Lead already contacted or invalid phone' };
};

const handleRoiAnalysis = async (payload) => {
    console.log('💰 Executando Análise de ROI Autônoma...');
    const aiController = require('../aiController'); // Lazy load

    // SAAS FIX: Ensure we only analyze data for the specific tenant
    // Payload MUST contain userId or tenantId
    const { userId, tenantId } = payload;

    let targetTenantId = tenantId;

    // If only userId is provided, resolve tenantId
    if (!targetTenantId && userId) {
        const userRes = await db.query('SELECT tenant_id FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length > 0) {
            targetTenantId = userRes.rows[0].tenant_id;
        }
    }

    if (!targetTenantId) {
        console.error('❌ Job ROI Analysis failed: Missing tenant_id or userId in payload');
        return { error: 'Missing tenant context' };
    }

    // 1. Buscar dados financeiros da semana APENAS DO TENANT
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const finRes = await db.query(`
        SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM financial_transactions
        WHERE date >= $1 AND tenant_id = $2
    `, [startOfWeek, targetTenantId]);

    const { income, expense } = finRes.rows[0];
    const roi = expense > 0 ? ((income - expense) / expense) * 100 : 0;

    // 2. Gerar Insight com IA
    const prompt = `
        Analise o ROI semanal da agência:
        - Receita: R$ ${income || 0}
        - Despesa: R$ ${expense || 0}
        - ROI: ${roi.toFixed(2)}%
        
        Gere um parágrafo curto e motivacional ou de alerta para o CEO.
    `;

    // Usar chave do sistema (admin 1) ou do usuário se disponível
    // Idealmente, usar a chave do próprio tenant/user
    const apiKey = await aiController.getEffectiveApiKey('openai', userId || 1);

    let insight = "Análise realizada com sucesso.";
    try {
        // Simple call to generate insight if key exists
        if (apiKey) {
            // Reusing a simple completion call or mock
            // In real scenario: insight = await aiController.callOpenAI(prompt, apiKey, ...);
        }
    } catch (e) {
        console.warn("AI Insight failed for ROI job:", e.message);
    }

    return { income, expense, roi, insight };
};

module.exports = { start: () => setInterval(processJobs, 30000) }; // Rodar a cada 30s
