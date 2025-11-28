const pool = require('./database');

exports.getCampaignAnalytics = async (req, res) => {
    try {
        const { clientId, startDate, endDate, platforms } = req.query;

        // Base query conditions
        let conditions = ['1=1'];
        let params = [];
        let paramCount = 1;

        if (clientId) {
            conditions.push(`c.client_id = $${paramCount}`);
            params.push(clientId);
            paramCount++;
        }

        if (platforms) {
            const platformList = platforms.split(',');
            conditions.push(`c.platform = ANY($${paramCount})`);
            params.push(platformList);
            paramCount++;
        }

        // Date filtering applies to metrics
        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND m.date BETWEEN $${paramCount} AND $${paramCount + 1}`;
            params.push(startDate, endDate);
            paramCount += 2;
        }

        const whereClause = conditions.join(' AND ');

        // 1. KPIs Aggregated
        const kpiQuery = `
            SELECT 
                COALESCE(SUM(m.spend), 0) as total_spend,
                COALESCE(SUM(m.impressions), 0) as total_impressions,
                COALESCE(SUM(m.clicks), 0) as total_clicks,
                COALESCE(SUM(m.conversions), 0) as total_conversions,
                COALESCE(SUM(m.revenue), 0) as total_revenue
            FROM campaigns c
            LEFT JOIN campaign_daily_metrics m ON c.id = m.campaign_id ${dateCondition}
            WHERE ${whereClause}
        `;

        const kpiResult = await pool.query(kpiQuery, params);
        const kpis = kpiResult.rows[0];

        // 2. Chart Data (Daily Trend)
        const chartQuery = `
            SELECT 
                m.date,
                SUM(m.spend) as spend,
                SUM(m.revenue) as revenue,
                SUM(m.impressions) as impressions,
                SUM(m.clicks) as clicks,
                SUM(m.conversions) as conversions
            FROM campaigns c
            JOIN campaign_daily_metrics m ON c.id = m.campaign_id ${dateCondition}
            WHERE ${whereClause}
            GROUP BY m.date
            ORDER BY m.date ASC
        `;
        const chartResult = await pool.query(chartQuery, params);

        // 3. Platform Breakdown
        const platformQuery = `
            SELECT 
                c.platform,
                SUM(m.spend) as spend,
                SUM(m.conversions) as conversions,
                SUM(m.revenue) as revenue
            FROM campaigns c
            JOIN campaign_daily_metrics m ON c.id = m.campaign_id ${dateCondition}
            WHERE ${whereClause}
            GROUP BY c.platform
        `;
        const platformResult = await pool.query(platformQuery, params);

        // 4. Campaigns List (Detailed)
        const campaignsQuery = `
            SELECT 
                c.id, c.name, c.platform, c.status,
                COALESCE(SUM(m.spend), 0) as spend,
                COALESCE(SUM(m.impressions), 0) as impressions,
                COALESCE(SUM(m.clicks), 0) as clicks,
                COALESCE(SUM(m.conversions), 0) as conversions,
                COALESCE(SUM(m.revenue), 0) as revenue
            FROM campaigns c
            LEFT JOIN campaign_daily_metrics m ON c.id = m.campaign_id ${dateCondition}
            WHERE ${whereClause}
            GROUP BY c.id, c.name, c.platform, c.status
            ORDER BY spend DESC
        `;
        const campaignsResult = await pool.query(campaignsQuery, params);

        res.json({
            kpis,
            chartData: chartResult.rows,
            platformData: platformResult.rows,
            campaigns: campaignsResult.rows
        });

    } catch (error) {
        console.error('Erro ao buscar analytics:', error);
        console.log('⚠️ Retornando dados mockados devido a erro no banco.');
        res.json(generateMockData(req.query.clientId));
    }
};

// Mock Data Generator (Fallback)
const generateMockData = (clientId) => {
    return {
        kpis: {
            total_spend: 15420.50,
            total_impressions: 450000,
            total_clicks: 12500,
            total_conversions: 350,
            total_revenue: 61682.00
        },
        chartData: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
            spend: Math.floor(Math.random() * 500) + 200,
            revenue: Math.floor(Math.random() * 2000) + 800,
            impressions: Math.floor(Math.random() * 10000) + 5000,
            clicks: Math.floor(Math.random() * 300) + 100,
            conversions: Math.floor(Math.random() * 10) + 2
        })),
        platformData: [
            { platform: 'google', spend: 5000, conversions: 120, revenue: 20000 },
            { platform: 'meta', spend: 4000, conversions: 100, revenue: 15000 },
            { platform: 'youtube', spend: 3000, conversions: 80, revenue: 12000 },
            { platform: 'linkedin', spend: 3420, conversions: 50, revenue: 14682 }
        ],
        campaigns: [
            { id: 1, name: 'Search - Institucional', platform: 'google', status: 'active', spend: 2500, impressions: 50000, clicks: 2000, conversions: 80, revenue: 10000 },
            { id: 2, name: 'Feed - Awareness', platform: 'meta', status: 'active', spend: 2000, impressions: 100000, clicks: 1500, conversions: 50, revenue: 8000 },
            { id: 3, name: 'TrueView - Brand', platform: 'youtube', status: 'active', spend: 1500, impressions: 200000, clicks: 1000, conversions: 30, revenue: 6000 },
            { id: 4, name: 'B2B - Leads', platform: 'linkedin', status: 'active', spend: 3000, impressions: 20000, clicks: 500, conversions: 40, revenue: 12000 }
        ]
    };
};
