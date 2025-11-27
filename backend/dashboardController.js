const db = require('./database');

/**
 * Get Dashboard KPIs
 * Agrega dados de campanhas e leads para mostrar métricas principais.
 */
const getKPIs = async (req, res) => {
    const { client, platform } = req.query;

    try {
        // 1. Total Investido (spent)
        const spentQuery = await db.query('SELECT SUM(spent) as total_spent FROM campaigns');
        const totalSpent = parseFloat(spentQuery.rows[0].total_spent || 0);

        // 2. Receita Total (leads ganhos)
        // Assumindo que leads com status 'won' ou 'fechado' geram receita
        const revenueQuery = await db.query("SELECT SUM(value) as total_revenue FROM leads WHERE status IN ('won', 'closed', 'venda')");
        const totalRevenue = parseFloat(revenueQuery.rows[0].total_revenue || 0);

        // 3. Total Leads
        const leadsQuery = await db.query('SELECT COUNT(*) as total_leads FROM leads');
        const totalLeads = parseInt(leadsQuery.rows[0].total_leads || 0);

        // 4. ROAS
        const roas = totalSpent > 0 ? (totalRevenue / totalSpent).toFixed(2) : 0;

        // Se não houver dados, retornar mocks para visualização (conforme solicitado "caso nao tenha crie")
        if (totalSpent === 0 && totalRevenue === 0) {
            return res.json([
                { label: 'Investimento Total', value: 'R$ 45.2k', change: 12.5, trend: 'up' },
                { label: 'Receita Gerada', value: 'R$ 182.5k', change: 8.2, trend: 'up' },
                { label: 'ROAS Médio', value: '4.2x', change: -2.1, trend: 'down' },
                { label: 'Total de Leads', value: '1,245', change: 15.3, trend: 'up' }
            ]);
        }

        res.json([
            { label: 'Investimento Total', value: `R$ ${(totalSpent / 1000).toFixed(1)}k`, change: 0, trend: 'neutral' },
            { label: 'Receita Gerada', value: `R$ ${(totalRevenue / 1000).toFixed(1)}k`, change: 0, trend: 'neutral' },
            { label: 'ROAS Médio', value: `${roas}x`, change: 0, trend: 'neutral' },
            { label: 'Total de Leads', value: totalLeads.toString(), change: 0, trend: 'neutral' }
        ]);

    } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({ error: 'Erro ao buscar KPIs' });
    }
};

/**
 * Get Chart Data (Evolution)
 * Retorna dados para o gráfico de área (Google vs Meta vs Receita).
 * Como não temos tabela de histórico diário, vamos gerar dados baseados nas campanhas ou mockar se vazio.
 */
const getChartData = async (req, res) => {
    try {
        // Verificar se temos campanhas
        const campaignsCheck = await db.query('SELECT COUNT(*) as count FROM campaigns');

        if (parseInt(campaignsCheck.rows[0].count) === 0) {
            // Retornar dados mockados realistas para demonstração
            const mockData = [
                { name: 'Jan', google_spend: 4000, meta_spend: 2400, google_revenue: 12000, meta_revenue: 8000, total_revenue: 20000 },
                { name: 'Fev', google_spend: 3000, meta_spend: 1398, google_revenue: 10000, meta_revenue: 5000, total_revenue: 15000 },
                { name: 'Mar', google_spend: 2000, meta_spend: 9800, google_revenue: 8000, meta_revenue: 22000, total_revenue: 30000 },
                { name: 'Abr', google_spend: 2780, meta_spend: 3908, google_revenue: 9500, meta_revenue: 11000, total_revenue: 20500 },
                { name: 'Mai', google_spend: 1890, meta_spend: 4800, google_revenue: 7000, meta_revenue: 14000, total_revenue: 21000 },
                { name: 'Jun', google_spend: 2390, meta_spend: 3800, google_revenue: 8500, meta_revenue: 12000, total_revenue: 20500 },
                { name: 'Jul', google_spend: 3490, meta_spend: 4300, google_revenue: 11000, meta_revenue: 13000, total_revenue: 24000 },
            ];
            return res.json(mockData);
        }

        // Se tiver dados, tentar agrupar (simplificado pois falta tabela de histórico)
        // Aqui retornamos o mock pois a estrutura atual não suporta histórico real
        // TODO: Criar tabela campaign_daily_stats para dados reais
        const mockData = [
            { name: 'Jan', google_spend: 4000, meta_spend: 2400, google_revenue: 12000, meta_revenue: 8000, total_revenue: 20000 },
            { name: 'Fev', google_spend: 3000, meta_spend: 1398, google_revenue: 10000, meta_revenue: 5000, total_revenue: 15000 },
            { name: 'Mar', google_spend: 2000, meta_spend: 9800, google_revenue: 8000, meta_revenue: 22000, total_revenue: 30000 },
            { name: 'Abr', google_spend: 2780, meta_spend: 3908, google_revenue: 9500, meta_revenue: 11000, total_revenue: 20500 },
            { name: 'Mai', google_spend: 1890, meta_spend: 4800, google_revenue: 7000, meta_revenue: 14000, total_revenue: 21000 },
            { name: 'Jun', google_spend: 2390, meta_spend: 3800, google_revenue: 8500, meta_revenue: 12000, total_revenue: 20500 },
            { name: 'Jul', google_spend: 3490, meta_spend: 4300, google_revenue: 11000, meta_revenue: 13000, total_revenue: 24000 },
        ];
        res.json(mockData);

    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do gráfico' });
    }
};

