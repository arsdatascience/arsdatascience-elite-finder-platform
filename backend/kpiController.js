/**
 * KPI Controller - Agency KPIs, NPS, CSAT, Retention, Financial Metrics
 */

const db = require('./database');
const pool = db;
const opsPool = db.opsPool;
const { getTenantScope } = require('./utils/tenantSecurity');

const kpiController = {
    // ==========================================
    // DASHBOARD SUMMARY
    // ==========================================
    getDashboardKPIs: async (req, res) => {
        const { isSuperAdmin, tenantId } = getTenantScope(req);
        const { period = 'month' } = req.query;

        try {
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // 1. NPS Average
            const npsResult = await pool.query(`
                SELECT 
                    AVG(score) as avg_score,
                    COUNT(*) as total_responses,
                    COUNT(*) FILTER (WHERE score >= 9) as promoters,
                    COUNT(*) FILTER (WHERE score >= 7 AND score < 9) as passives,
                    COUNT(*) FILTER (WHERE score < 7) as detractors
                FROM nps_surveys
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND responded_at >= $2 AND responded_at <= $3
            `, [tenantId, startDate, endDate]);

            const nps = npsResult.rows[0];
            const npsScore = nps.total_responses > 0
                ? Math.round(((nps.promoters - nps.detractors) / nps.total_responses) * 100)
                : null;

            // 2. CSAT Average
            const csatResult = await pool.query(`
                SELECT 
                    AVG(score) as avg_score,
                    COUNT(*) as total_responses,
                    COUNT(*) FILTER (WHERE score >= 4) as satisfied
                FROM csat_surveys
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND responded_at >= $2 AND responded_at <= $3
            `, [tenantId, startDate, endDate]);

            const csat = csatResult.rows[0];
            const csatPercent = csat.total_responses > 0
                ? Math.round((csat.satisfied / csat.total_responses) * 100)
                : null;

            // 3. Client Retention (compare to previous month)
            const retentionResult = await pool.query(`
                SELECT 
                    COUNT(DISTINCT client_id) as current_clients
                FROM client_health_metrics
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND period_year = $2 AND period_month = $3
            `, [tenantId, now.getFullYear(), now.getMonth() + 1]);

            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const prevRetention = await pool.query(`
                SELECT COUNT(DISTINCT client_id) as prev_clients
                FROM client_health_metrics
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND period_year = $2 AND period_month = $3
            `, [tenantId, prevMonth.getFullYear(), prevMonth.getMonth() + 1]);

            const currentClients = parseInt(retentionResult.rows[0]?.current_clients) || 0;
            const prevClients = parseInt(prevRetention.rows[0]?.prev_clients) || currentClients;
            const retentionRate = prevClients > 0
                ? Math.round((currentClients / prevClients) * 100)
                : 100;

            // 4. Financial KPIs (from Maglev/OPS DB)
            const financialResult = await opsPool.query(`
                SELECT 
                    SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) as revenue,
                    SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as expenses
                FROM financial_transactions
                WHERE date >= $1 AND date <= $2
            `, [startDate, endDate]);

            const revenue = parseFloat(financialResult.rows[0]?.revenue) || 0;
            const expenses = parseFloat(financialResult.rows[0]?.expenses) || 0;
            const profitMargin = revenue > 0 ? Math.round(((revenue - expenses) / revenue) * 100) : 0;

            // 5. CLV and CAC
            const clvResult = await pool.query(`
                SELECT 
                    AVG(lifetime_value) as avg_clv,
                    COUNT(*) as total_customers
                FROM unified_customers
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND lifetime_value > 0
            `, [tenantId]);

            const avgCLV = parseFloat(clvResult.rows[0]?.avg_clv) || 0;

            // 6. Journey Stage Distribution
            const journeyResult = await pool.query(`
                SELECT 
                    current_stage,
                    COUNT(*) as count
                FROM unified_customers
                WHERE (tenant_id = $1 OR $1 IS NULL)
                GROUP BY current_stage
            `, [tenantId]);

            // 7. Employee Happiness (last week)
            const happinessResult = await pool.query(`
                SELECT 
                    AVG(happiness_score) as avg_happiness,
                    COUNT(*) as responses
                FROM employee_happiness
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND submitted_at >= NOW() - INTERVAL '7 days'
            `, [tenantId]);

            res.json({
                success: true,
                period: { start: startDate, end: endDate },
                kpis: {
                    // Relationship & Satisfaction
                    nps: {
                        score: npsScore,
                        responses: parseInt(nps.total_responses) || 0,
                        promoters: parseInt(nps.promoters) || 0,
                        passives: parseInt(nps.passives) || 0,
                        detractors: parseInt(nps.detractors) || 0,
                        benchmark: 50 // Industry average
                    },
                    csat: {
                        score: parseFloat(csat.avg_score)?.toFixed(1) || null,
                        percent: csatPercent,
                        responses: parseInt(csat.total_responses) || 0,
                        benchmark: 80 // Target 80%+
                    },
                    retention: {
                        rate: retentionRate,
                        currentClients,
                        benchmark: 75 // Target 75%+
                    },

                    // Financial Health
                    mrr: revenue, // Simplified as monthly revenue
                    profitMargin: profitMargin,
                    clv: avgCLV,
                    cac: 0, // TODO: Calculate from marketing spend
                    ltvCacRatio: avgCLV > 0 ? (avgCLV / 1000).toFixed(1) : 0, // Placeholder

                    // Operational
                    revenue,
                    expenses,
                    profit: revenue - expenses,

                    // Journey
                    journeyDistribution: journeyResult.rows,

                    // Team
                    employeeHappiness: parseFloat(happinessResult.rows[0]?.avg_happiness)?.toFixed(1) || null,
                    happinessResponses: parseInt(happinessResult.rows[0]?.responses) || 0
                }
            });

        } catch (error) {
            console.error('Error getting dashboard KPIs:', error);
            res.status(500).json({ success: false, error: 'Failed to load KPIs' });
        }
    },

    // ==========================================
    // NPS SURVEYS
    // ==========================================
    submitNPSSurvey: async (req, res) => {
        const { clientId, customerId, score, feedback, touchpoint, projectId } = req.body;
        const tenantId = req.user?.tenant_id;

        try {
            if (score < 0 || score > 10) {
                return res.status(400).json({ success: false, error: 'Score must be 0-10' });
            }

            const result = await pool.query(`
                INSERT INTO nps_surveys (tenant_id, client_id, customer_id, score, feedback, touchpoint, project_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [tenantId, clientId, customerId, score, feedback, touchpoint, projectId]);

            res.json({ success: true, survey: result.rows[0] });
        } catch (error) {
            console.error('Error submitting NPS:', error);
            res.status(500).json({ success: false, error: 'Failed to submit survey' });
        }
    },

    getNPSHistory: async (req, res) => {
        const { isSuperAdmin, tenantId } = getTenantScope(req);
        const { months = 6 } = req.query;

        try {
            const result = await pool.query(`
                SELECT 
                    DATE_TRUNC('month', responded_at) as month,
                    AVG(score) as avg_score,
                    COUNT(*) as responses,
                    COUNT(*) FILTER (WHERE score >= 9) as promoters,
                    COUNT(*) FILTER (WHERE score < 7) as detractors
                FROM nps_surveys
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND responded_at >= NOW() - INTERVAL '${parseInt(months)} months'
                GROUP BY DATE_TRUNC('month', responded_at)
                ORDER BY month DESC
            `, [tenantId]);

            const history = result.rows.map(row => ({
                month: row.month,
                npsScore: row.responses > 0
                    ? Math.round(((row.promoters - row.detractors) / row.responses) * 100)
                    : null,
                avgScore: parseFloat(row.avg_score).toFixed(1),
                responses: parseInt(row.responses)
            }));

            res.json({ success: true, history });
        } catch (error) {
            console.error('Error getting NPS history:', error);
            res.status(500).json({ success: false, error: 'Failed to load history' });
        }
    },

    // ==========================================
    // CSAT SURVEYS
    // ==========================================
    submitCSATSurvey: async (req, res) => {
        const { clientId, customerId, score, feedback, category, projectId, campaignId } = req.body;
        const tenantId = req.user?.tenant_id;

        try {
            if (score < 1 || score > 5) {
                return res.status(400).json({ success: false, error: 'Score must be 1-5' });
            }

            const result = await pool.query(`
                INSERT INTO csat_surveys (tenant_id, client_id, customer_id, score, feedback, category, project_id, campaign_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [tenantId, clientId, customerId, score, feedback, category, projectId, campaignId]);

            res.json({ success: true, survey: result.rows[0] });
        } catch (error) {
            console.error('Error submitting CSAT:', error);
            res.status(500).json({ success: false, error: 'Failed to submit survey' });
        }
    },

    // ==========================================
    // EMPLOYEE HAPPINESS
    // ==========================================
    submitHappinessSurvey: async (req, res) => {
        const { happinessScore, workloadScore, feedback, areasToImprove, isAnonymous = true } = req.body;
        const tenantId = req.user?.tenant_id;
        const userId = isAnonymous ? null : req.user?.id;

        try {
            // Get current week start
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const result = await pool.query(`
                INSERT INTO employee_happiness (tenant_id, user_id, happiness_score, workload_score, feedback, areas_to_improve, survey_week, is_anonymous)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [tenantId, userId, happinessScore, workloadScore, feedback, areasToImprove, weekStart, isAnonymous]);

            res.json({ success: true, survey: result.rows[0] });
        } catch (error) {
            console.error('Error submitting happiness survey:', error);
            res.status(500).json({ success: false, error: 'Failed to submit survey' });
        }
    },

    getHappinessHistory: async (req, res) => {
        const { isSuperAdmin, tenantId } = getTenantScope(req);
        const { weeks = 12 } = req.query;

        try {
            const result = await pool.query(`
                SELECT 
                    survey_week,
                    AVG(happiness_score) as avg_happiness,
                    AVG(workload_score) as avg_workload,
                    COUNT(*) as responses
                FROM employee_happiness
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND survey_week >= NOW() - INTERVAL '${parseInt(weeks)} weeks'
                GROUP BY survey_week
                ORDER BY survey_week DESC
            `, [tenantId]);

            res.json({
                success: true,
                history: result.rows.map(r => ({
                    week: r.survey_week,
                    happiness: parseFloat(r.avg_happiness).toFixed(1),
                    workload: parseFloat(r.avg_workload)?.toFixed(1),
                    responses: parseInt(r.responses)
                }))
            });
        } catch (error) {
            console.error('Error getting happiness history:', error);
            res.status(500).json({ success: false, error: 'Failed to load history' });
        }
    },

    // ==========================================
    // CLIENT JOURNEY ANALYTICS
    // ==========================================
    getUnifiedCustomers: async (req, res) => {
        const { isSuperAdmin, tenantId } = getTenantScope(req);
        const { page = 1, limit = 20, search, stage } = req.query;
        const offset = (page - 1) * limit;

        try {
            let query = `
                SELECT * FROM unified_customers
                WHERE (tenant_id = $1 OR $1 IS NULL)
            `;
            const params = [tenantId];
            let paramCount = 1;

            if (search) {
                paramCount++;
                query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
                params.push(`%${search}%`);
            }

            if (stage && stage !== 'all') {
                paramCount++;
                query += ` AND current_stage = $${paramCount}`;
                params.push(stage);
            }

            // Count total
            const countResult = await pool.query(query.replace('SELECT *', 'SELECT COUNT(*)'), params);
            const total = parseInt(countResult.rows[0].count);

            // Fetch data
            query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            res.json({
                success: true,
                customers: result.rows,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Error listing unified customers:', error);
            res.status(500).json({ success: false, error: 'Failed to list customers' });
        }
    },

    getUnifiedCustomerDetails: async (req, res) => {
        const { isSuperAdmin, tenantId } = getTenantScope(req);
        const { id } = req.params;

        try {
            // 1. Get Core Customer Data
            const customerResult = await pool.query(`
                SELECT * FROM unified_customers 
                WHERE id = $1 AND (tenant_id = $2 OR $2 IS NULL)
            `, [id, tenantId]);

            if (customerResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Customer not found' });
            }

            const customer = customerResult.rows[0];

            // 2. Get Identity Graph (Linked identifiers)
            const identityResult = await pool.query(`
                SELECT identifier_type, identifier_value, created_at, confidence_score, source
                FROM identity_graph
                WHERE unified_customer_id = $1
                ORDER BY created_at DESC
            `, [id]);

            // 3. Get Interaction Timeline
            const interactionResult = await pool.query(`
                SELECT * 
                FROM customer_interactions
                WHERE unified_customer_id = $1
                ORDER BY created_at DESC
                LIMIT 50
            `, [id]);

            // 4. Get Journey Context
            const journeyResult = await pool.query(`
                SELECT * 
                FROM customer_journeys
                WHERE unified_customer_id = $1
                ORDER BY start_date DESC
            `, [id]);

            res.json({
                success: true,
                customer: customer,
                identityGraph: identityResult.rows,
                timeline: interactionResult.rows,
                journeys: journeyResult.rows
            });

        } catch (error) {
            console.error('Error getting customer details:', error);
            res.status(500).json({ success: false, error: 'Failed to get customer details' });
        }
    },

    getJourneyAnalytics: async (req, res) => {
        const { isSuperAdmin, tenantId } = getTenantScope(req);

        try {
            // Journey Stage Distribution
            const stageResult = await pool.query(`
                SELECT 
                    current_stage,
                    COUNT(*) as count,
                    AVG(total_touchpoints) as avg_touchpoints,
                    AVG(lifetime_value) as avg_ltv
                FROM unified_customers
                WHERE (tenant_id = $1 OR $1 IS NULL)
                GROUP BY current_stage
            `, [tenantId]);

            // Channel Mix (last 30 days)
            const channelResult = await pool.query(`
                SELECT 
                    channel,
                    interaction_type,
                    COUNT(*) as count
                FROM customer_interactions
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND created_at >= NOW() - INTERVAL '30 days'
                GROUP BY channel, interaction_type
                ORDER BY count DESC
            `, [tenantId]);

            // Top Conversion Paths
            const pathResult = await pool.query(`
                SELECT 
                    conversion_path,
                    COUNT(*) as conversions,
                    SUM(conversion_value) as total_value
                FROM conversion_events
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND converted_at >= NOW() - INTERVAL '30 days'
                GROUP BY conversion_path
                ORDER BY conversions DESC
                LIMIT 10
            `, [tenantId]);

            // Active Journeys
            const journeysResult = await pool.query(`
                SELECT 
                    journey_type,
                    status,
                    COUNT(*) as count
                FROM customer_journeys
                WHERE (tenant_id = $1 OR $1 IS NULL)
                GROUP BY journey_type, status
            `, [tenantId]);

            res.json({
                success: true,
                stages: stageResult.rows.map(r => ({
                    stage: r.current_stage,
                    count: parseInt(r.count),
                    avgTouchpoints: parseFloat(r.avg_touchpoints)?.toFixed(1),
                    avgLTV: parseFloat(r.avg_ltv)?.toFixed(2)
                })),
                channelMix: channelResult.rows,
                topPaths: pathResult.rows.map(r => ({
                    path: r.conversion_path,
                    conversions: parseInt(r.conversions),
                    value: parseFloat(r.total_value)
                })),
                journeys: journeysResult.rows
            });

        } catch (error) {
            console.error('Error getting journey analytics:', error);
            res.status(500).json({ success: false, error: 'Failed to load analytics' });
        }
    }
};

module.exports = kpiController;
