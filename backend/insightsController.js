/**
 * AI Insights Controller
 * Gera insights com IA sobre a jornada do cliente
 * Integra: Qdrant + Crossover DB + Megalev DB + S3
 */

const pool = require('./database');
const opsPool = pool.opsPool;
const qdrantService = require('./services/qdrantService');
const storageService = require('./services/storageService');
const aiService = require('./services/aiService');

/**
 * POST /api/insights/customer-journey
 * Gera insights sobre a jornada do cliente usando IA
 */
exports.generateCustomerJourneyInsight = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const userId = req.user.id;
        const { focusArea = 'all', customerIds = null, provider = 'openai', model } = req.body;

        // 1. Coletar dados do Crossover (leads, clients, interactions)
        const crossoverData = await collectCrossoverData(tenantId, customerIds);

        // 2. Coletar dados do Megalev (projects, tasks, financials)
        const megalevData = await collectMegalevData(tenantId, customerIds);

        // 3. Buscar contexto relevante no Qdrant
        const contextQuery = buildContextQuery(crossoverData, megalevData, focusArea);
        const qdrantContext = await searchQdrantContext(contextQuery);

        // 4. Gerar insights com LLM
        const insights = await generateInsightsWithAI({
            crossoverData,
            megalevData,
            qdrantContext,
            focusArea,
            provider,
            model
        });

        // 5. Salvar insight no banco
        const savedInsight = await saveInsight({
            tenantId,
            userId,
            focusArea,
            insights,
            crossoverData,
            megalevData,
            qdrantContext,
            provider // Optional: save provider metadata if table supports it (schema didn't have it, but useful for debug)
        });

        // 6. Gerar e salvar relatório no S3 (opcional)
        let reportUrl = null;
        if (req.body.generateReport) {
            reportUrl = await generateAndSaveReport(savedInsight, tenantId);
        }

        res.json({
            success: true,
            insight: {
                ...savedInsight,
                reportUrl
            }
        });

    } catch (error) {
        console.error('Erro ao gerar insight:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar insight',
            details: error.message
        });
    }
};

/**
 * GET /api/insights/recent
 * Lista insights recentes do tenant
 */
exports.getRecentInsights = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const limit = parseInt(req.query.limit) || 10;

        const result = await pool.query(`
            SELECT id, insight_type, title, summary, created_at, report_url
            FROM ai_insights
            WHERE tenant_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `, [tenantId, limit]);

        res.json({
            success: true,
            insights: result.rows
        });

    } catch (error) {
        console.error('Erro ao buscar insights:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar insights'
        });
    }
};

/**
 * GET /api/insights/:id
 * Busca insight específico com análise completa
 */
exports.getInsightById = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { id } = req.params;

        const result = await pool.query(`
            SELECT *
            FROM ai_insights
            WHERE id = $1 AND tenant_id = $2
        `, [id, tenantId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Insight não encontrado'
            });
        }

        res.json({
            success: true,
            insight: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao buscar insight:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar insight'
        });
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Coleta dados do banco Crossover (leads, clients, interactions)
 */
async function collectCrossoverData(tenantId, customerIds = null) {
    const data = {
        totalCustomers: 0,
        customers: [],
        journeyDistribution: [],
        interactions: [],
        conversions: []
    };

    try {
        // Total de clientes unificados
        const countResult = await pool.query(`
            SELECT COUNT(*) as total FROM unified_customers WHERE tenant_id = $1
        `, [tenantId]);
        data.totalCustomers = parseInt(countResult.rows[0]?.total || 0);

        // Distribuição por estágio da jornada
        const journeyResult = await pool.query(`
            SELECT current_stage, COUNT(*) as count
            FROM unified_customers
            WHERE tenant_id = $1
            GROUP BY current_stage
        `, [tenantId]);
        data.journeyDistribution = journeyResult.rows;

        // Clientes com métricas (top 50 para análise)
        const customersQuery = customerIds
            ? `SELECT id, name, email, current_stage, lifetime_value, purchase_count, 
                      channel_mix, tags, last_interaction, cart_value
               FROM unified_customers
               WHERE tenant_id = $1 AND id = ANY($2)
               LIMIT 50`
            : `SELECT id, name, email, current_stage, lifetime_value, purchase_count, 
                      channel_mix, tags, last_interaction, cart_value
               FROM unified_customers
               WHERE tenant_id = $1
               ORDER BY lifetime_value DESC NULLS LAST
               LIMIT 50`;

        const customersResult = await pool.query(
            customersQuery,
            customerIds ? [tenantId, customerIds] : [tenantId]
        );
        data.customers = customersResult.rows;

        // Interações recentes (últimos 30 dias)
        const interactionsResult = await pool.query(`
            SELECT channel, interaction_type, COUNT(*) as count
            FROM customer_interactions
            WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days'
            GROUP BY channel, interaction_type
            ORDER BY count DESC
            LIMIT 20
        `, [tenantId]);
        data.interactions = interactionsResult.rows;

        // Conversões recentes
        const conversionsResult = await pool.query(`
            SELECT conversion_type, COUNT(*) as count, SUM(conversion_value) as total_value,
                   first_touch_channel, last_touch_channel
            FROM conversion_events
            WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days'
            GROUP BY conversion_type, first_touch_channel, last_touch_channel
            ORDER BY count DESC
            LIMIT 10
        `, [tenantId]);
        data.conversions = conversionsResult.rows;

    } catch (error) {
        console.error('Erro ao coletar dados do Crossover:', error);
    }

    return data;
}

