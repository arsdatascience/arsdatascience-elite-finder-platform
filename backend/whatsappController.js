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
        // console.log('🔍 WEBHOOK PAYLOAD RECEIVED:', JSON.stringify(req.body, null, 2)); // DEBUG LOG
        const { instance, data, sender, event } = req.body; // Formato genérico EvolutionAPI v2

        // Ignorar eventos de status/update para não gerar erro 400
        if (['messages.update', 'chats.update', 'contacts.update', 'presence.update'].includes(event)) {
            return res.status(200).send('Event received');
        }

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

        // Ignorar mensagens de GRUPOS (JID termina em @g.us)
        // Só processamos mensagens individuais (@s.whatsapp.net)
        if (data && data.key && data.key.remoteJid && data.key.remoteJid.includes('@g.us')) {
            console.log(`🚫 Ignoring group message from: ${data.key.remoteJid}`);
            return res.status(200).send('Ignored group message');
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
        // 2. Find or Create Client (Lead)
        // SAAS FIX: Scope by Tenant ID
        let clientResult = await db.query('SELECT * FROM clients WHERE phone = $1 AND tenant_id = $2', [phone, tenantId]);
        let clientId;

        if (clientResult.rows.length === 0) {
            // Create new client (Lead)
            const newClient = await db.query(
                'INSERT INTO clients (name, phone, tenant_id, created_at, last_interaction_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
                [pushName || phone, phone, tenantId]
            );
            clientId = newClient.rows[0].id;
            console.log(`🆕 New Lead Created: ${pushName} (ID: ${clientId}) for Tenant ${tenantId}`);
        } else {
            clientId = clientResult.rows[0].id;
            // CHURN UPDATE: Update last_interaction_at to keep client "alive"
            await db.query('UPDATE clients SET last_interaction_at = NOW() WHERE id = $1', [clientId]);
            console.log(`🔄 Client Active: ID ${clientId} updated last_interaction_at`);
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

        // 4. Emitir evento Socket.io (Mensagem Recebida - Imediato para UI)
        if (io) {
            io.emit('whatsapp_message', {
                sessionId,
                phone,
                name: pushName,
                content: messageContent,
                timestamp: new Date()
            });
        }

        // 5. OFFLOAD HEAVY PROCESSING TO QUEUE (BullMQ)
        // Instead of waiting for AI and Scoring, we queue a job.
        const { jobsQueue } = require('./queueClient');
        await jobsQueue.add('process_whatsapp_message', {
            type: 'process_whatsapp_message',
            payload: {
                sessionId,
                phone,
                messageContent,
                tenantId,
                clientId
            }
        });

        console.log(`🚀 Async Job Queued: process_whatsapp_message for ${phone}`);

        // Respond immediately to WhatsApp/EvolutionAPI
        res.status(200).send('PROCESSED_ASYNC');

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

/**
 * DELETE /api/whatsapp/sessions/:sessionId
 * Deleta uma sessão de chat e suas mensagens
 */
const deleteSession = async (req, res) => {
    const { sessionId } = req.params;
    try {
        // Deletar mensagens primeiro (FK constraint)
        await db.query('DELETE FROM chat_messages WHERE session_id = $1', [sessionId]);

        // Deletar a sessão
        const result = await db.query('DELETE FROM chat_sessions WHERE id = $1 RETURNING id', [sessionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        console.log(`🗑️ Session ${sessionId} deleted successfully`);
        res.json({ success: true, message: 'Session deleted' });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
};

/**
 * POST /api/whatsapp/sessions/:sessionId/reanalyze
 * Dispara uma reanálise completa da conversa via Job Queue
 */
const reanalyzeSession = async (req, res) => {
    const { sessionId } = req.params;
    try {
        // Verificar se a sessão existe
        const sessionRes = await db.query('SELECT * FROM chat_sessions WHERE id = $1', [sessionId]);
        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const session = sessionRes.rows[0];
        const clientId = session.client_id;
        const metadata = session.metadata || {};
        const phone = metadata.phone || 'Unknown';

        // Enfileirar Job de Reanálise Completa
        const { jobsQueue } = require('./queueClient');
        await jobsQueue.add('full_session_reanalysis', {
            type: 'full_session_reanalysis',
            payload: {
                sessionId,
                clientId,
                phone,
                tenantId: req.user.tenant_id // Assume auth middleware adds this
            }
        });

        console.log(`🔄 Reanalysis Job Queued for Session ${sessionId}`);
        res.json({ success: true, message: 'Reanalysis started' });

    } catch (error) {
        console.error('Error triggering reanalysis:', error);
        res.status(500).json({ error: 'Failed to trigger reanalysis' });
    }
};

module.exports = { handleWebhook, sendOutboundMessage, getSessions, getSessionMessages, deleteSession, reanalyzeSession };
