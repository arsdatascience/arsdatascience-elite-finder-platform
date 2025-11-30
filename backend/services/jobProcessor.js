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

module.exports = { start: () => setInterval(processJobs, 30000) }; // Rodar a cada 30s
