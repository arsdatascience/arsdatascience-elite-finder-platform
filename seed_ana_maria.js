const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const TARGET_CLIENT_ID = 3; // Ana Maria Silva
const PLATFORMS = ['google', 'meta', 'youtube', 'linkedin'];
const CAMPAIGN_TEMPLATES = {
    google: ['Search - Institucional', 'PMax - Conversão'],
    meta: ['Feed - Awareness', 'Stories - Conversão'],
    youtube: ['TrueView - Brand Lift'],
    linkedin: ['Sponsored Content - B2B']
};

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min);

async function seed() {
    try {
        console.log('🌱 Iniciando seed para Ana Maria Silva...');

        // Limpar dados antigos DESTE cliente
        await pool.query('DELETE FROM campaigns WHERE client_id = $1', [TARGET_CLIENT_ID]);

        const today = new Date();
        const daysToGenerate = 30;

        for (const platform of PLATFORMS) {
            const templates = CAMPAIGN_TEMPLATES[platform];

            for (const templateName of templates) {
                const campaignName = `${templateName} - ${new Date().getFullYear()}`;

                const campRes = await pool.query(
                    'INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions) VALUES ($1, $2, $3, $4, $5, 0, 0, 0, 0) RETURNING id',
                    [TARGET_CLIENT_ID, campaignName, platform, 'active', random(1000, 5000)]
                );
                const campaignId = campRes.rows[0].id;

                let totalSpent = 0;
                let totalConversions = 0;
                let totalClicks = 0;
                let totalImpressions = 0;
                let totalRevenue = 0;

                for (let d = daysToGenerate; d >= 0; d--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - d);
                    const dateStr = date.toISOString().split('T')[0];

                    let baseImpr, baseCpc, baseCvr, baseRoas;
                    switch (platform) {
                        case 'google': baseImpr = 500; baseCpc = 2.5; baseCvr = 0.03; baseRoas = 4; break;
                        case 'meta': baseImpr = 2000; baseCpc = 0.8; baseCvr = 0.015; baseRoas = 3; break;
                        case 'linkedin': baseImpr = 200; baseCpc = 15.0; baseCvr = 0.05; baseRoas = 2.5; break;
                        case 'youtube': baseImpr = 5000; baseCpc = 0.15; baseCvr = 0.005; baseRoas = 2; break;
                    }

                    const variation = randomFloat(0.7, 1.3);
                    const impressions = Math.floor(baseImpr * variation * randomFloat(0.8, 5.0));
                    const clicks = Math.floor(impressions * randomFloat(0.005, 0.03));
                    const spend = clicks * baseCpc * randomFloat(0.9, 1.1);
                    const conversions = Math.floor(clicks * baseCvr * randomFloat(0.8, 1.5));
                    const revenue = spend * baseRoas * randomFloat(0.5, 2.0);

                    if (impressions > 0) {
                        await pool.query(
                            'INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                            [campaignId, dateStr, impressions, clicks, spend, conversions, revenue]
                        );

                        totalSpent += spend;
                        totalConversions += conversions;
                        totalClicks += clicks;
                        totalImpressions += impressions;
                        totalRevenue += revenue;
                    }
                }

                const finalCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
                const finalRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

                await pool.query(
                    'UPDATE campaigns SET spent = $1, conversions = $2, ctr = $3, roas = $4 WHERE id = $5',
                    [totalSpent, totalConversions, finalCtr, finalRoas, campaignId]
                );
            }
        }

        console.log('✨ Seed para Ana Maria Silva concluído!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

seed();
