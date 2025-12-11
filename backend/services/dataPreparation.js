/**
 * Data Preparation Service
 * Extracts and prepares data from client_metrics for ML analysis
 */

const { Pool } = require('pg');

// Crossover DB connection (clients + client_metrics)
const clientsPool = new Pool({
    connectionString: process.env.CLIENTS_DATABASE_URL || process.env.DATABASE_URL
});

class DataPreparationService {

    /**
     * Get client metrics for a date range
     */
    async getClientMetrics(clientId, startDate, endDate, columns = '*') {
        const query = `
            SELECT ${columns}
            FROM client_metrics
            WHERE client_id = $1
            AND date >= $2
            AND date <= $3
            ORDER BY date ASC
        `;
        const result = await clientsPool.query(query, [clientId, startDate, endDate]);
        return result.rows;
    }

    /**
     * Prepare data for Sales Forecast
     */
    async prepareSalesForecastData(clientId, days = 90) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const metrics = await this.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            'date, revenue, orders, visits, conversion_rate, marketing_spend, avg_order_value'
        );

        return {
            timeseries: metrics.map(m => ({
                ds: m.date,
                y: parseFloat(m.revenue) || 0,
                orders: m.orders || 0,
                visits: m.visits || 0,
                conversion_rate: parseFloat(m.conversion_rate) || 0,
                marketing_spend: parseFloat(m.marketing_spend) || 0
            })),
            metadata: {
                client_id: clientId,
                period_days: days,
                records: metrics.length
            }
        };
    }

    /**
     * Prepare data for Churn Prediction
     */
    async prepareChurnData(clientId, days = 180) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const metrics = await this.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            `date, new_customers, returning_customers, churned_customers, 
             nps, csat, avg_rating, customer_support_tickets, 
             avg_customer_lifetime_value, avg_purchase_frequency`
        );

        // Aggregate to customer-level features
        const aggregated = this._aggregateMetrics(metrics, [
            'new_customers', 'returning_customers', 'churned_customers',
            'customer_support_tickets'
        ], ['nps', 'csat', 'avg_rating']);

        return {
            features: aggregated,
            metadata: { client_id: clientId, period_days: days }
        };
    }

    /**
     * Prepare data for Trend Analysis
     */
    async prepareTrendData(clientId, metric, days = 90) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const validMetrics = [
            'revenue', 'orders', 'visits', 'conversion_rate',
            'marketing_spend', 'avg_order_value', 'new_customers'
        ];

        if (!validMetrics.includes(metric)) {
            throw new Error(`Invalid metric: ${metric}. Valid options: ${validMetrics.join(', ')}`);
        }

        const metrics = await this.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            `date, ${metric}`
        );

        return {
            timeseries: metrics.map(m => ({
                date: m.date,
                value: parseFloat(m[metric]) || 0
            })),
            metric,
            metadata: { client_id: clientId, period_days: days }
        };
    }

    /**
     * Prepare data for Customer Segmentation
     */
    async prepareSegmentationData(clientId, days = 365) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const metrics = await this.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            `date, revenue, orders, avg_order_value, 
             new_customers, returning_customers, avg_customer_lifetime_value,
             avg_purchase_frequency`
        );

        // Create customer features for clustering
        const features = {
            total_revenue: metrics.reduce((sum, m) => sum + (parseFloat(m.revenue) || 0), 0),
            total_orders: metrics.reduce((sum, m) => sum + (m.orders || 0), 0),
            avg_order_value: this._average(metrics.map(m => parseFloat(m.avg_order_value) || 0)),
            avg_ltv: this._average(metrics.map(m => parseFloat(m.avg_customer_lifetime_value) || 0)),
            purchase_frequency: this._average(metrics.map(m => parseFloat(m.avg_purchase_frequency) || 0)),
            recency_days: this._calculateRecency(metrics)
        };

        return {
            features,
            metadata: { client_id: clientId, period_days: days }
        };
    }

    /**
     * Prepare data for Anomaly Detection
     */
    async prepareAnomalyData(clientId, days = 90) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const columns = `date, revenue, orders, visits, conversion_rate, 
                         marketing_spend, google_ads_spend, facebook_ads_spend,
                         cart_abandonment_rate, refund_amount`;

        const metrics = await this.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            columns
        );

        return {
            data: metrics.map(m => ({
                date: m.date,
                revenue: parseFloat(m.revenue) || 0,
                orders: m.orders || 0,
                visits: m.visits || 0,
                conversion_rate: parseFloat(m.conversion_rate) || 0,
                marketing_spend: parseFloat(m.marketing_spend) || 0,
                cart_abandonment_rate: parseFloat(m.cart_abandonment_rate) || 0,
                refund_amount: parseFloat(m.refund_amount) || 0
            })),
            metadata: { client_id: clientId, period_days: days }
        };
    }

    /**
     * Prepare data for Prophet Time Series
     */
    async prepareProphetData(clientId, metric, days = 365) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const metrics = await this.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            `date, ${metric}, is_weekend, is_holiday, holiday_name`
        );

        return {
            timeseries: metrics.map(m => ({
                ds: m.date,
                y: parseFloat(m[metric]) || 0,
                is_weekend: m.is_weekend,
                is_holiday: m.is_holiday,
                holiday: m.holiday_name
            })),
            metric,
            metadata: { client_id: clientId, period_days: days }
        };
    }

    /**
     * Prepare Marketing ROI Data
     */
    async prepareMarketingROIData(clientId, days = 90) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const columns = `date, revenue, marketing_spend,
                         google_ads_spend, google_ads_clicks, google_ads_conversions, google_ads_roas,
                         facebook_ads_spend, facebook_clicks, facebook_conversions, facebook_roas,
                         instagram_ads_spend, instagram_ads_conversions, instagram_ads_roas,
                         tiktok_ads_spend, tiktok_ads_conversions, tiktok_ads_roas`;

        const metrics = await this.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            columns
        );

        // Aggregate by channel
        const channels = {
            google_ads: this._aggregateChannel(metrics, 'google_ads'),
            facebook: this._aggregateChannel(metrics, 'facebook'),
            instagram: this._aggregateChannel(metrics, 'instagram_ads'),
            tiktok: this._aggregateChannel(metrics, 'tiktok_ads')
        };

        return {
            channels,
            total_revenue: metrics.reduce((sum, m) => sum + (parseFloat(m.revenue) || 0), 0),
            total_spend: metrics.reduce((sum, m) => sum + (parseFloat(m.marketing_spend) || 0), 0),
            metadata: { client_id: clientId, period_days: days }
        };
    }

    /**
     * Prepare Instagram Performance Data
     */
    async prepareInstagramData(clientId, days = 90) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const instagramColumns = `date, 
            instagram_followers, instagram_followers_gain, instagram_followers_lost,
            instagram_reach, instagram_impressions, instagram_profile_views,
            instagram_likes, instagram_comments, instagram_shares, instagram_saves,
            instagram_engagement, instagram_engagement_rate,
            instagram_stories_posted, instagram_stories_reach, instagram_stories_impressions,
            instagram_posts_published, instagram_posts_reach, instagram_posts_engagement,
            instagram_reels_posted, instagram_reels_views, instagram_reels_likes,
            instagram_revenue`;

        const metrics = await this.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            instagramColumns
        );

        return {
            data: metrics,
            metadata: { client_id: clientId, period_days: days }
        };
    }

    /**
     * Prepare TikTok Performance Data
     */
    async prepareTikTokData(clientId, days = 90) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const tiktokColumns = `date,
            tiktok_followers, tiktok_followers_gain, tiktok_followers_lost,
            tiktok_video_views, tiktok_reach,
            tiktok_likes, tiktok_comments, tiktok_shares, tiktok_saves,
            tiktok_engagement, tiktok_engagement_rate,
            tiktok_videos_posted, tiktok_total_plays, tiktok_avg_watch_time,
            tiktok_completion_rate, tiktok_viral, tiktok_for_you_page,
            tiktok_revenue`;

        const metrics = await this.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            tiktokColumns
        );

        return {
            data: metrics,
            metadata: { client_id: clientId, period_days: days }
        };
    }

    // Helper methods
    _aggregateMetrics(metrics, sumFields, avgFields) {
        const result = {};

        sumFields.forEach(field => {
            result[`total_${field}`] = metrics.reduce((sum, m) => sum + (m[field] || 0), 0);
        });

        avgFields.forEach(field => {
            const values = metrics.map(m => parseFloat(m[field]) || 0).filter(v => v > 0);
            result[`avg_${field}`] = values.length > 0
                ? values.reduce((a, b) => a + b, 0) / values.length
                : 0;
        });

        return result;
    }

    _aggregateChannel(metrics, prefix) {
        const spendField = `${prefix}_spend`;
        const conversionsField = `${prefix}_conversions`;

        const totalSpend = metrics.reduce((sum, m) => sum + (parseFloat(m[spendField]) || 0), 0);
        const totalConversions = metrics.reduce((sum, m) => sum + (m[conversionsField] || 0), 0);

        return {
            spend: totalSpend,
            conversions: totalConversions,
            cpa: totalConversions > 0 ? totalSpend / totalConversions : 0
        };
    }

    _average(values) {
        const filtered = values.filter(v => v > 0);
        return filtered.length > 0 ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0;
    }

    _calculateRecency(metrics) {
        if (!metrics.length) return 999;
        const lastDate = new Date(metrics[metrics.length - 1].date);
        const today = new Date();
        return Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    }
}

module.exports = new DataPreparationService();
