const { Queue, Worker } = require('bullmq');
const redis = require('./redisClient');

// Nome da fila principal
const QUEUE_NAME = 'jobsQueue';

// Configuração da conexão Redis para o BullMQ
// O BullMQ precisa de uma conexão dedicada ou configuração compatível
const connection = redis;

// Inicializar a Fila (Producer)
const jobsQueue = new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100, // Manter apenas os últimos 100 jobs completados
        removeOnFail: 200      // Manter os últimos 200 falhados para debug
    }
});

// Função para criar um Worker (Consumer)
// Deve ser chamada apenas no processo que vai processar os jobs (jobProcessor.js)
const createWorker = (processorFunction) => {
    const worker = new Worker(QUEUE_NAME, processorFunction, {
        connection,
        concurrency: 5 // Processar até 5 jobs simultaneamente
    });

    worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} (${job.name}) completado!`);
    });

    worker.on('failed', (job, err) => {
        console.error(`❌ Job ${job.id} (${job.name}) falhou: ${err.message}`);
    });

    return worker;
};

module.exports = {
    jobsQueue,
    createWorker
};
