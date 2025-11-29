const fs = require('fs');

const CLIENTS_DATA = [
    { name: 'TechSolutions Ltda', type: 'Technology', industry: 'SaaS' },
    { name: 'Dr. Silva Odontologia', type: 'Health', industry: 'Dental' },
    { name: 'Moda & Estilo', type: 'Retail', industry: 'Fashion' }
];

const PLATFORMS = ['google', 'meta', 'youtube', 'linkedin'];
const CAMPAIGN_TEMPLATES = {
    google: ['Search - Institucional', 'Search - Competidores', 'Display - Remarketing', 'PMax - Conversão'],
    meta: ['Feed - Awareness', 'Stories - Conversão', 'Reels - Engajamento', 'Catalog Sales'],
    youtube: ['TrueView - Brand Lift', 'Bumper Ads - Reach', 'In-Stream - Leads'],
    linkedin: ['Sponsored Content - B2B', 'InMail - Decision Makers', 'Text Ads - Sidebar']
};

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min);

let sql = '-- Script de Seed para Campanhas\n';
sql += 'BEGIN;\n\n';

// Limpeza (opcional, cuidado)
// sql += 'DELETE FROM campaigns;\n'; 
// sql += 'DELETE FROM clients WHERE name IN (\'TechSolutions Ltda\', \'Dr. Silva Odontologia\', \'Moda & Estilo\');\n\n';

// Clientes
CLIENTS_DATA.forEach((client, index) => {
    sql += `
    INSERT INTO clients (name, type, industry) 
    VALUES ('${client.name}', '${client.type}', '${client.industry}')
    ON CONFLICT (name) DO NOTHING;
    `;
});

// Vamos assumir que os IDs dos clientes serão recuperados ou inseridos. 
// Para simplificar o SQL estático, vamos usar subqueries para pegar os IDs.

const today = new Date();
const daysToGenerate = 30; // 30 dias para não ficar gigante

CLIENTS_DATA.forEach(client => {
    PLATFORMS.forEach(platform => {
        const templates = CAMPAIGN_TEMPLATES[platform];
        const numCampaigns = 2;

        for (let i = 0; i < numCampaigns; i++) {
            const templateName = templates[i % templates.length];
            const campaignName = `${templateName} - ${new Date().getFullYear()}`;
            const budget = random(1000, 5000);

            // Inserir Campanha e pegar ID (usando CTE para PostgreSQL)
            sql += `
            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, '${campaignName}', '${platform}', 'active', ${budget}, 0, 0, 0, 0
                FROM clients WHERE name = '${client.name}'
                RETURNING id
            )
            `;

            // Métricas Diárias
            let dailyValues = [];
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
                    dailyValues.push(`((SELECT id FROM new_campaign), '${dateStr}', ${impressions}, ${clicks}, ${spend.toFixed(2)}, ${conversions}, ${revenue.toFixed(2)})`);

                    totalSpent += spend;
                    totalConversions += conversions;
                    totalClicks += clicks;
                    totalImpressions += impressions;
                    totalRevenue += revenue;
                }
            }

            if (dailyValues.length > 0) {
                sql += `
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ${dailyValues.join(',\n                    ')}
                )
                `;
            }

            // Atualizar totais da campanha
            const finalCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
            const finalRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

            sql += `
            UPDATE campaigns 
            SET spent = ${totalSpent.toFixed(2)}, conversions = ${totalConversions}, ctr = ${finalCtr.toFixed(2)}, roas = ${finalRoas.toFixed(2)}
            WHERE id = (SELECT id FROM new_campaign);
            \n`;
        }
    });
});

sql += 'COMMIT;\n';

fs.writeFileSync('docs/SEED_CAMPAIGNS.sql', sql);
console.log('Arquivo SQL gerado em docs/SEED_CAMPAIGNS.sql');
