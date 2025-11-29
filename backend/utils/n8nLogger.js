const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

const n8nLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'n8n-integration' },
    transports: [
        // Log de erros
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/n8n-error.log'),
            level: 'error'
        }),
        // Log geral
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/n8n-combined.log')
        }),
        // Console (para Railway logs)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

module.exports = n8nLogger;
