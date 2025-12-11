const pool = require('./database');

const redis = require('./redisClient');

exports.getCampaignAnalytics = async (req, res) => {
    try {
        const { clientId, startDate, endDate, platforms } = req.query;

        // Cache Key Construction
        const cacheKey = `campaign_analytics:${clientId || 'all'}:${startDate || 'all'}:${endDate || 'all'}:${platforms || 'all'}`;

        // 1. Check Cache
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log('⚡ Serving Campaign Analytics from Redis Cache');
            return res.json(JSON.parse(cachedData));
        }

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
                COALESCE(SUM(m.spend), 0) as spend,
                COALESCE(SUM(m.revenue), 0) as revenue,
                COALESCE(SUM(m.impressions), 0) as impressions,
                COALESCE(SUM(m.clicks), 0) as clicks,
                COALESCE(SUM(m.conversions), 0) as conversions
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
                COALESCE(SUM(m.spend), 0) as spend,
                COALESCE(SUM(m.conversions), 0) as conversions,
                COALESCE(SUM(m.revenue), 0) as revenue
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

        const responseData = {
            kpis,
            chartData: chartResult.rows,
            platformData: platformResult.rows,
            campaigns: campaignsResult.rows
        };

        // 2. Save to Cache (10 minutes)
        await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 600);

        res.json(responseData);

    } catch (error) {
        console.error('Erro ao buscar analytics:', error);
        res.status(500).json({ error: 'Failed to fetch campaign analytics' });
    }
};
