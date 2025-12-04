const pool = require('./database');

exports.predictChurn = async (req, res) => {
    try {
        // Buscar todos os clientes ativos com dados agregados das novas tabelas
        const clientsResult = await pool.query(`
            SELECT c.id, c.name, c.email, c.last_interaction_at, c.plan_status, c.created_at,
                   (SELECT COUNT(*) FROM tickets t WHERE t.client_id = c.id AND t.status IN ('open', 'in_progress')) as open_tickets,
                   (SELECT AVG(ma.sentiment_score) FROM meeting_analyses ma WHERE ma.client_id = c.id AND ma.created_at > NOW() - INTERVAL '30 days') as avg_sentiment
            FROM clients c
            WHERE 1=1 -- Adicionar filtro de status se houver coluna status
        `);

        const clients = clientsResult.rows;
        const riskReport = [];

        for (const client of clients) {
            let riskScore = 0;
            const riskFactors = [];

            // 1. Inatividade (> 15 dias sem interação)
            // Usa last_interaction_at ou created_at como fallback
            const lastActivity = client.last_interaction_at ? new Date(client.last_interaction_at) : new Date(client.created_at);
            const daysSinceActivity = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));

            if (daysSinceActivity > 15) {
                riskScore += 30;
                riskFactors.push(`Sem interação há ${daysSinceActivity} dias`);
            }

            // 2. Tickets em Aberto (> 2)
            const openTickets = parseInt(client.open_tickets || 0);
            if (openTickets > 2) {
                riskScore += 25;
                riskFactors.push(`${openTickets} tickets de suporte pendentes`);
            }

            // 3. Sentimento Negativo nas Reuniões (se houver)
            // Score de 0.0 a 1.0. Abaixo de 0.4 é ruim.
            const sentiment = parseFloat(client.avg_sentiment);
            if (!isNaN(sentiment) && sentiment < 0.4) {
                riskScore += 30;
                riskFactors.push('Sentimento negativo detectado em reuniões recentes');
            }

            // 4. Problemas de Pagamento
            if (client.plan_status === 'overdue') {
                riskScore += 40;
                riskFactors.push('Pagamento em atraso');
            }

            // Normalizar Score (Max 100)
            riskScore = Math.min(riskScore, 100);

            if (riskScore > 20) { // Reportar qualquer risco leve para cima
                riskReport.push({
                    client_id: client.id,
                    name: client.name,
                    email: client.email,
                    riskScore,
                    riskLevel: riskScore > 75 ? 'CRITICAL' : (riskScore > 50 ? 'HIGH' : 'MEDIUM'),
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

exports.calculateRiskForClient = async (clientId) => {
    try {
        const result = await pool.query(`
            SELECT c.id, c.name, c.email, c.last_interaction_at, c.plan_status, c.created_at,
                   (SELECT COUNT(*) FROM tickets t WHERE t.client_id = c.id AND t.status IN ('open', 'in_progress')) as open_tickets,
                   (SELECT AVG(ma.sentiment_score) FROM meeting_analyses ma WHERE ma.client_id = c.id AND ma.created_at > NOW() - INTERVAL '30 days') as avg_sentiment
            FROM clients c
            WHERE c.id = $1
        `, [clientId]);

        if (result.rows.length === 0) return null;

        const client = result.rows[0];
        let riskScore = 0;
        const riskFactors = [];

        // 1. Inatividade
        const lastActivity = client.last_interaction_at ? new Date(client.last_interaction_at) : new Date(client.created_at);
        const daysSinceActivity = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));

        if (daysSinceActivity > 15) {
            riskScore += 30;
            riskFactors.push(`Sem interação há ${daysSinceActivity} dias`);
        }

        // 2. Tickets
        const openTickets = parseInt(client.open_tickets || 0);
        if (openTickets > 2) {
            riskScore += 25;
            riskFactors.push(`${openTickets} tickets de suporte pendentes`);
        }

        // 3. Sentimento
        const sentiment = parseFloat(client.avg_sentiment);
        if (!isNaN(sentiment) && sentiment < 0.4) {
            riskScore += 30;
            riskFactors.push('Sentimento negativo detectado em reuniões recentes');
        }

        // 4. Pagamento
        if (client.plan_status === 'overdue') {
            riskScore += 40;
            riskFactors.push('Pagamento em atraso');
        }

        riskScore = Math.min(riskScore, 100);

        return {
            riskScore,
            riskLevel: riskScore > 75 ? 'CRITICAL' : (riskScore > 50 ? 'HIGH' : (riskScore > 25 ? 'MEDIUM' : 'LOW')),
            factors: riskFactors
        };

    } catch (error) {
        console.error(`Erro ao calcular risco para cliente ${clientId}:`, error);
        return null;
    }
};
