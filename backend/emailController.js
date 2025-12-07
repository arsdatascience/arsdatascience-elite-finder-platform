/**
 * Email Controller
 * Handles email configuration and sending
 */

const nodemailer = require('nodemailer');
const db = require('./database');

/**
 * Test SMTP connection and send test email
 * POST /api/email/test
 */
const testEmail = async (req, res) => {
    try {
        const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom, smtpFromName, smtpSecure } = req.body;

        if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
            return res.status(400).json({ success: false, error: 'Preencha todos os campos obrigatórios' });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: smtpSecure && smtpPort === '465', // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPassword
            },
            tls: {
                rejectUnauthorized: false // Allow self-signed certificates
            }
        });

        // Verify connection
        await transporter.verify();

        // Send test email
        const mailOptions = {
            from: `"${smtpFromName || 'Elite Finder'}" <${smtpFrom || smtpUser}>`,
            to: smtpUser, // Send to the configured email
            subject: '✅ Teste de Configuração SMTP - Elite Finder',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🎉 Configuração Funcionando!</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">
              Olá! Este é um email de teste do <strong>Elite Finder</strong>.
            </p>
            <p style="font-size: 14px; color: #6b7280;">
              Se você está vendo esta mensagem, significa que a configuração do servidor SMTP está funcionando corretamente.
            </p>
            <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                <strong>Servidor:</strong> ${smtpHost}:${smtpPort}<br>
                <strong>Usuário:</strong> ${smtpUser}<br>
                <strong>Seguro:</strong> ${smtpSecure ? 'Sim (TLS)' : 'Não'}
              </p>
            </div>
          </div>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Email de teste enviado com sucesso!'
        });

    } catch (error) {
        console.error('Email test error:', error);

        let errorMessage = 'Falha na conexão SMTP';
        if (error.code === 'EAUTH') {
            errorMessage = 'Credenciais inválidas. Verifique usuário e senha.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Conexão recusada. Verifique host e porta.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Tempo esgotado. Verifique se o host está acessível.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(400).json({
            success: false,
            error: errorMessage
        });
    }
};

/**
 * Save email configuration
 * POST /api/email/config
 */
const saveConfig = async (req, res) => {
    try {
        const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom, smtpFromName, smtpSecure, userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'Usuário não identificado' });
        }

        // Check if config exists
        const existing = await db.opsQuery(
            'SELECT id FROM email_config WHERE user_id = $1',
            [userId]
        );

        if (existing.rows.length > 0) {
            // Update existing
            await db.opsQuery(`
        UPDATE email_config 
        SET smtp_host = $1, smtp_port = $2, smtp_user = $3, smtp_password = $4, 
            smtp_from = $5, smtp_from_name = $6, smtp_secure = $7, updated_at = NOW()
        WHERE user_id = $8
      `, [smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom, smtpFromName, smtpSecure, userId]);
        } else {
            // Insert new
            await db.opsQuery(`
        INSERT INTO email_config (user_id, smtp_host, smtp_port, smtp_user, smtp_password, smtp_from, smtp_from_name, smtp_secure, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [userId, smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom, smtpFromName, smtpSecure]);
        }

        res.json({ success: true, message: 'Configurações salvas com sucesso' });

    } catch (error) {
        console.error('Save email config error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get email configuration for user
 * GET /api/email/config
 */
const getConfig = async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'Usuário não identificado' });
        }

        const result = await db.opsQuery(
            'SELECT * FROM email_config WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                config: null
            });
        }

        const config = result.rows[0];

        res.json({
            success: true,
            config: {
                smtpHost: config.smtp_host,
                smtpPort: config.smtp_port,
                smtpUser: config.smtp_user,
                smtpPassword: '••••••••', // Mask password
                smtpFrom: config.smtp_from,
                smtpFromName: config.smtp_from_name,
                smtpSecure: config.smtp_secure
            }
        });

    } catch (error) {
        console.error('Get email config error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Send email using stored config
 * POST /api/email/send
 */
const sendEmail = async (req, res) => {
    try {
        const { to, subject, html, text, userId } = req.body;

        // Get config from database
        const configResult = await db.opsQuery(
            'SELECT * FROM email_config WHERE user_id = $1',
            [userId]
        );

        if (configResult.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Configure o email primeiro em Configurações > Email' });
        }

        const config = configResult.rows[0];

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: config.smtp_host,
            port: parseInt(config.smtp_port),
            secure: config.smtp_secure && config.smtp_port === '465',
            auth: {
                user: config.smtp_user,
                pass: config.smtp_password
            }
        });

        // Send email
        const mailOptions = {
            from: `"${config.smtp_from_name || 'Elite Finder'}" <${config.smtp_from || config.smtp_user}>`,
            to,
            subject,
            html,
            text
        };

        const info = await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    testEmail,
    saveConfig,
    getConfig,
    sendEmail
};