/**
 * Coleta dados do banco Megalev (projects, tasks, financials)
 */
async function collectMegalevData(tenantId, customerIds = null) {
    const data = {
        projects: [],
        tasks: [],
        financials: {
            revenue: 0,
            expenses: 0,
            profit: 0
        },
        kpis: {}
    };

    try {
        // Projetos ativos
        const projectsResult = await opsPool.query(`
            SELECT id, name, status, client_id, 
                   COALESCE(budget, 0) as total_value,
                   created_at
            FROM projects
            WHERE tenant_id = $1 AND status != 'cancelled'
            ORDER BY created_at DESC
            LIMIT 20
        `, [tenantId]);
        data.projects = projectsResult.rows;

        // Tasks por status
        const tasksResult = await opsPool.query(`
            SELECT status, COUNT(*) as count
            FROM tasks
            WHERE tenant_id = $1
            GROUP BY status
        `, [tenantId]);
        data.tasks = tasksResult.rows;

        // Financeiro resumido
        const financeResult = await opsPool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as revenue,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
            FROM transactions
            WHERE tenant_id = $1 AND date >= NOW() - INTERVAL '30 days'
        `, [tenantId]);

        if (financeResult.rows[0]) {
            data.financials.revenue = parseFloat(financeResult.rows[0].revenue) || 0;
            data.financials.expenses = parseFloat(financeResult.rows[0].expenses) || 0;
            data.financials.profit = data.financials.revenue - data.financials.expenses;
        }

        // KPIs de satisfação (se existir)
        try {
            const npsResult = await opsPool.query(`
                SELECT AVG(score) as avg_nps, COUNT(*) as responses
                FROM satisfaction_scores
                WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '90 days'
            `, [tenantId]);

            if (npsResult.rows[0]) {
                data.kpis.nps = parseFloat(npsResult.rows[0].avg_nps) || null;
                data.kpis.npsResponses = parseInt(npsResult.rows[0].responses) || 0;
            }
        } catch (e) {
            // Tabela pode não existir
        }

    } catch (error) {
        console.error('Erro ao coletar dados do Megalev:', error);
    }

    return data;
}

/**
 * Constrói query para busca no Qdrant
 */
function buildContextQuery(crossoverData, megalevData, focusArea) {
    const parts = [];

    // Baseado na distribuição de jornada
    if (crossoverData.journeyDistribution.length > 0) {
        const stages = crossoverData.journeyDistribution.map(j => j.current_stage).join(', ');
        parts.push(`customer journey stages: ${stages}`);
    }

    // Baseado em canais mais usados
    if (crossoverData.interactions.length > 0) {
        const channels = [...new Set(crossoverData.interactions.map(i => i.channel))].slice(0, 3);
        parts.push(`main channels: ${channels.join(', ')}`);
    }

    // Foco específico
    if (focusArea === 'churn') {
        parts.push('customer churn risk analysis and retention strategies');
    } else if (focusArea === 'upsell') {
        parts.push('upsell opportunities and cross-sell strategies');
    } else if (focusArea === 'engagement') {
        parts.push('customer engagement and interaction patterns');
    } else {
        parts.push('customer journey optimization and conversion improvement');
    }

    return parts.join('. ');
}

/**
 * Busca contexto relevante no Qdrant
 */
async function searchQdrantContext(query) {
    try {
        // Gerar embedding da query
        const embedding = await aiService.generateEmbedding(query);

        if (!embedding || embedding.length === 0) {
            console.log('Não foi possível gerar embedding para a query');
            return [];
        }

        // Buscar no Qdrant
        const result = await qdrantService.searchVectors(
            'marketing_strategies', // Collection padrão
            embedding,
            5 // Top 5 resultados
        );

        if (result.success && result.results) {
            return result.results.map(r => ({
                content: r.payload?.content || r.payload?.text || '',
                score: r.score,
                metadata: r.payload?.metadata || {}
            }));
        }

        return [];
    } catch (error) {
        console.error('Erro ao buscar contexto no Qdrant:', error);
        return [];
    }
}

/**
 * Gera insights usando LLM
 */
async function generateInsightsWithAI({ crossoverData, megalevData, qdrantContext, focusArea, provider, model }) {
    const systemPrompt = `Você é um especialista em análise de jornada do cliente e estratégia de negócios.
Analise os dados fornecidos e gere insights acionáveis em português brasileiro.

## Formato de Resposta
Responda em JSON com a seguinte estrutura:
{
  "title": "Título curto e impactante do insight",
  "summary": "Resumo executivo em 2-3 frases",
  "keyFindings": ["insight 1", "insight 2", "insight 3"],
  "opportunities": ["oportunidade 1", "oportunidade 2"],
  "risks": ["risco 1", "risco 2"],
  "recommendations": [
    {"action": "ação recomendada", "priority": "alta|média|baixa", "impact": "descrição do impacto"}
  ],
  "metrics": {
    "healthScore": 0-100,
    "retentionRisk": "baixo|médio|alto",
    "growthPotential": "baixo|médio|alto"
  }
}`;

    const userPrompt = `Analise os seguintes dados da jornada do cliente:

## Dados do Crossover (Clientes e Interações)
- Total de clientes: ${crossoverData.totalCustomers}
- Distribuição na jornada: ${JSON.stringify(crossoverData.journeyDistribution)}
- Interações recentes: ${JSON.stringify(crossoverData.interactions)}
- Conversões: ${JSON.stringify(crossoverData.conversions)}
- Valor médio do carrinho abandonado: ${crossoverData.customers.filter(c => c.cart_value > 0).length} clientes

## Dados do Megalev (Operacional)
- Projetos ativos: ${megalevData.projects.length}
- Receita (30 dias): R$ ${megalevData.financials.revenue.toFixed(2)}
- Despesas (30 dias): R$ ${megalevData.financials.expenses.toFixed(2)}
- Lucro: R$ ${megalevData.financials.profit.toFixed(2)}
- Tasks: ${JSON.stringify(megalevData.tasks)}
${megalevData.kpis.nps ? `- NPS médio: ${megalevData.kpis.nps.toFixed(1)}` : ''}

## Contexto Adicional (Base de Conhecimento)
${qdrantContext.length > 0 ? qdrantContext.map(c => c.content).join('\n') : 'Sem contexto adicional disponível'}

## Foco da Análise
${focusArea === 'churn' ? 'Risco de churn e estratégias de retenção' :
            focusArea === 'upsell' ? 'Oportunidades de upsell e cross-sell' :
                focusArea === 'engagement' ? 'Engajamento e padrões de interação' :
                    'Visão geral da jornada e oportunidades de otimização'}

Gere insights acionáveis baseados nesses dados.`;

    try {
        const response = await aiService.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            provider,
            model: model || 'gpt-4-turbo-preview', // Default logic handled here or service
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const content = response.choices?.[0]?.message?.content;
        if (content) {
            return JSON.parse(content);
        }

        throw new Error('Resposta vazia do LLM');
    } catch (error) {
        console.error('Erro ao gerar insights com IA:', error);

        // Fallback com insights básicos
        return {
            title: 'Análise da Jornada do Cliente',
            summary: `Análise baseada em ${crossoverData.totalCustomers} clientes com receita de R$ ${megalevData.financials.revenue.toFixed(2)} nos últimos 30 dias.`,
            keyFindings: [
                `Total de ${crossoverData.totalCustomers} clientes no funil`,
                `${crossoverData.interactions.length} tipos de interações registradas`,
                `${megalevData.projects.length} projetos ativos`
            ],
            opportunities: ['Dados insuficientes para análise detalhada'],
            risks: ['Dados insuficientes para análise de riscos'],
            recommendations: [{
                action: 'Coletar mais dados de interação com clientes',
                priority: 'alta',
                impact: 'Permitirá análises mais precisas'
            }],
            metrics: {
                healthScore: 50,
                retentionRisk: 'médio',
                growthPotential: 'médio'
            }
        };
    }
}

/**
 * Salva insight no banco de dados
 */
async function saveInsight({ tenantId, userId, focusArea, insights, crossoverData, megalevData, qdrantContext }) {
    const result = await pool.query(`
        INSERT INTO ai_insights (
            tenant_id, insight_type, title, summary, full_analysis,
            data_sources, qdrant_context, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `, [
        tenantId,
        `customer_journey_${focusArea}`,
        insights.title,
        insights.summary,
        JSON.stringify(insights),
        JSON.stringify({
            crossover: {
                totalCustomers: crossoverData.totalCustomers,
                journeyStages: crossoverData.journeyDistribution.length,
                interactionTypes: crossoverData.interactions.length
            },
            megalev: {
                projects: megalevData.projects.length,
                revenue: megalevData.financials.revenue
            }
        }),
        JSON.stringify(qdrantContext.map(c => ({ score: c.score, preview: c.content?.substring(0, 100) }))),
        userId
    ]);

    return result.rows[0];
}

/**
 * Gera relatório e salva no S3
 */
async function generateAndSaveReport(insight, tenantId) {
    try {
        // Gerar HTML do relatório
        const reportHtml = generateReportHtml(insight);

        // Converter para buffer
        const buffer = Buffer.from(reportHtml, 'utf-8');

        // Salvar no S3
        const fileName = `insights/insight_${insight.id}_${Date.now()}.html`;
        const result = await storageService.uploadFile(
            buffer,
            fileName,
            'text/html',
            tenantId
        );

        // Atualizar URL no banco
        if (result) {
            await pool.query(
                'UPDATE ai_insights SET report_url = $1 WHERE id = $2',
                [result, insight.id]
            );
            return result;
        }

        return null;
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        return null;
    }
}

/**
 * Gera HTML do relatório
 */
function generateReportHtml(insight) {
    const analysis = insight.full_analysis || {};

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>${insight.title || 'Relatório de Insights'}</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { color: #1e293b; }
        .summary { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .section { margin: 30px 0; }
        .section h2 { color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        ul { line-height: 1.8; }
        .metric { display: inline-block; background: #3b82f6; color: white; padding: 5px 15px; border-radius: 20px; margin: 5px; }
        .recommendation { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 10px 0; }
        .risk { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>📊 ${insight.title}</h1>
    <p style="color: #64748b;">Gerado em: ${new Date(insight.created_at).toLocaleString('pt-BR')}</p>
    
    <div class="summary">
        <strong>Resumo Executivo:</strong>
        <p>${insight.summary}</p>
    </div>
    
    ${analysis.metrics ? `
    <div class="section">
        <h2>Métricas</h2>
        <span class="metric">Health Score: ${analysis.metrics.healthScore}/100</span>
        <span class="metric">Risco de Churn: ${analysis.metrics.retentionRisk}</span>
        <span class="metric">Potencial: ${analysis.metrics.growthPotential}</span>
    </div>
    ` : ''}
    
    ${analysis.keyFindings?.length ? `
    <div class="section">
        <h2>📌 Principais Descobertas</h2>
        <ul>
            ${analysis.keyFindings.map(f => `<li>${f}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    ${analysis.opportunities?.length ? `
    <div class="section">
        <h2>🚀 Oportunidades</h2>
        <ul>
            ${analysis.opportunities.map(o => `<li>${o}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    ${analysis.risks?.length ? `
    <div class="section">
        <h2>⚠️ Riscos</h2>
        ${analysis.risks.map(r => `<div class="risk">${r}</div>`).join('')}
    </div>
    ` : ''}
    
    ${analysis.recommendations?.length ? `
    <div class="section">
        <h2>💡 Recomendações</h2>
        ${analysis.recommendations.map(r => `
            <div class="recommendation">
                <strong>${r.action}</strong>
                <br><small>Prioridade: ${r.priority} | Impacto: ${r.impact}</small>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
        Relatório gerado automaticamente por Elite Finder AI Insights
    </footer>
</body>
</html>`;
}
