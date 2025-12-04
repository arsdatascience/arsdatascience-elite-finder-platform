const Redis = require('ioredis');

const getRedisClient = () => {
    // Opções obrigatórias para BullMQ e estabilidade
    const defaultOptions = {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    };

    // 1. Tentar URL Pública (Estabilidade / Fallback)
    if (process.env.REDIS_PUBLIC_URL) {
        console.log('🔌 Usando REDIS_PUBLIC_URL para conexão (Fallback)...');
        return new Redis(process.env.REDIS_PUBLIC_URL, defaultOptions);
    }

    // 2. Tentar URL Interna/Padrão
    if (process.env.REDIS_URL) {
        console.log('🔌 Usando REDIS_URL para conexão...');
        return new Redis(process.env.REDIS_URL, defaultOptions);
    }

    // 3. Fallback para variáveis individuais
    console.log('⚠️  REDIS_PUBLIC_URL e REDIS_URL não encontrados. Usando variáveis de host/port (Fallback para Localhost)...');
    return new Redis({
        host: process.env.REDISHOST || 'localhost',
        port: process.env.REDISPORT || 6379,
        password: process.env.REDISPASSWORD || undefined,
        username: process.env.REDISUSER || undefined,
        family: process.env.RAILWAY_ENVIRONMENT ? 6 : 4, // Tentativa de manter IPv6 se cair aqui
        ...defaultOptions
    });
};

const redis = getRedisClient();

redis.on('connect', () => {
    console.log('✅ Conectado ao Redis com sucesso!');
});

redis.on('error', (err) => {
    // Mascarar senha no log de erro
    const safeError = err.message ? err.message.replace(/:[^@]+@/, ':***@') : err;
    console.error('❌ Erro na conexão com Redis:', safeError);
});

// Exportar a instância padrão (para compatibilidade com código antigo)
// E anexar a factory function para quem precisar de novas conexões (BullMQ)
redis.getRedisClient = getRedisClient;
module.exports = redis;
