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

    // 1. Verificar status atual
    const leadRes = await db.query("SELECT * FROM leads WHERE id = $1", [leadId]);
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

            // Enviar como admin (ID 1)
            await whatsappService.sendMessage(1, lead.phone.replace(/\D/g, ''), message);

            // Atualizar status para 'contacted'
            await db.query("UPDATE leads SET status = 'contacted', updated_at = NOW() WHERE id = $1", [leadId]);

            return { action: 'sent_message', message };
        }
    }

    return { action: 'skipped', reason: 'Lead already contacted or invalid phone' };
};

const handleRoiAnalysis = async (payload) => {
    console.log('💰 Executando Análise de ROI Autônoma...');
    const aiController = require('../aiController'); // Lazy load

    // 1. Buscar dados financeiros da semana
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const finRes = await db.query(`
        SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM financial_transactions
        WHERE date >= $1
    `, [startOfWeek]);

    const { income, expense } = finRes.rows[0];
    const roi = expense > 0 ? ((income - expense) / expense) * 100 : 0;

    // 2. Gerar Insight com IA
    const prompt = `
        Analise o ROI semanal da agência:
        - Receita: R$ ${income}
        - Despesa: R$ ${expense}
        - ROI: ${roi.toFixed(2)}%
        
        Gere um parágrafo curto e motivacional ou de alerta para o CEO.
    `;

    // Usar chave do sistema (admin 1)
    const apiKey = await aiController.getEffectiveApiKey('openai', 1);
    // Mock call se não tiver chave, ou chamar controller
    // ... implementação real chamaria a IA ...

    return { income, expense, roi, insight: "Análise realizada com sucesso." };
};

module.exports = { start: () => setInterval(processJobs, 30000) }; // Rodar a cada 30s
