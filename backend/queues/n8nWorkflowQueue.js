const Queue = require('bull');
const n8nLogger = require('../utils/n8nLogger');
const WebhookService = require('../services/webhookService');
const { getRedisClient } = require('../redisClient');

// Configuração da Fila
// Usamos a factory centralizada para garantir a melhor conexão (Public vs Internal)
const client = getRedisClient();
const subscriber = getRedisClient();
const defaultClient = getRedisClient();

// Bull (v3/v4) requer createClient ou instâncias separadas
const workflowQueue = new Queue('n8n-workflows', {
    createClient: function (type) {
        switch (type) {
            case 'client':
                return client;
            case 'subscriber':
                return subscriber;
            default:
                return defaultClient;
        }
    },
    defaultJobOptions: {
        attempts: 3, // Retries do Bull
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 500
    }
});

// Processador da Fila (Worker)
// Concurrency: 10 jobs simultâneos (configurável via env)
const concurrency = parseInt(process.env.N8N_QUEUE_CONCURRENCY || '10');

workflowQueue.process(concurrency, async (job) => {
    const { eventName, payload } = job.data;

    n8nLogger.info(`[Queue] Processando job ${job.id}`, { event: eventName });

    try {
        // Usa o serviço existente que já tem retry e circuit breaker
        await WebhookService.trigger(eventName, payload);
        return { processed: true, timestamp: new Date() };
    } catch (error) {
        n8nLogger.error(`[Queue] Erro no job ${job.id}`, { error: error.message });
        throw error; // Lança erro para o Bull tentar o retry
    }
});

// Eventos da Fila
workflowQueue.on('completed', (job) => {
    n8nLogger.info(`[Queue] Job ${job.id} completado com sucesso`);
});

workflowQueue.on('failed', (job, err) => {
    n8nLogger.error(`[Queue] Job ${job.id} falhou definitivamente após tentativas`, { error: err.message });
});

workflowQueue.on('error', (error) => {
    n8nLogger.error(`[Queue] Erro de conexão com Redis`, { error: error.message });
});

module.exports = workflowQueue;
