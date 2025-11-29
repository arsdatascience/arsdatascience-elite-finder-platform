const workflowQueue = require('../queues/n8nWorkflowQueue');
const { client } = require('../metrics/n8nMetrics');

const getDashboardStats = async (req, res) => {
    try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            workflowQueue.getWaitingCount(),
            workflowQueue.getActiveCount(),
            workflowQueue.getCompletedCount(),
            workflowQueue.getFailedCount(),
            workflowQueue.getDelayedCount()
        ]);

        // Tenta obter métricas em JSON se suportado, senão retorna raw
        let metricsData = {};
        try {
            metricsData = await client.register.getMetricsAsJSON();
        } catch (e) {
            // Fallback se getMetricsAsJSON não estiver disponível na versão
            metricsData = { error: 'JSON metrics not supported' };
        }

        res.json({
            queue: {
                waiting, active, completed, failed, delayed
            },
            metrics: metricsData,
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getDashboardStats };
