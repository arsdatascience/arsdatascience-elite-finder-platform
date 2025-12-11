/**
 * Cross-Database Controller
 * 
 * Este controller demonstra como consultar dados de ambos os bancos de dados:
 * - Crossover (Core): Dados de clientes, tenants, usuários
 * - Maglev (OPS): Dados de ML, analytics, operações
 * 
 * ARQUITETURA:
 * - pool = Crossover (Core Database)
 * - pool.opsPool = Maglev (Operations Database)
 */

const pool = require('./database');

const crossDatabaseController = {
    /**
     * Obter visão unificada do cliente com análises ML
     * Combina dados do Crossover (cliente) com Maglev (análises)
     * 
     * GET /api/unified/customer/:customerId
     */
    getUnifiedCustomerView: async (req, res) => {
        try {
            const { customerId } = req.params;
            const tenantId = req.headers['x-tenant-id'] || req.user?.tenant_id;

            // 1. Buscar dados do cliente no Crossover
            const customerResult = await pool.query(`
                SELECT 
                    uc.id,
                    uc.name,
                    uc.email,
                    uc.phone,
                    uc.whatsapp_number,
                    uc.current_stage,
                    uc.last_channel,
                    uc.last_interaction,
                    uc.total_touchpoints,
                    uc.channel_mix,
                    uc.lifetime_value,
                    uc.avg_order_value,
                    uc.purchase_count,
                    uc.tags,
                    uc.segments,
                    uc.created_at
                FROM unified_customers uc
                WHERE uc.id = $1
                ${tenantId ? 'AND uc.tenant_id = $2' : ''}
            `, tenantId ? [customerId, tenantId] : [customerId]);

            if (customerResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Cliente não encontrado'
                });
            }

            const customer = customerResult.rows[0];

            // 2. Buscar interações recentes no Crossover
            const interactionsResult = await pool.query(`
                SELECT 
                    channel,
                    interaction_type,
                    content_summary,
                    created_at
                FROM customer_interactions
                WHERE customer_id = $1
                ORDER BY created_at DESC
                LIMIT 10
            `, [customerId]);

            // 3. Buscar jornadas ativas no Crossover
            const journeysResult = await pool.query(`
                SELECT 
                    journey_type,
                    journey_name,
                    current_step,
                    total_steps,
                    status,
                    next_action_channel,
                    next_action_at
                FROM customer_journeys
                WHERE customer_id = $1
                AND status = 'active'
            `, [customerId]);

            // 4. Buscar análises de ML no Maglev (banco separado)
            const mlCustomerAnalysis = await pool.opsPool.query(`
                SELECT 
                    id,
                    experiment_id,
                    total_customers,
                    churn_rate,
                    clv,
                    retention_rate,
                    nps_score,
                    customer_segments,
                    rfm_analysis,
                    churn_risk_distribution,
                    predicted_churn,
                    created_at
                FROM ml_customer_analytics
                WHERE tenant_id::text = $1
                ORDER BY created_at DESC
                LIMIT 5
            `, [tenantId]);

            // 5. Buscar previsões ML no Maglev
            const mlPredictions = await pool.opsPool.query(`
                SELECT 
                    id,
                    experiment_id,
                    input_data,
                    predictions,
                    confidence,
                    created_at
                FROM ml_predictions
                WHERE tenant_id::text = $1
                ORDER BY created_at DESC
                LIMIT 10
            `, [tenantId]);

            // 6. Buscar análises de vendas no Maglev
            const salesAnalysis = await pool.opsPool.query(`
                SELECT 
                    period,
                    total_sales,
                    predicted_sales,
                    growth_rate,
                    conversion_rate,
                    avg_ticket,
                    created_at
                FROM ml_sales_analytics
                WHERE tenant_id::text = $1
                ORDER BY created_at DESC
                LIMIT 5
            `, [tenantId]);

            // 7. Montar resposta unificada
            res.json({
                success: true,
                data: {
                    // Dados do Crossover (Core)
                    customer: customer,
                    recentInteractions: interactionsResult.rows,
                    activeJourneys: journeysResult.rows,

                    // Dados do Maglev (ML/Analytics)
                    mlAnalytics: {
                        customerAnalysis: mlCustomerAnalysis.rows,
                        predictions: mlPredictions.rows,
                        salesAnalysis: salesAnalysis.rows
                    },

                    // Metadados
                    _meta: {
                        sources: {
                            customer: 'crossover',
                            interactions: 'crossover',
                            journeys: 'crossover',
                            mlAnalytics: 'maglev'
                        },
                        fetchedAt: new Date().toISOString()
                    }
                }
            });

        } catch (error) {
            console.error('Error in unified customer view:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Dashboard de Analytics Cross-Database
     * Agrega métricas de ambos os bancos para visão executiva
     * 
     * GET /api/unified/dashboard
     */
    getUnifiedDashboard: async (req, res) => {
        try {
            const tenantId = req.headers['x-tenant-id'] || req.user?.tenant_id;

            // Crossover: Contagem de clientes
            const customerStats = await pool.query(`
                SELECT 
                    COUNT(*) as total_customers,
                    COUNT(CASE WHEN current_stage = 'decision' THEN 1 END) as decision_stage,
                    COUNT(CASE WHEN current_stage = 'retention' THEN 1 END) as retained,
                    AVG(lifetime_value) as avg_ltv,
                    SUM(lifetime_value) as total_ltv
                FROM unified_customers
                WHERE tenant_id = $1
            `, [tenantId]);

            // Crossover: Interações por canal
            const channelStats = await pool.query(`
                SELECT 
                    channel,
                    COUNT(*) as interaction_count
                FROM customer_interactions
                WHERE tenant_id = $1
                AND created_at > NOW() - INTERVAL '30 days'
                GROUP BY channel
                ORDER BY interaction_count DESC
            `, [tenantId]);

            // Maglev: Últimas análises ML
            const recentMlExperiments = await pool.opsPool.query(`
                SELECT 
                    id,
                    name,
                    algorithm,
                    market_area,
                    status,
                    accuracy,
                    created_at
                FROM ml_experiments
                WHERE tenant_id::text = $1
                ORDER BY created_at DESC
                LIMIT 10
            `, [tenantId]);

            // Maglev: Métricas consolidadas
            const mlMetrics = await pool.opsPool.query(`
                SELECT 
                    'regression' as type,
                    COUNT(*) as total_experiments,
                    AVG(r2_score) as avg_metric
                FROM ml_regression_results
                UNION ALL
                SELECT 
                    'classification' as type,
                    COUNT(*) as total_experiments,
                    AVG(accuracy) as avg_metric
                FROM ml_classification_results
                UNION ALL
                SELECT 
                    'clustering' as type,
                    COUNT(*) as total_experiments,
                    AVG(silhouette_score) as avg_metric
                FROM ml_clustering_results
            `);

            res.json({
                success: true,
                data: {
                    // Crossover Data
                    customers: customerStats.rows[0],
                    channelDistribution: channelStats.rows,

                    // Maglev Data
                    mlExperiments: recentMlExperiments.rows,
                    mlMetrics: mlMetrics.rows,

                    // Meta
                    _meta: {
                        tenantId,
                        generatedAt: new Date().toISOString()
                    }
                }
            });

        } catch (error) {
            console.error('Error in unified dashboard:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Correlacionar cliente com resultados de ML
     * Busca experimentos e previsões associados a um cliente específico
     * 
     * GET /api/unified/customer/:customerId/ml-insights
     */
    getCustomerMlInsights: async (req, res) => {
        try {
            const { customerId } = req.params;
            const tenantId = req.headers['x-tenant-id'] || req.user?.tenant_id;

            // Verificar se cliente existe no Crossover
            const customerCheck = await pool.query(
                'SELECT id, name FROM unified_customers WHERE id = $1',
                [customerId]
            );

            if (customerCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Cliente não encontrado'
                });
            }

            // Buscar previsões deste cliente no Maglev
            const predictions = await pool.opsPool.query(`
                SELECT 
                    p.id,
                    p.predictions,
                    p.confidence,
                    p.created_at,
                    e.name as experiment_name,
                    e.algorithm,
                    e.market_area
                FROM ml_predictions p
                LEFT JOIN ml_experiments e ON p.experiment_id = e.id
                WHERE p.tenant_id::text = $1
                ORDER BY p.created_at DESC
                LIMIT 20
            `, [tenantId]);

            // Buscar segmentação do cliente (clustering)
            const segmentation = await pool.opsPool.query(`
                SELECT 
                    sa.segment_id,
                    sa.analysis_type,
                    sa.algorithm,
                    sa.primary_metric_name,
                    sa.primary_metric_value,
                    sa.chart_data,
                    s.segment_name,
                    s.segment_category
                FROM ml_segment_analytics sa
                LEFT JOIN ml_industry_segments s ON sa.segment_id = s.id
                WHERE sa.tenant_id::text = $1
                ORDER BY sa.analysis_date DESC
                LIMIT 10
            `, [tenantId]);

            res.json({
                success: true,
                data: {
                    customer: customerCheck.rows[0],
                    predictions: predictions.rows,
                    segmentation: segmentation.rows,
                    _meta: {
                        customerId,
                        tenantId,
                        fetchedAt: new Date().toISOString()
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching customer ML insights:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};

module.exports = crossDatabaseController;
