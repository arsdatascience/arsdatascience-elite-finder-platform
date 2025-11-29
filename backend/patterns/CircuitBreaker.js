const n8nLogger = require('../utils/n8nLogger');
const { n8nMetrics } = require('../metrics/n8nMetrics');

class CircuitBreaker {
    constructor(options = {}) {
        this.name = options.name || 'default';
        this.threshold = options.threshold || 5; // Falhas consecutivas para abrir
        this.timeout = options.timeout || 60000; // Tempo aberto antes de tentar recuperar

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.nextAttempt = Date.now();

        this.updateMetric();
    }

    updateMetric() {
        if (n8nMetrics) {
            const stateValue = this.state === 'CLOSED' ? 0 : (this.state === 'OPEN' ? 1 : 2);
            n8nMetrics.circuitBreakerState.set({ name: this.name }, stateValue);
        }
    }

    async execute(action) {
        if (this.state === 'OPEN') {
            if (Date.now() > this.nextAttempt) {
                this.state = 'HALF_OPEN';
                this.updateMetric();
                n8nLogger.info(`Circuit Breaker ${this.name} entrando em HALF_OPEN`);
            } else {
                const error = new Error(`Circuit Breaker ${this.name} is OPEN`);
                // Não logamos warn aqui para não floodar logs, apenas debug se necessário
                throw error;
            }
        }

        try {
            const result = await action();
            this.onSuccess();
            return result;
        } catch (err) {
            this.onFailure(err);
            throw err;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            this.updateMetric();
            n8nLogger.info(`Circuit Breaker ${this.name} recuperado (CLOSED)`);
        }
    }

    onFailure(err) {
        this.failureCount++;
        n8nLogger.warn(`Falha no Circuit Breaker ${this.name}`, {
            count: this.failureCount,
            error: err.message
        });

        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
            this.updateMetric();
            n8nLogger.error(`Circuit Breaker ${this.name} ABERTO!`, {
                nextAttempt: new Date(this.nextAttempt).toISOString()
            });
        }
    }
}

module.exports = CircuitBreaker;
