const Redis = require('ioredis');

// Configuração flexível para suportar tanto REDIS_URL quanto variáveis separadas
const getRedisConfig = () => {
    if (process.env.REDIS_URL) {
        console.log('🔌 Usando REDIS_URL para conexão...');
        return process.env.REDIS_URL;
    }

    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null, // Necessário para BullMQ
        enableReadyCheck: false
    };
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