/**
 * Get Funnel Data
 * Retorna contagem de leads por etapa do funil.
 */
const getFunnelData = async (req, res) => {
    try {
        // Buscar contagem real do banco
        const result = await db.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM leads
            GROUP BY status
        `);

        // Mapear status para etapas do funil
        // Assumindo status: new, contacted, qualified, proposal, won
        const counts = result.rows.reduce((acc, row) => {
            acc[row.status] = parseInt(row.count);
            return acc;
        }, {});

        // Se vazio, retornar mock
        if (result.rows.length === 0) {
            return res.json([
                { stage: 'Impressões', google: 45000, meta: 52000 },
                { stage: 'Cliques', google: 3200, meta: 4100 },
                { stage: 'Leads', google: 450, meta: 380 },
                { stage: 'Vendas', google: 85, meta: 62 },
            ]);
        }

        // Construir resposta com dados reais (aproximados pois leads não têm origem google/meta explícita na tabela simplificada, apenas 'source')
        // Vamos tentar inferir source
        const googleLeads = await db.query("SELECT COUNT(*) as count FROM leads WHERE source ILIKE '%google%'");
        const metaLeads = await db.query("SELECT COUNT(*) as count FROM leads WHERE source ILIKE '%facebook%' OR source ILIKE '%instagram%' OR source ILIKE '%meta%'");

        res.json([
            { stage: 'Impressões', google: 45000, meta: 52000 }, // Dados de topo de funil geralmente vêm de API de anúncios, não do banco local
            { stage: 'Cliques', google: 3200, meta: 4100 },
            { stage: 'Leads', google: parseInt(googleLeads.rows[0].count), meta: parseInt(metaLeads.rows[0].count) },
            { stage: 'Vendas', google: Math.floor(parseInt(googleLeads.rows[0].count) * 0.2), meta: Math.floor(parseInt(metaLeads.rows[0].count) * 0.15) }, // Estimativa de conversão
        ]);

    } catch (error) {
        console.error('Error fetching funnel data:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do funil' });
    }
};

/**
 * Get Device Data
 * Retorna estatísticas de dispositivos.
 */
const getDeviceData = async (req, res) => {
    try {
        const result = await db.query('SELECT device_type as name, percentage as value FROM device_stats');

        if (result.rows.length === 0) {
            return res.json([
                { name: 'Mobile', value: 65, color: '#3b82f6' },
                { name: 'Desktop', value: 25, color: '#10b981' },
                { name: 'Tablet', value: 10, color: '#f59e0b' },
            ]);
        }

        // Adicionar cores
        const dataWithColors = result.rows.map(row => ({
            ...row,
            value: parseFloat(row.value),
            color: row.name === 'Mobile' ? '#3b82f6' : row.name === 'Desktop' ? '#10b981' : '#f59e0b'
        }));

        res.json(dataWithColors);

    } catch (error) {
        console.error('Error fetching device data:', error);
        res.status(500).json({ error: 'Erro ao buscar dados de dispositivos' });
    }
};

module.exports = {
    getKPIs,
    getChartData,
    getFunnelData,
    getDeviceData
};
