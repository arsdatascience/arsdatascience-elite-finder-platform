const { createWorker } = require('../queueClient');
const { Pool } = require('pg');
const pool = require('../database');
const aiController = require('../aiController');
const whatsappController = require('../whatsappController');

// ML Agent Services
const mlIntentDetector = require('./mlIntentDetector');
const mlAnalysisService = require('./mlAnalysisService');
const mlResponseFormatter = require('./mlResponseFormatter');

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
            case 'generate_batch_content':
                await handleBatchContentGeneration(payload);
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

// --- ML INTENT HANDLER ---
async function handleMLIntent(intent, message, clientId, sessionId, phone, io) {
    try {
        console.log(`🤖 [ML] Processing ${intent} for client ${clientId}`);

        // Extract parameters from message
        const params = mlIntentDetector.extractParameters(message, intent);

        // Get client name
        let clientName = 'Cliente';
        try {
            const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [clientId]);
            if (clientResult.rows[0]) {
                clientName = clientResult.rows[0].name;
            }
        } catch (e) {
            console.warn('Could not fetch client name:', e.message);
        }

        // Execute analysis based on intent
        let result;
        let formattedResponse;

        switch (intent) {
            case 'sales_forecast':
                result = await mlAnalysisService.salesForecast(clientId, params);
                formattedResponse = mlResponseFormatter.formatSalesForecast(result, clientName);
                break;

            case 'instagram_analysis':
                result = await mlAnalysisService.instagramAnalysis(clientId, params);
                formattedResponse = mlResponseFormatter.formatInstagramAnalysis(result, clientName);
                break;

            case 'tiktok_analysis':
                result = await mlAnalysisService.tiktokAnalysis(clientId, params);
                formattedResponse = mlResponseFormatter.formatTiktokAnalysis(result, clientName);
                break;

            case 'anomaly_detection':
                result = await mlAnalysisService.anomalyDetection(clientId, params);
                formattedResponse = mlResponseFormatter.formatAnomalyDetection(result, clientName);
                break;

            case 'dashboard_summary':
                result = await mlAnalysisService.dashboardSummary(clientId);
                formattedResponse = mlResponseFormatter.formatDashboardSummary(result, clientName);
                break;

            case 'marketing_roi':
                result = await mlAnalysisService.marketingROI(clientId, params);
                formattedResponse = mlResponseFormatter.formatMarketingROI(result, clientName);
                break;

            case 'customer_segmentation':
                result = await mlAnalysisService.customerSegmentation(clientId);
                formattedResponse = mlResponseFormatter.formatCustomerSegmentation(result, clientName);
                break;

            case 'churn_prediction':
                result = await mlAnalysisService.churnPrediction(clientId, params);
                formattedResponse = mlResponseFormatter.formatChurnPrediction(result, clientName);
                break;

            default:
                formattedResponse = mlResponseFormatter.formatUnsupportedIntent(intent);
                result = { success: false };
        }

        // Save response to chat_messages (Ops DB)
        try {
            await pool.opsQuery(`
                INSERT INTO chat_messages (session_id, role, sender_type, content, metadata, created_at)
                VALUES ($1, 'assistant', 'system', $2, $3, NOW())
            `, [
                sessionId,
                formattedResponse,
                JSON.stringify({
                    ml_intent: intent,
                    analysis_id: result.analysis_id || null,
                    confidence: result.confidence || null
                })
            ]);
        } catch (dbErr) {
            console.warn('Could not save ML response to chat_messages:', dbErr.message);
        }

        // Emit via Socket.io
        if (io) {
            io.to(sessionId).emit('ml-analysis-complete', {
                intent,
                intentDescription: mlIntentDetector.getIntentDescription(intent),
                response: formattedResponse,
                data: result,
                phone,
                sessionId
            });

            console.log(`✅ [ML] Analysis complete: ${intent} - emitted to session ${sessionId}`);
        }

    } catch (error) {
        console.error(`❌ [ML] Error in handleMLIntent:`, error);

        const errorMessage = mlResponseFormatter.formatError(error, intent);

        // Save error to chat
        try {
            await pool.opsQuery(`
                INSERT INTO chat_messages (session_id, role, sender_type, content, created_at)
                VALUES ($1, 'assistant', 'system', $2, NOW())
            `, [sessionId, errorMessage]);
        } catch (e) { }

        // Emit error via Socket.io
        if (io) {
            io.to(sessionId).emit('ml-analysis-error', {
                intent,
                error: errorMessage,
                phone,
                sessionId
            });
        }
    }
}

