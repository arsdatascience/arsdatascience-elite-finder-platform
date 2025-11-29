const axios = require('axios');
const n8nLogger = require('../utils/n8nLogger');

const AlertChannel = {
    SLACK: 'slack',
    EMAIL: 'email', // Via n8n workflow
    PAGERDUTY: 'pagerduty'
};

const AlertSeverity = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
};

const n8nAlerting = {
    async sendAlert(alert) {
        const { title, message, severity = AlertSeverity.INFO, metadata = {} } = alert;

        n8nLogger.info(`[Alerting] Processando alerta: ${title}`, { severity });

        // 1. Slack Alert
        if (process.env.SLACK_WEBHOOK_URL && severity !== AlertSeverity.INFO) {
            try {
                await axios.post(process.env.SLACK_WEBHOOK_URL, {
                    text: `*${severity.toUpperCase()}: ${title}*\n${message}`,
                    attachments: [{
                        fields: Object.entries(metadata).map(([k, v]) => ({
                            title: k,
                            value: String(v),
                            short: true
                        })),
                        color: severity === AlertSeverity.CRITICAL ? '#ff0000' : '#ffa500'
                    }]
                });
            } catch (err) {
                n8nLogger.error('Falha ao enviar alerta Slack', { error: err.message });
            }
        }

        // 2. Email Alert (via n8n workflow de sistema)
        // Se o próprio n8n estiver fora, isso falhará, então é bom ter o Slack como backup
        if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.ERROR) {
            // TODO: Implementar chamada para workflow de email de emergência
        }
    }
};

module.exports = { n8nAlerting, AlertSeverity };
