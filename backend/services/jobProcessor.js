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
            case 'process_whatsapp_message':
                await handleWhatsAppMessage(payload);
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

// --- WHATSAPP ASYNC PROCESSING ---
async function handleWhatsAppMessage(payload) {
    const { sessionId, phone, messageContent, tenantId } = payload;
    const io = global.io; // Access global socket instance

    console.log(`📨 [Job] Processing WhatsApp Message for ${phone} (Session: ${sessionId})`);

    try {
        // 1. Update Lead Score
        try {
            const leadRes = await pool.query("SELECT id FROM leads WHERE phone LIKE $1 OR phone LIKE $2 LIMIT 1", [`%${phone}%`, phone]);
            if (leadRes.rows.length > 0) {
                const { calculateLeadScore } = require('./scoringService');
                await calculateLeadScore(leadRes.rows[0].id);
            }
        } catch (scoreErr) {
            console.error('⚠️ [Job] Error updating score:', scoreErr.message);
        }

        // 2. AI Coaching & Analysis
        // Fetch recent history
        const historyResult = await pool.query(
            `SELECT sender_type as role, content FROM chat_messages 
             WHERE session_id = $1 
             ORDER BY created_at ASC LIMIT 10`,
            [sessionId]
        );

        const messages = historyResult.rows.map(row => ({
            role: row.role === 'client' ? 'user' : 'agent',
            content: row.content
        }));

        // Get API Key
        const apiKey = await aiController.getEffectiveApiKey('openai', null);

        if (apiKey) {
            const analysis = await aiController.analyzeStrategyInternal(
                messages,
                { product: "Elite Finder Services", goal: "Qualification & Sales" },
                apiKey
            );

            // Save Analysis
            await pool.query(
                `INSERT INTO chat_analyses (session_id, analysis_type, full_report, sentiment_label, buying_stage) 
                 VALUES ($1, 'sales_coaching', $2, $3, $4)`,
                [sessionId, JSON.stringify(analysis), analysis.sentiment, analysis.buying_stage]
            );

            // Emit Socket Event
            if (io) {
                console.log(`🧠 [Job] Coaching Insight Generated for ${phone}`);
                io.emit('sales_coaching_update', {
                    sessionId,
                    phone,
                    analysis
                });
            }

            // 3. Smart Lead Mover
            if (analysis.buying_stage) {
                const stageMap = {
                    'Curiosidade': 'contacted',
                    'Consideração': 'qualified',
                    'Decisão': 'negotiation',
                    'Compra': 'closed'
                };
                const newStatus = stageMap[analysis.buying_stage];

                if (newStatus) {
                    const leadRes = await pool.query(
                        "SELECT id, status FROM leads WHERE phone LIKE $1 OR phone LIKE $2 LIMIT 1",
                        [`%${phone}%`, phone]
                    );

                    if (leadRes.rows.length > 0) {
                        const lead = leadRes.rows[0];
                        if (lead.status !== newStatus && lead.status !== 'closed' && lead.status !== 'won') {
                            await pool.query(
                                "UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2",
                                [newStatus, lead.id]
                            );
                            console.log(`🔄 [Job] Lead ${lead.id} moved to ${newStatus}`);
                            if (io) io.emit('lead_updated', { id: lead.id, status: newStatus });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ [Job] Error in WhatsApp processing:', error);
        throw error;
    }
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

