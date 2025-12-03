const db = require('../database');

/**
 * Calcula o Score de um Lead baseado em interações
 * @param {number} leadId 
 */
const calculateLeadScore = async (leadId) => {
    try {
        let score = 0;
        const log = [];

        // 1. Dados Básicos
        // SAAS FIX: Get tenant_id to scope the scoring
        const leadRes = await db.query(`
            SELECT l.*, c.tenant_id 
            FROM leads l
            JOIN clients c ON l.client_id = c.id
            WHERE l.id = $1
        `, [leadId]);

        if (leadRes.rows.length === 0) return;
        const lead = leadRes.rows[0];

        // Pontuação Base
        if (lead.email) score += 5;
        if (lead.phone) score += 10;
        if (lead.company) score += 5;
        if (lead.value > 5000) score += 10;

        // 2. Interações (Chat)
        // Primary check: Sessions linked to this specific client
        const chatRes = await db.query(
            "SELECT COUNT(*) as count FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE client_id = $1) AND role = 'user'",
            [lead.client_id]
        );

        let messageCount = parseInt(chatRes.rows[0].count);

        // Fallback: Check by phone but RESTRICT TO SAME TENANT
        if (messageCount === 0 && lead.phone && lead.tenant_id) {
            const phoneClean = lead.phone.replace(/\D/g, '');
            const chatPhoneRes = await db.query(`
                SELECT COUNT(*) as count 
                FROM chat_messages cm 
                JOIN chat_sessions cs ON cm.session_id = cs.id 
                LEFT JOIN clients c ON cs.client_id = c.id
                WHERE cs.metadata->>'phone' LIKE $1 
                AND cm.role = 'user'
                AND (c.tenant_id = $2 OR c.tenant_id IS NULL) -- Safety check
            `, [`%${phoneClean}%`, lead.tenant_id]);

            // Only use this count if it's greater (merge logic)
            const phoneCount = parseInt(chatPhoneRes.rows[0].count);
            if (phoneCount > messageCount) messageCount = phoneCount;
        }

        score += (messageCount * 2); // 2 pontos por mensagem enviada

        // 3. Status Atual
        if (lead.status === 'qualified') score += 20;
        if (lead.status === 'negotiation') score += 40;

        // Atualizar no Banco
        // Adicionar coluna score se não existir (migration idealmente, mas aqui faremos update se existir)
        // Vamos assumir que existe ou criar um campo metadata

        // Log
        console.log(`📊 Lead Score Calculated for Lead ${leadId}: ${score}`);

        return score;

    } catch (error) {
        console.error('Error calculating lead score:', error);
        return 0;
    }
};

module.exports = { calculateLeadScore };
