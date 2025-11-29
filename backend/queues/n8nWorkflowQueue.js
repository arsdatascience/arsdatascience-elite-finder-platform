const Queue = require('bull');
const n8nLogger = require('../utils/n8nLogger');
const WebhookService = require('../services/webhookService');

// Configuração da Fila
// Se não houver REDIS_URL, o Bull tentará conectar no localhost padrão
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Mascarar senha para log de segurança
const safeRedisUrl = redisUrl.replace(/:([^@]+)@/, ':****@');
n8nLogger.info(`Inicializando fila n8n-workflows em ${safeRedisUrl}`);

const workflowQueue = new Queue('n8n-workflows', redisUrl, {
    defaultJobOptions: {
        attempts: 3, // Retries do Bull (além dos retries do WebhookService)
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: 100, // Manter apenas últimos 100 jobs completados
        removeOnFail: 500 // Manter últimos 500 falhas para debug
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
