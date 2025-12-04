const db = require('./database');
// Lazy load aiController to avoid potential circular dependency issues if any arise later, though currently none visible.
// const aiController = require('./aiController'); 
let aiController;
try { aiController = require('./aiController'); } catch (e) { console.error('Failed to load aiController', e); }
const whatsappService = require('./services/whatsappService');

// Helper para normalizar telefone (remove +55, espaços, traços)
const normalizePhone = (phone) => {
    return phone.replace(/\D/g, '');
};

const sendOutboundMessage = async (req, res) => {
    const { to, content, sessionId } = req.body;
    const userId = req.user ? req.user.id : 1; // Default to admin if not auth (should be auth)

    if (!to || !content) {
        return res.status(400).json({ error: 'Missing "to" or "content"' });
    }

    try {
        // 1. Send via WhatsApp Service
        // Note: 'to' should be the clean phone number
        const cleanTo = normalizePhone(to);
        const result = await whatsappService.sendMessage(userId, cleanTo, content);

        // 2. Store in Database
        if (sessionId) {
            await db.query(
                `INSERT INTO chat_messages (session_id, role, sender_type, sender_id, content) 
                 VALUES ($1, 'assistant', 'agent', $2, $3)`,
                [sessionId, userId, content]
            );
        }

        res.json({ success: true, result });

    } catch (error) {
        console.error('Error sending outbound message:', error);
        res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
};

const handleWebhook = async (req, res) => {
    try {
        const io = req.app.get('io');
        const { instance, data, sender } = req.body; // Formato genérico EvolutionAPI v2

        // Adaptação para diferentes formatos de payload
        let phone = '';
        let messageContent = '';
        let pushName = '';
        let messageType = 'text';

        // EvolutionAPI v2 structure check
        if (data && data.key && data.key.remoteJid) {
            phone = normalizePhone(data.key.remoteJid.split('@')[0]);
            pushName = data.pushName || 'Desconhecido';

            if (data.message) {
                if (data.message.conversation) {
                    messageContent = data.message.conversation;
                } else if (data.message.extendedTextMessage) {
                    messageContent = data.message.extendedTextMessage.text;
                } else {
                    messageType = 'media'; // Imagem, áudio, etc.
                    messageContent = '[Mídia Recebida]';
                }
            }
        }
        // Fallback para formato simples (teste ou outra API)
        else if (req.body.from && req.body.message) {
            phone = normalizePhone(req.body.from);
            messageContent = req.body.message;
            pushName = req.body.name || 'Cliente';
        }

        if (!phone || !messageContent) {
            return res.status(400).send('Invalid payload');
        }

        // Ignorar mensagens enviadas pelo próprio bot (fromMe)
        if (data && data.key && data.key.fromMe) {
            return res.status(200).send('Ignored fromMe');
        }

        console.log(`📩 WhatsApp Message from ${pushName} (${phone}): ${messageContent}`);

        // 1. Identificar Tenant pela Instância (SEGURANÇA CRÍTICA)
        let tenantId = null;

        // Tentar resolver tenant_id pelo nome da instância
        if (instance) {
            const instanceRes = await db.query('SELECT tenant_id FROM whatsapp_instances WHERE instance_name = $1', [instance]);
            if (instanceRes.rows.length > 0) {
                tenantId = instanceRes.rows[0].tenant_id;
            }
        }

        // Se não achou tenant pela instância, tenta fallback perigoso (mas loga aviso)
        if (!tenantId) {
            console.warn(`⚠️ [SECURITY WARNING] Webhook received for unknown instance: ${instance}. Trying to match client globally (RISKY).`);
        }

        // 2. Identificar ou Criar Cliente/Lead
        let query = 'SELECT id, name, tenant_id FROM clients WHERE (whatsapp LIKE $1 OR phone LIKE $1)';
        let params = [`%${phone}%`];

        if (tenantId) {
            query += ' AND tenant_id = $2';
            params.push(tenantId);
        }

        // Order by created_at to get the most recent match if duplicates exist (temporary mitigation)
        query += ' ORDER BY created_at DESC LIMIT 1';

        let clientResult = await db.query(query, params);
        let clientId = null;
        let clientName = pushName;

        if (clientResult.rows.length > 0) {
            clientId = clientResult.rows[0].id;
            clientName = clientResult.rows[0].name;
            // Se achamos o cliente e não tínhamos tenantId (fallback), assumimos o do cliente
            if (!tenantId) tenantId = clientResult.rows[0].tenant_id;
        } else {
            // Opcional: Criar Lead automaticamente
            // await db.query('INSERT INTO leads ...');
        }

        // 2. Gerenciar Sessão de Chat
        let sessionResult = await db.query(
            `SELECT id FROM chat_sessions 
             WHERE (client_id = $1 OR metadata->>'phone' = $2) 
             AND status = 'active' 
             ORDER BY created_at DESC LIMIT 1`,
            [clientId, phone]
        );

        let sessionId;
        if (sessionResult.rows.length > 0) {
            sessionId = sessionResult.rows[0].id;
        } else {
            // Criar nova sessão
            const newSession = await db.query(
                `INSERT INTO chat_sessions (client_id, channel, status, metadata) 
                 VALUES ($1, 'whatsapp', 'active', $2) RETURNING id`,
                [clientId, JSON.stringify({ phone, pushName })]
            );
            sessionId = newSession.rows[0].id;
        }

        // 3. Salvar Mensagem
        await db.query(
            `INSERT INTO chat_messages (session_id, role, sender_type, sender_id, content) 
             VALUES ($1, 'user', 'client', $2, $3)`,
            [sessionId, phone, messageContent]
        );

        // 4. Emitir evento Socket.io (Mensagem Recebida)
        if (io) {
            io.emit('whatsapp_message', {
                sessionId,
                phone,
                name: clientName,
                content: messageContent,
                timestamp: new Date()
            });
        }

        // --- SISTÊMICO: UPDATE LEAD SCORE ---
        try {
            // Tentar encontrar o Lead associado a este telefone
            const leadRes = await db.query("SELECT id FROM leads WHERE phone LIKE $1 OR phone LIKE $2 LIMIT 1", [`%${phone}%`, phone]);
            if (leadRes.rows.length > 0) {
                const { calculateLeadScore } = require('./services/scoringService');
                await calculateLeadScore(leadRes.rows[0].id);
            }
        } catch (scoreErr) {
            console.error('Erro ao atualizar Score por mensagem:', scoreErr);
        }

        // 5. COACHING EM TEMPO REAL (Teleprompter)
        // Recuperar histórico recente (últimas 10 msgs)
        const historyResult = await db.query(
            `SELECT sender_type as role, content FROM chat_messages 
             WHERE session_id = $1 
             ORDER BY created_at ASC LIMIT 10`,
            [sessionId]
        );

        const messages = historyResult.rows.map(row => ({
            role: row.role === 'client' ? 'user' : 'agent',
            content: row.content
        }));

        // Obter API Key do sistema (admin user id 1 ou env var)
        const apiKey = await aiController.getEffectiveApiKey('openai', null);

        if (apiKey) {
            const analysis = await aiController.analyzeStrategyInternal(
                messages,
                { product: "Elite Finder Services", goal: "Qualification & Sales" },
                apiKey
            );

            // Salvar análise no banco
            await db.query(
                `INSERT INTO chat_analyses (session_id, analysis_type, full_report, sentiment_label, buying_stage) 
                 VALUES ($1, 'sales_coaching', $2, $3, $4)`,
                [sessionId, JSON.stringify(analysis), analysis.sentiment, analysis.buying_stage]
            );

            // Emitir evento Socket.io (Coaching Update)
            if (io) {
                console.log(`🧠 Coaching Insight Generated for ${phone}`);
                io.emit('sales_coaching_update', {
                    sessionId,
                    phone,
                    analysis
                });
            }

            // --- SYMBIOSIS: SMART LEAD MOVER ---
            // Atualizar status do Lead no CRM baseado no estágio de compra detectado pela IA
            if (analysis.buying_stage) {
                try {
                    // Mapeamento de Estágios da IA para Status do CRM
                    const stageMap = {
                        'Curiosidade': 'contacted',
                        'Consideração': 'qualified',
                        'Decisão': 'negotiation',
                        'Compra': 'closed' // Se houver
                    };

                    const newStatus = stageMap[analysis.buying_stage];

                    if (newStatus) {
                        // Buscar lead pelo telefone (normalizado)
                        // Nota: O telefone no banco pode ter formatação, então usamos LIKE ou normalização
                        const leadRes = await db.query(
                            "SELECT id, status FROM leads WHERE phone LIKE $1 OR phone LIKE $2 LIMIT 1",
                            [`%${phone}%`, phone]
                        );

                        if (leadRes.rows.length > 0) {
                            const lead = leadRes.rows[0];
                            // Só atualizar se o status for "superior" ou diferente (lógica simplificada: se diferente)
                            if (lead.status !== newStatus && lead.status !== 'closed' && lead.status !== 'won') {
                                await db.query(
                                    "UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2",
                                    [newStatus, lead.id]
                                );
                                console.log(`🔄 [Symbiosis] Lead ${lead.id} moved to ${newStatus} based on AI Analysis`);

                                if (io) {
                                    io.emit('lead_updated', { id: lead.id, status: newStatus });
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error('⚠️ Error in Smart Lead Mover:', err);
                }
            }
        }

        res.status(200).send('PROCESSED');

    } catch (error) {
        console.error('Error processing WhatsApp webhook:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getSessions = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                cs.id, 
                cs.status, 
                cs.created_at, 
                cs.updated_at,
                cs.metadata,
                c.name as client_name,
                c.phone as client_phone
            FROM chat_sessions cs
            LEFT JOIN clients c ON cs.client_id = c.id
            WHERE cs.channel = 'whatsapp' AND cs.status = 'active'
            ORDER BY cs.updated_at DESC
            LIMIT 50
        `);

        const sessions = result.rows.map(row => ({
            id: row.id,
            status: row.status,
            name: row.client_name || row.metadata?.pushName || 'Desconhecido',
            phone: row.client_phone || row.metadata?.phone || 'Sem número',
            lastUpdate: row.updated_at
        }));

        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
};

const getSessionMessages = async (req, res) => {
    const { sessionId } = req.params;
    try {
        const result = await db.query(`
            SELECT id, sender_type, content, created_at 
            FROM chat_messages 
            WHERE session_id = $1 
            ORDER BY created_at ASC
        `, [sessionId]);

        const messages = result.rows.map(row => ({
            id: row.id,
            role: row.sender_type === 'agent' ? 'agent' : 'user',
            content: row.content,
            timestamp: row.created_at,
            source: row.sender_type === 'agent' ? 'web' : 'whatsapp'
        }));

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

module.exports = { handleWebhook, sendOutboundMessage, getSessions, getSessionMessages };
