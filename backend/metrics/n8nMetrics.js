const client = require('prom-client');

// Coleta métricas padrão do Node.js (CPU, Memória, Event Loop)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'aiiam_' });

// Métricas customizadas para n8n
const n8nMetrics = {
    webhookCalls: new client.Counter({
        name: 'aiiam_n8n_webhook_calls_total',
        help: 'Total de chamadas de webhook para o n8n',
        labelNames: ['event', 'status']
    }),

    webhookDuration: new client.Histogram({
        name: 'aiiam_n8n_webhook_duration_seconds',
        help: 'Duração das chamadas de webhook em segundos',
        labelNames: ['event'],
        buckets: [0.1, 0.5, 1, 2, 5, 10]
    }),

    retryAttempts: new client.Counter({
        name: 'aiiam_n8n_retry_attempts_total',
        help: 'Total de tentativas de retry',
        labelNames: ['event']
    }),

    circuitBreakerState: new client.Gauge({
        name: 'aiiam_n8n_circuit_breaker_state',
        help: 'Estado atual do Circuit Breaker (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
        labelNames: ['name']
    })
};

module.exports = { client, n8nMetrics };
