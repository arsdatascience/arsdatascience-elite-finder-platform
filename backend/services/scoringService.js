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
        const leadRes = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        if (leadRes.rows.length === 0) return;
        const lead = leadRes.rows[0];

        // Pontuação Base
        if (lead.email) score += 5;
        if (lead.phone) score += 10;
        if (lead.company) score += 5;
        if (lead.value > 5000) score += 10;

        // 2. Interações (Chat)
        const chatRes = await db.query(
            "SELECT COUNT(*) as count FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE client_id = $1) AND role = 'user'",
            [lead.client_id] // Assumindo relação lead -> client ou usando phone
        );

        // Se não tiver client_id, tentar pelo telefone nas sessions
        let messageCount = 0;
        if (lead.phone) {
            const phoneClean = lead.phone.replace(/\D/g, '');
            const chatPhoneRes = await db.query(
                "SELECT COUNT(*) as count FROM chat_messages cm JOIN chat_sessions cs ON cm.session_id = cs.id WHERE cs.metadata->>'phone' LIKE $1 AND cm.role = 'user'",
                [`%${phoneClean}%`]
            );
            messageCount = parseInt(chatPhoneRes.rows[0].count);
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
