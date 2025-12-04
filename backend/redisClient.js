const Redis = require('ioredis');

// Configuração flexível para suportar tanto REDIS_URL quanto variáveis separadas
const getRedisConfig = () => {
    // Prioridade para configuração explícita (Railway Variables)
    const config = {
        host: process.env.REDISHOST || 'localhost',
        port: process.env.REDISPORT || 6379,
        password: process.env.REDISPASSWORD || undefined,
        username: process.env.REDISUSER || undefined,
        maxRetriesPerRequest: null, // Necessário para BullMQ
        enableReadyCheck: false,
        // Railway Internal Network often uses IPv6
        family: process.env.RAILWAY_ENVIRONMENT ? 6 : 4,
    };

    // Se tiver REDIS_URL definida e não tivermos as variáveis separadas, usamos ela
    // Mas a configuração explícita acima é preferível para controlar o 'family'
    if (process.env.REDIS_URL && !process.env.REDISHOST) {
        console.log('🔌 Usando REDIS_URL para conexão...');
        return process.env.REDIS_URL;
    }

    return config;
};

const redis = new Redis(getRedisConfig());

redis.on('connect', () => {
    console.log('✅ Conectado ao Redis com sucesso!');
});

redis.on('error', (err) => {
    // Evitar logar a senha em caso de erro na URL
    const safeError = err.message.replace(/:[^@]+@/, ':***@');
    console.error('❌ Erro na conexão com Redis:', safeError);
});

module.exports = redis;
