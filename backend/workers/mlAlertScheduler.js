/**
 * ML Alert Scheduler
 * Runs daily analyses and sends proactive alerts via WhatsApp
 */

const cron = require('node-cron');
const db = require('../database');
const mlAnalysisService = require('../services/mlAnalysisService');
const mlResponseFormatter = require('../services/mlResponseFormatter');

class MLAlertScheduler {
    constructor() {
        this.isRunning = false;
        this.lastRunTime = null;
    }

    /**
     * Start the scheduler
     */
    start() {
        if (!process.env.ENABLE_ML_AGENT || process.env.ENABLE_ML_AGENT !== 'true') {
            console.log('⏸️ ML Alert Scheduler disabled (ENABLE_ML_AGENT !== true)');
            return;
        }

        // Run daily at 9 AM (local server time)
        cron.schedule('0 9 * * *', async () => {
            await this.runDailyAnalyses();
        });

        // Run weekly summary every Monday at 8 AM
        cron.schedule('0 8 * * 1', async () => {
            await this.runWeeklySummary();
        });

        console.log('✅ ML Alert Scheduler started');
        console.log('   📅 Daily analyses: 9:00 AM');
        console.log('   📅 Weekly summary: Monday 8:00 AM');
    }

    /**
     * Run daily analyses for all active clients
     */
    async runDailyAnalyses() {
        if (this.isRunning) {
            console.log('⚠️ ML Scheduler already running, skipping...');
            return;
        }

        this.isRunning = true;
        this.lastRunTime = new Date();

        console.log('🚀 Starting daily ML analyses...');

        try {
            // Get all active clients with plan_status = 'active'
            const result = await db.query(`
        SELECT id, name, phone, email 
        FROM clients 
        WHERE plan_status = 'active' 
          AND phone IS NOT NULL
        LIMIT 100
      `);

            const clients = result.rows;
            console.log(`📊 Found ${clients.length} active clients for daily analysis`);

            let successCount = 0;
            let errorCount = 0;

            for (const client of clients) {
                try {
                    // 1. Check for anomalies
                    const anomalies = await mlAnalysisService.anomalyDetection(client.id, { days: 7 });

                    if (anomalies.anomalies && anomalies.anomalies.length > 0) {
                        await this.sendAlert(client, 'anomaly', anomalies);
                        successCount++;
                    }

                    // 2. Send daily summary (optional - can be enabled per client)
                    // Uncomment below to enable daily summaries for all clients
                    // const summary = await mlAnalysisService.dashboardSummary(client.id);
                    // await this.sendAlert(client, 'daily_summary', summary);

                    // Add small delay to avoid overwhelming the system
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (clientError) {
                    console.warn(`⚠️ Error analyzing client ${client.id}:`, clientError.message);
                    errorCount++;
                }
            }

            console.log(`✅ Daily analyses complete: ${successCount} alerts sent, ${errorCount} errors`);

        } catch (error) {
            console.error('❌ Error in runDailyAnalyses:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Run weekly summary for all active clients
     */
    async runWeeklySummary() {
        console.log('📊 Starting weekly ML summary...');

        try {
            const result = await db.query(`
        SELECT id, name, phone, email 
        FROM clients 
        WHERE plan_status = 'active' 
          AND phone IS NOT NULL
        LIMIT 100
      `);

            const clients = result.rows;
            let successCount = 0;

            for (const client of clients) {
                try {
                    const summary = await mlAnalysisService.dashboardSummary(client.id);
                    await this.sendAlert(client, 'weekly_summary', summary);
                    successCount++;

                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (err) {
                    console.warn(`⚠️ Weekly summary error for client ${client.id}:`, err.message);
                }
            }

            console.log(`✅ Weekly summaries complete: ${successCount} sent`);

        } catch (error) {
            console.error('❌ Error in runWeeklySummary:', error);
        }
    }

    /**
     * Send alert to client via WhatsApp
     */
    async sendAlert(client, type, data) {
        let message;

        switch (type) {
            case 'anomaly':
                message = `🚨 *Alerta Automático*\n\n${mlResponseFormatter.formatAnomalyDetection(data, client.name)}`;
                break;

            case 'daily_summary':
                message = `☀️ *Bom dia, ${client.name.split(' ')[0]}!*\n\n${mlResponseFormatter.formatDashboardSummary(data, client.name)}`;
                break;

            case 'weekly_summary':
                message = `📅 *Resumo Semanal - ${client.name}*\n\n${mlResponseFormatter.formatDashboardSummary({ ...data, period: '7 dias' }, client.name)}`;
                break;

            default:
                console.warn(`Unknown alert type: ${type}`);
                return;
        }

        // Check if phone is available
        if (!client.phone) {
            console.warn(`Client ${client.id} has no phone number`);
            return;
        }

        // Format phone number (remove non-digits)
        const phoneNumber = client.phone.replace(/\D/g, '');

        if (phoneNumber.length < 10) {
            console.warn(`Invalid phone number for client ${client.id}: ${client.phone}`);
            return;
        }

        try {
            // Try to send via WhatsApp (assuming Evolution API is configured)
            const whatsappService = require('../whatsappController');

            if (whatsappService && typeof whatsappService.sendOutboundMessage === 'function') {
                await whatsappService.sendOutboundMessage({
                    phone: phoneNumber,
                    message,
                    instanceName: process.env.DEFAULT_WHATSAPP_INSTANCE || 'elite-finder'
                });

                console.log(`📱 Alert sent to ${client.name} (${phoneNumber})`);
            } else {
                // Log only if WhatsApp is not available
                console.log(`📧 Would send ${type} alert to ${client.name}: ${message.substring(0, 100)}...`);
            }

            // Log the alert
            await this.logAlert(client.id, type, message);

        } catch (sendError) {
            console.error(`❌ Error sending alert to ${client.id}:`, sendError.message);
        }
    }

    /**
     * Log alert to database
     */
    async logAlert(clientId, alertType, message) {
        try {
            await db.opsQuery(`
        INSERT INTO ml_alerts (client_id, alert_type, message, sent_at)
        VALUES ($1, $2, $3, NOW())
      `, [clientId, alertType, message.substring(0, 1000)]);
        } catch (err) {
            // Table might not exist, just log
            if (process.env.ML_AGENT_DEBUG === 'true') {
                console.warn('Could not log alert:', err.message);
            }
        }
    }

    /**
     * Manually trigger daily analyses (for testing)
     */
    async triggerNow() {
        console.log('🔄 Manually triggering ML analyses...');
        await this.runDailyAnalyses();
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastRunTime: this.lastRunTime,
            enabled: process.env.ENABLE_ML_AGENT === 'true'
        };
    }
}

module.exports = new MLAlertScheduler();
