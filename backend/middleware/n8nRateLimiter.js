const rateLimit = require('express-rate-limit');
const n8nLogger = require('../utils/n8nLogger');

const n8nRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // limite de 100 requisições por IP
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
