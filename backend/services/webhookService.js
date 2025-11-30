const pool = require('../database');

const triggerWebhook = async (userId, event, payload) => {
    try {
        // Buscar configuração do n8n para este usuário
        // Assume que existe uma integração com platform='n8n'
        const result = await pool.query(
            "SELECT config FROM integrations WHERE user_id = $1 AND platform = 'n8n' AND status = 'connected'",
            [userId]
        );

        if (result.rows.length === 0) return;

        const config = result.rows[0].config;

        // Tenta pegar a URL geral ou específica do evento
        let webhookUrl = config.webhookUrl;

        if (config.events && config.events[event]) {
            webhookUrl = config.events[event];
        }

        if (!webhookUrl) return;

        console.log(`🚀 Disparando webhook ${event} para ${webhookUrl}`);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event,
                timestamp: new Date(),
                data: payload
            })
        });

        if (!response.ok) {
            console.error(`Falha no webhook: ${response.status} ${response.statusText}`);
        }

    } catch (error) {
        console.error('Erro ao disparar webhook:', error.message);
    }
};

module.exports = { triggerWebhook };
