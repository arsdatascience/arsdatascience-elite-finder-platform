/**
 * Email Controller
 * Handles email configuration and sending with multiple SMTP support
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
 * Save email configuration (create new or update existing)
 * POST /api/email/config
 */
const saveConfig = async (req, res) => {
    try {
        const {
            id, // If provided, update existing
            name = 'Principal',
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPassword,
            smtpFrom,
            smtpFromName,
            smtpSecure,
            isDefault = false,
            useFor = 'all',
            userId
        } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'Usuário não identificado' });
        }

        if (id) {
            // Update existing config
            await db.opsQuery(`
        UPDATE email_config 
        SET name = $1, smtp_host = $2, smtp_port = $3, smtp_user = $4, smtp_password = $5, 
            smtp_from = $6, smtp_from_name = $7, smtp_secure = $8, is_default = $9, use_for = $10, updated_at = NOW()
        WHERE id = $11 AND user_id = $12
      `, [name, smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom, smtpFromName, smtpSecure, isDefault, useFor, id, userId]);

        } else {
            // Insert new config
            // If this is set as default, remove default from others first
            if (isDefault) {
                await db.opsQuery('UPDATE email_config SET is_default = false WHERE user_id = $1', [userId]);
            }

            await db.opsQuery(`
        INSERT INTO email_config (user_id, name, smtp_host, smtp_port, smtp_user, smtp_password, smtp_from, smtp_from_name, smtp_secure, is_default, use_for, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      `, [userId, name, smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom, smtpFromName, smtpSecure, isDefault, useFor]);
        }

        res.json({ success: true, message: 'Configuração salva com sucesso' });

    } catch (error) {
        console.error('Save email config error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get all email configurations for user
 * GET /api/email/config
 */
const getConfig = async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'Usuário não identificado' });
        }

        const result = await db.opsQuery(
            'SELECT * FROM email_config WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
            [userId]
        );

        const configs = result.rows.map(config => ({
            id: config.id,
            name: config.name,
            smtpHost: config.smtp_host,
            smtpPort: config.smtp_port,
            smtpUser: config.smtp_user,
            smtpPassword: '••••••••', // Mask password
            smtpFrom: config.smtp_from,
            smtpFromName: config.smtp_from_name,
            smtpSecure: config.smtp_secure,
            isDefault: config.is_default,
            useFor: config.use_for,
            createdAt: config.created_at
        }));

        res.json({
            success: true,
            configs
        });

    } catch (error) {
        console.error('Get email config error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Delete email configuration
 * DELETE /api/email/config/:id
 */
const deleteConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.query.userId || req.user?.id;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'Usuário não identificado' });
        }

        await db.opsQuery(
            'DELETE FROM email_config WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({ success: true, message: 'Configuração removida' });

    } catch (error) {
        console.error('Delete email config error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Set config as default
 * PUT /api/email/config/:id/default
 */
const setDefault = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.body.userId || req.user?.id;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'Usuário não identificado' });
        }

        // Remove default from all
        await db.opsQuery('UPDATE email_config SET is_default = false WHERE user_id = $1', [userId]);

        // Set this one as default
        await db.opsQuery('UPDATE email_config SET is_default = true WHERE id = $1 AND user_id = $2', [id, userId]);

        res.json({ success: true, message: 'Configuração definida como padrão' });

    } catch (error) {
        console.error('Set default email config error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Send email using stored config
 * POST /api/email/send
 */
const sendEmail = async (req, res) => {
    try {
        const { to, subject, html, text, userId, configId } = req.body;

        // Get config from database
        let query = 'SELECT * FROM email_config WHERE user_id = $1';
        let params = [userId];

        if (configId) {
            query += ' AND id = $2';
            params.push(configId);
        } else {
            query += ' AND is_default = true';
        }

        const configResult = await db.opsQuery(query, params);

        if (configResult.rows.length === 0) {
            // Try to get any config
            const anyConfig = await db.opsQuery('SELECT * FROM email_config WHERE user_id = $1 LIMIT 1', [userId]);
            if (anyConfig.rows.length === 0) {
                return res.status(400).json({ success: false, error: 'Configure o email primeiro em Configurações > Email' });
            }
            configResult.rows = anyConfig.rows;
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
    deleteConfig,
    setDefault,
    sendEmail
};
