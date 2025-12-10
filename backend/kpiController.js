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
        const { period = 'month', clientId, stage } = req.query;

        // Debug log for troubleshooting 500 errors
        console.log('📊 KPI Dashboard Request:', {
            query: req.query,
            tenant: tenantId,
            user: req.user?.id
        });

        try {
            const now = new Date();
            // SAFE PARSING: Check for empty string or null before parsing
            const startDateStr = req.query.startDate;
            const endDateStr = req.query.endDate;

            const startDate = (startDateStr && startDateStr !== 'null' && startDateStr !== 'undefined' && startDateStr !== '')
                ? new Date(startDateStr)
                : new Date(now.getFullYear(), now.getMonth(), 1);

            const endDate = (endDateStr && endDateStr !== 'null' && endDateStr !== 'undefined' && endDateStr !== '')
                ? new Date(endDateStr)
                : new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // Validate dates are valid (if invalid string passed)
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error(`Invalid date format provided: start=${startDateStr}, end=${endDateStr}`);
            }

            // Helper to build client filter
            const clientFilter = (clientId && clientId !== 'all') ? 'AND client_id = $4' : 'AND ($4::text IS NULL OR TRUE)';
            const stageFilterQuery = (stage && stage !== 'all') ? 'AND current_stage = $5' : 'AND ($5::text IS NULL OR TRUE)';

            // Params for standard queries [tenantId, startDate, endDate, clientId, stage]
            // ERROR FIX: Postgres throws error if we pass more params than used in query placeholders.
            // We must construct specific param arrays for each query.

            const baseParams = [tenantId, startDate, endDate]; // $1, $2, $3 (Common)

            // 1. NPS Average (Uses $1, $2, $3... and maybe $4 if client filter)
            // Query logic: ... WHERE (tenant_id = $1...) AND ... ${clientFilter}
            // clientFilter uses $4. stageFilter uses $5.
            // NPS only uses clientFilter ($4). It DOES NOT usage stageFilter ($5).
            const npsParams = [...baseParams];
            if (clientId && clientId !== 'all') {
                npsParams.push(clientId); // $4
            } else {
                npsParams.push(null); // $4 (dummy for OR $4 IS NULL)
            }
            // NPS does NOT use $5, so do NOT push it.

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
                  ${clientFilter}
            `, npsParams);

            const nps = npsResult.rows[0];
            const npsScore = nps.total_responses > 0
                ? Math.round(((nps.promoters - nps.detractors) / nps.total_responses) * 100)
                : null;

            // 2. CSAT Average (Uses $1, $2, $3, $4)
            const csatParams = [...npsParams]; // Same params as NPS (client filter supported)
            const csatResult = await pool.query(`
                SELECT 
                    AVG(score) as avg_score,
                    COUNT(*) as total_responses,
                    COUNT(*) FILTER (WHERE score >= 4) as satisfied
                FROM csat_surveys
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND responded_at >= $2 AND responded_at <= $3
                  ${clientFilter}
            `, csatParams);

            const csat = csatResult.rows[0];
            const csatPercent = csat.total_responses > 0
                ? Math.round((csat.satisfied / csat.total_responses) * 100)
                : null;

            // 3. Client Retention
            // Note: client_health_metrics uses client_id.
            const retentionQuery = `
                WITH prev_month_clients AS (
                    SELECT DISTINCT client_id
                    FROM client_health_metrics
                    WHERE (tenant_id = $1 OR $1 IS NULL)
                      AND period_year = $2 AND period_month = $3
                      ${(clientId && clientId !== 'all') ? 'AND client_id = $6' : ''}
                ),
                current_month_clients AS (
                    SELECT DISTINCT client_id
                    FROM client_health_metrics
                    WHERE (tenant_id = $1 OR $1 IS NULL)
                      AND period_year = $4 AND period_month = $5
                      ${(clientId && clientId !== 'all') ? 'AND client_id = $6' : ''}
                )
                SELECT 
                    (SELECT COUNT(*) FROM prev_month_clients) as prev_count,
                    (SELECT COUNT(*) 
                     FROM prev_month_clients p
                     JOIN current_month_clients c ON p.client_id = c.client_id
                    ) as retained_count,
                    (SELECT COUNT(*) FROM current_month_clients) as current_total
            `;

            const prevDate = new Date(startDate);
            prevDate.setMonth(prevDate.getMonth() - 1);

            const retentionParams = [
                tenantId,
                prevDate.getFullYear(), prevDate.getMonth() + 1,
                startDate.getFullYear(), startDate.getMonth() + 1
            ];

            if (clientId && clientId !== 'all') {
                retentionParams.push(clientId); // $6
            }
            // Retention query explicitly constructs params internally, so it was likely fine IF filtering,
            // but let's check if my previous code logic was correct. 
            // Previous code:
            /*
             const retentionParams = [tenantId, prevY, prevM, currY, currM];
             if (client) retentionParams.push(clientId);
            */
            // This one looks correct because it constructed specific array. 
            // BUT wait, in the loop before it was part of `queryParams` which was failing others.

            const rResult = await pool.query(retentionQuery, retentionParams);

            const stats = rResult.rows[0];
            const prevCount = parseInt(stats.prev_count) || 0;
            const retainedCount = parseInt(stats.retained_count) || 0;
            const currentTotal = parseInt(stats.current_total) || 0;
            const retentionRate = prevCount > 0 ? Math.round((retainedCount / prevCount) * 100) : 100;

            // 4. Financial KPIs
            let revenue = 0;
            let expenses = 0;
            let profitMargin = 0;

            try {
                // Uses $1, $2 only
                const financialResult = await opsPool.query(`
                    SELECT 
                        SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) as revenue,
                        SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as expenses
                    FROM financial_transactions
                    WHERE date >= $1 AND date <= $2
                `, [startDate, endDate]); // Already using specific array [startDate, endDate]

                revenue = parseFloat(financialResult.rows[0]?.revenue) || 0;
                expenses = parseFloat(financialResult.rows[0]?.expenses) || 0;
                profitMargin = revenue > 0 ? Math.round(((revenue - expenses) / revenue) * 100) : 0;
            } catch (finErr) {
                console.warn('⚠️ Financial KPIs validation failed (ignoring):', finErr.message);
                // metrics remain 0
            }

            // 5. CLV (Unified Customers)
            // Uses $1 (tenant), clientFilter ($4), stageFilter ($5)
            // This needs the FULL 5 params because it MIGHT use $5
            const clvParams = [tenantId, startDate, endDate]; // $1, $2, $3 (unused but index matters for $4/$5?)
            // WAIT. If query uses $1, $4, $5... queryParams MUST have indices 0, 3, 4 matched.
            // Postgres uses positional arguments provided in the array. $1 = arr[0], $2 = arr[1].
            // If the query text says `$4`, it requires at least 4 items in array.
            // BUT if query text does NOT use $2 and $3, can we pass them?
            // "bind message supplies 5 parameters, prepared statement requires 3" -> this implies it looks at MAX ($N) token?
            // No, it likely iterates the SQL and counts unique placeholders or highest placeholder.
            // If highest is $5, we need 5 params.
            // If highest is $3 (NPS), providing 5 params crashes it.

            // For CLV: Uses $1, $4, $5. (Does it use $2, $3? "lifetime_value > 0" no date filter in provided code).
            // Line 148: `WHERE (tenant_id = $1 OR $1 IS NULL) ... ${clientFilter} ${stageFilterQuery}`
            // clientFilter is `AND client_id = $4`.
            // So query has holes: $1, $4, $5. Missing $2, $3.
            // Postgres generally creates prepared statement parameters based on usage. 
            // If $2 and $3 are NOT in the string, then the PREPARED STATEMENT expects 3 params? Or does it verify indices?
            // "prepared statement requires 3 parameters" suggests it counted 3 distinct placeholders ($1, $4, $5 -> 3 args?).
            // Or does it expect contiguous?
            // It's safer to rewrite filters to use consecutive numbers $2, $3.

            // LET'S REWRITE FILTERS for CLV to be standard $1, $2, $3.

            let clvQuery = `
                SELECT 
                    AVG(lifetime_value) as avg_clv,
                    COUNT(*) as total_customers
                FROM unified_customers
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND lifetime_value > 0
            `;
            const clvQueryArgs = [tenantId];
            let clvIdx = 2; // Next param index

            if (clientId && clientId !== 'all') {
                clvQuery += ` AND client_id = $${clvIdx}`;
                clvQueryArgs.push(clientId);
                clvIdx++;
            }
            if (stage && stage !== 'all') {
                clvQuery += ` AND current_stage = $${clvIdx}`;
                clvQueryArgs.push(stage);
                clvIdx++;
            }

            const clvResult = await pool.query(clvQuery, clvQueryArgs);
            const avgCLV = parseFloat(clvResult.rows[0]?.avg_clv) || 0;

            // 6. Journey Stage Distribution
            // Uses $1. clientFilter uses ... wait.
            // Original code used `clientFilter` string which hardcoded `$4`.
            // If we regenerate the query string dynamically, we avoid gaps.

            let journeyQuery = `
                SELECT 
                    current_stage,
                    COUNT(*) as count
                FROM unified_customers
                WHERE (tenant_id = $1 OR $1 IS NULL)
            `;
            const journeyArgs = [tenantId];
            let journeyIdx = 2;

            if (clientId && clientId !== 'all') {
                journeyQuery += ` AND client_id = $${journeyIdx}`;
                journeyArgs.push(clientId);
                journeyIdx++;
            }
            // Group by
            journeyQuery += ` GROUP BY current_stage`;

            const journeyResult = await pool.query(journeyQuery, journeyArgs);

            // 7. Employee Happiness
            // Uses $1, $2, $3.
            const happinessResult = await pool.query(`
                SELECT 
                    AVG(happiness_score) as avg_happiness,
                    COUNT(*) as responses
                FROM employee_happiness
                WHERE (tenant_id = $1 OR $1 IS NULL)
                  AND submitted_at >= $2 AND submitted_at <= $3
            `, [tenantId, startDate, endDate]); // Specific array

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
                        currentClients: currentTotal,
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
            console.error('🔥 CRITICAL ERROR in getDashboardKPIs:', error.message);
            console.error(error.stack);
            res.status(500).json({ success: false, error: 'Failed to load KPIs: ' + error.message });
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
        const { page = 1, limit = 20, search, stage, clientId, startDate, endDate } = req.query;
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

            if (clientId && clientId !== 'all') {
                paramCount++;
                query += ` AND client_id = $${paramCount}`;
                params.push(clientId);
            }

            if (startDate) {
                paramCount++;
                query += ` AND last_interaction >= $${paramCount}`;
                params.push(startDate);
            }

            if (endDate) {
                paramCount++;
                query += ` AND last_interaction <= $${paramCount}`;
                params.push(endDate);
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

        console.log(`🔍 fetching details for customer ${id} with tenant ${tenantId} (superAdmin: ${isSuperAdmin})`);

        try {
            // 1. Get Core Customer Data
            // Allow superadmins to see any customer, otherwise enforce tenant
            const query = isSuperAdmin
                ? 'SELECT * FROM unified_customers WHERE id = $1'
                : 'SELECT * FROM unified_customers WHERE id = $1 AND (tenant_id = $2 OR $2 IS NULL)';

            const params = isSuperAdmin ? [id] : [id, tenantId];

            const customerResult = await pool.query(query, params);

            if (customerResult.rows.length === 0) {
                console.warn(`❌ Customer ${id} not found for this tenant scope.`);
                return res.status(404).json({ success: false, error: 'Customer not found' });
            }

            const customer = customerResult.rows[0];

            // 2. Get Identity Graph (Linked identifiers)
            const identityResult = await pool.query(`
                SELECT identifier_type, identifier_value, created_at, confidence_score, source_channel as source
                FROM identity_graph
                WHERE customer_id = $1
                ORDER BY created_at DESC
            `, [id]);

            // 3. Get Interaction Timeline
            const interactionResult = await pool.query(`
                SELECT * 
                FROM customer_interactions
                WHERE customer_id = $1
                ORDER BY created_at DESC
                LIMIT 50
            `, [id]);

            // 4. Get Journey Context
            const journeyResult = await pool.query(`
                SELECT * 
                FROM customer_journeys
                WHERE customer_id = $1
                ORDER BY created_at DESC
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
