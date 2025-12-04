const pool = require('./database');

exports.predictChurn = async (req, res) => {
    try {
        // Buscar todos os clientes (Schema validado: id, name, email, created_at)
        // Removidos campos inexistentes: last_login, plan_status
        // Removidas subqueries de tabelas inexistentes: tickets, audio_analyses
        const clientsResult = await pool.query(`
            SELECT c.id, c.name, c.email, c.created_at
            FROM clients c
            ORDER BY c.created_at DESC
        `);

        const clients = clientsResult.rows;
        const riskReport = [];

        for (const client of clients) {
            let riskScore = 0;
            const riskFactors = [];

            // 1. "Inatividade" baseada em created_at (Exemplo simplificado pois não temos last_login)
            // Se o cliente é muito antigo (> 1 ano), talvez risco? Não necessariamente.
            // Vamos manter zero por enquanto para evitar falsos positivos.

            // 2. Sem e-mail ou telefone (Dados incompletos)
            if (!client.email) {
                riskScore += 10;
                riskFactors.push('Cadastro incompleto (sem e-mail)');
            }

            // Normalizar Score (Max 100)
            riskScore = Math.min(riskScore, 100);

            if (riskScore > 0) {
                riskReport.push({
                    client_id: client.id,
                    name: client.name,
                    email: client.email,
                    riskScore,
                    riskLevel: riskScore > 75 ? 'CRITICAL' : (riskScore > 50 ? 'HIGH' : 'LOW'),
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
            SELECT c.id, c.name, c.email, c.created_at
            FROM clients c
            WHERE c.id = $1
        `, [clientId]);

        if (result.rows.length === 0) return null;

        const client = result.rows[0];
        let riskScore = 0;
        const riskFactors = [];

        // Lógica simplificada compatível com schema atual
        if (!client.email) {
            riskScore += 10;
            riskFactors.push('Cadastro incompleto');
        }

        return {
            riskScore,
            riskLevel: riskScore > 50 ? 'HIGH' : 'LOW',
            factors: riskFactors
        };

    } catch (error) {
        console.error(`Erro ao calcular risco para cliente ${clientId}:`, error);
        return null;
    }
};
