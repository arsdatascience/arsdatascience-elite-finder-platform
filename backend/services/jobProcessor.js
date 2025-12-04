const { createWorker } = require('../queueClient');
const { Pool } = require('pg');
const pool = require('../database');
const aiController = require('../aiController');
const whatsappController = require('../whatsappController');

// Função principal de processamento de jobs
const processJob = async (job) => {
    const { type, payload } = job.data;
    console.log(`⚙️ Processando job ${job.id} do tipo: ${type}`);

    try {
        switch (type) {
            case 'publish_social_post':
                await handleSocialPost(payload);
                break;
            case 'check_follow_up':
                await handleFollowUpCheck(payload);
                break;
            case 'roi_analysis':
                await handleRoiAnalysis(payload);
                break;
            default:
                console.warn(`⚠️ Tipo de job desconhecido: ${type}`);
        }
    } catch (error) {
        console.error(`❌ Erro no processamento do job ${job.id}:`, error);
        throw error; // Lança erro para o BullMQ tentar novamente (retry)
    }
};

// Handlers Específicos (Lógica de Negócio Mantida)

async function handleSocialPost(payload) {
    const { client_id, content, media_url, platform } = payload;
    console.log(`📱 Simulando post para cliente ${client_id} no ${platform}`);

    // Simulação de delay de API externa
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Atualizar status no banco (opcional, apenas para registro histórico se necessário)
    await pool.query(
        `UPDATE social_posts SET status = 'published' WHERE client_id = $1 AND content = $2`,
        [client_id, content]
    );
}

async function handleFollowUpCheck(payload) {
    const { lead_id, tenant_id } = payload;

    // Buscar dados do lead
    const leadRes = await pool.query('SELECT * FROM leads WHERE id = $1 AND tenant_id = $2', [lead_id, tenant_id]);
    const lead = leadRes.rows[0];

    if (!lead) return;

    // Lógica de Follow-up (simplificada)
    if (lead.status === 'new' && !lead.last_contact) {
        console.log(`🔔 Enviando follow-up para lead ${lead.name}`);

        // Enviar mensagem via WhatsApp (usando a instância correta do tenant)
        // TODO: Obter instanceName dinamicamente baseado no tenant_id
        // await whatsappController.sendMessage(instanceName, lead.phone, "Olá! Ainda tem interesse?");

        await pool.query('UPDATE leads SET last_contact = NOW() WHERE id = $1', [lead_id]);
    }
}

async function handleRoiAnalysis(payload) {
    const { tenant_id } = payload;
    console.log(`💰 Calculando ROI para tenant ${tenant_id}`);

    // Apenas chama a função de IA existente
    // await aiController.generateDashboardInsights(tenant_id);
}

// Inicialização do Worker
const start = () => {
    console.log('🚀 Iniciando Worker de Jobs (BullMQ)...');
    const worker = createWorker(processJob);

    // Graceful Shutdown
    process.on('SIGTERM', async () => {
        console.log('🛑 Fechando worker...');
        await worker.close();
    });
};

module.exports = { start };