// --- WHATSAPP ASYNC PROCESSING ---
async function handleWhatsAppMessage(payload) {
    const { sessionId, phone, messageContent, tenantId, clientId } = payload;
    const io = global.io; // Access global socket instance

    console.log(`📨 [Job] Processing WhatsApp Message for ${phone} (Session: ${sessionId})`);

    try {
        // ========================================
        // ML INTENT DETECTION (Feature Flag)
        // ========================================
        if (process.env.ENABLE_ML_AGENT === 'true' && messageContent) {
            const intentResult = mlIntentDetector.detectIntent(messageContent);

            if (intentResult.matched) {
                console.log(`🤖 [ML] Intent detected: ${intentResult.intent} (confidence: ${intentResult.confidence})`);

                // Process ML intent and return (skip normal processing)
                await handleMLIntent(intentResult.intent, messageContent, clientId, sessionId, phone, io);
                return; // Exit early - ML handled this message
            }
        }

        // ========================================
        // NORMAL PROCESSING (existing logic)
        // ========================================

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


// --- BATCH CONTENT GENERATION ---
async function handleBatchContentGeneration(payload) {
    const { batchId, dayIndex, topic, platform, tone, targetAudience, provider, userId, tenantId } = payload;
    console.log(`🏭 [Job] Generating Batch Content for Day ${dayIndex}: ${topic}`);

    try {
        const apiKey = await aiController.getEffectiveApiKey(provider, userId);

        const prompt = `
          ATUE COMO: Copywriter Sênior Especialista em ${platform}.
          TAREFA: Criar um post de alta conversão para o Dia ${dayIndex} de uma sequência.
          
          TEMA DO DIA: "${topic}"
          PLATAFORMA: ${platform}
          TOM DE VOZ: ${tone}
          PÚBLICO ALVO: ${targetAudience.ageRange} anos, renda ${targetAudience.income}. Interesses: ${targetAudience.interests}.

          REQUISITOS:
          1. Headline Magnética (Gatilho de Curiosidade).
          2. Corpo do texto formatado para ${platform} (se Instagram = visual, se LinkedIn = profissional).
          3. Call to Action (CTA) claro.
          4. Hashtags estratégicas.
          5. Ideia visual para o designer.

          Retorne JSON estrito:
          {
            "headlines": ["Opção 1", "Opção 2"],
            "body": "Texto completo...",
            "cta": "...",
            "hashtags": ["#..."],
            "imageIdea": "..."
          }
        `;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "gpt-4-turbo-preview",
                messages: [{ role: "user", content: prompt + "\n\nRetorne APENAS JSON." }],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const contentStr = data.choices && data.choices[0] ? data.choices[0].message.content : "{}";
        const contentJson = JSON.parse(contentStr);

        // Save to Database
        // Use client_id=1 as default for now if context missing
        await pool.query(
            `INSERT INTO social_posts 
            (client_id, user_id, batch_id, platform, content, status, scheduled_at, media_url) 
            VALUES (1, $1, $2, $3, $4, 'draft', NOW() + interval '${dayIndex} days', $5)`,
            [userId, batchId, platform, contentJson.body, null]
        );

        console.log(`✅ [Job] Batch Day ${dayIndex} Created!`);

    } catch (error) {
        console.error(`❌ [Job] Batch Day ${dayIndex} Failed:`, error);
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

