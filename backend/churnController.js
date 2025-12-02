const pool = require('./database');

exports.predictChurn = async (req, res) => {
    try {
        // Buscar todos os clientes ativos
        const clientsResult = await pool.query(`
            SELECT c.id, c.name, c.email, c.last_login, c.plan_status,
                   (SELECT COUNT(*) FROM tickets t WHERE t.client_id = c.id AND t.status = 'open') as open_tickets,
                   (SELECT AVG((global_sentiment->>'score')::float) FROM audio_analyses a WHERE a.user_id = c.user_id AND a.created_at > NOW() - INTERVAL '30 days') as avg_sentiment
            FROM clients c
            WHERE c.status = 'active'
        `);

        const clients = clientsResult.rows;
        const riskReport = [];

        for (const client of clients) {
            let riskScore = 0;
            const riskFactors = [];

            // 1. Inatividade (> 15 dias)
            const daysSinceLogin = client.last_login ? Math.floor((new Date() - new Date(client.last_login)) / (1000 * 60 * 60 * 24)) : 30;
            if (daysSinceLogin > 15) {
                riskScore += 30;
                riskFactors.push(`Inativo há ${daysSinceLogin} dias`);
            }

            // 2. Tickets em Aberto (> 2)
            if (client.open_tickets > 2) {
                riskScore += 25;
                riskFactors.push(`${client.open_tickets} tickets de suporte abertos`);
            }

            // 3. Sentimento Negativo nas Calls (se houver)
            if (client.avg_sentiment && client.avg_sentiment < 0.4) { // 0.0 a 1.0, onde < 0.4 é negativo/neutro-baixo
                riskScore += 30;
                riskFactors.push('Sentimento negativo detectado em reuniões recentes');
            }

            // 4. Problemas de Pagamento (Simulado via status do plano)
            if (client.plan_status === 'overdue') {
                riskScore += 40;
                riskFactors.push('Pagamento em atraso');
            }

            // Normalizar Score (Max 100)
            riskScore = Math.min(riskScore, 100);

            if (riskScore > 50) { // Apenas reportar risco médio/alto
                riskReport.push({
                    client_id: client.id,
                    name: client.name,
                    email: client.email,
                    riskScore,
                    riskLevel: riskScore > 75 ? 'CRITICAL' : 'HIGH',
                    factors: riskFactors
                });
            }
        }

        // Ordenar por risco (maior primeiro)
        riskReport.sort((a, b) => b.riskScore - a.riskScore);

        res.json({
            total_analyzed: clients.length,
            at_risk_count: riskReport.length,
            risks: riskReport
        });

    } catch (error) {
        console.error('Erro na análise de churn:', error);
        res.status(500).json({ error: 'Erro ao processar predição de churn' });
    }
};
