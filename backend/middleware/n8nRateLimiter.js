
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../redisClient'); // Import singleton instance
const n8nLogger = require('../utils/n8nLogger');

const n8nRateLimiter = rateLimit({
    store: new RedisStore({
        // Use the existing singleton connection
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 60 * 1000, // 1 minuto
    max: 1000, // limite de 1000 requisições por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'Too many requests from this IP, please try again after a minute'
    },
    handler: (req, res, next, options) => {
        n8nLogger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path
        });
        res.status(options.statusCode).send(options.message);
    }
});

module.exports = n8nRateLimiter;
