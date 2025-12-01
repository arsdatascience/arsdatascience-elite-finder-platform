const db = require('../db');

const syncCampaignCosts = async () => {
    console.log('Starting Campaign Cost Sync...');
    try {
        // 1. Buscar categoria de Ads ou criar se não existir
        let adsCategory = await db.query("SELECT id FROM financial_categories WHERE name = 'Mídia Paga (Ads)' LIMIT 1");
        let categoryId;

        if (adsCategory.rows.length === 0) {
            // Tenta buscar qualquer categoria de despesa ou cria uma padrão
            const newCat = await db.query(`
                INSERT INTO financial_categories (tenant_id, name, type, color) 
                VALUES (NULL, 'Mídia Paga (Ads)', 'expense', '#ef4444') 
                RETURNING id
            `);
            categoryId = newCat.rows[0].id;
        } else {
            categoryId = adsCategory.rows[0].id;
        }

        // 2. Buscar campanhas com gasto > 0
        const campaigns = await db.query("SELECT * FROM campaigns WHERE spent > 0");

        for (const campaign of campaigns.rows) {
            // Verificar quanto já foi lançado financeiramente para esta campanha
            const financialRecord = await db.query(`
                SELECT SUM(amount) as total_launched 
                FROM financial_transactions 
                WHERE campaign_id = $1 AND type = 'expense'
            `, [campaign.id]);

            const totalLaunched = Number(financialRecord.rows[0].total_launched) || 0;
            const currentSpent = Number(campaign.spent);

            // Se o gasto atual for maior que o lançado, lança a diferença
            if (currentSpent > totalLaunched) {
                const amountToLaunch = currentSpent - totalLaunched;

                // Tentar obter tenant_id do client
                let tenantId = null;
                if (campaign.client_id) {
                    const clientRes = await db.query("SELECT tenant_id FROM clients WHERE id = $1", [campaign.client_id]);
                    if (clientRes.rows.length > 0) tenantId = clientRes.rows[0].tenant_id;
                }

                await db.query(`
                    INSERT INTO financial_transactions (
                        tenant_id, description, amount, type, category_id, 
                        campaign_id, client_id, date, status, notes
                    ) VALUES ($1, $2, $3, 'expense', $4, $5, $6, NOW(), 'paid', 'Lançamento automático de custo de campanha')
                `, [
                    tenantId,
                    `Custo de Mídia - ${campaign.name}`,
                    amountToLaunch,
                    categoryId,
                    campaign.id,
                    campaign.client_id
                ]);

                console.log(`Launched cost for campaign ${campaign.id}: R$ ${amountToLaunch}`);
            }
        }
        console.log('Campaign Cost Sync Completed.');
        return { success: true, message: 'Sync completed' };
    } catch (error) {
        console.error('Error in financial sync:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { syncCampaignCosts };
