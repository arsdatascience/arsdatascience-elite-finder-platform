const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// INTEGRATIONS - Get all integrations for a user
// ============================================
const getIntegrations = async (req, res) => {
    const { user_id = 1 } = req.query;
    try {
        const result = await pool.query(
            'SELECT id, platform, status, last_sync, config FROM integrations WHERE user_id = $1 ORDER BY platform',
            [user_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching integrations:', error);
        res.status(500).json({ error: 'Failed to fetch integrations' });
    }
};

// ============================================
// INTEGRATIONS - Connect/Disconnect
// ============================================
const updateIntegrationStatus = async (req, res) => {
    const { id } = req.params;
    const { status, access_token, refresh_token, config } = req.body;

    try {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (status) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }

        if (access_token !== undefined) {
            updates.push(`access_token = $${paramCount++}`);
            values.push(access_token);
        }

        if (refresh_token !== undefined) {
            updates.push(`refresh_token = $${paramCount++}`);
            values.push(refresh_token);
        }

        if (config !== undefined) {
            updates.push(`config = $${paramCount++}`);
            values.push(JSON.stringify(config));
        }

        if (status === 'connected') {
            updates.push(`last_sync = NOW()`);
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const query = `UPDATE integrations SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating integration:', error);
        res.status(500).json({ error: 'Failed to update integration' });
    }
};

// ============================================
// INTEGRATIONS - Sync data from platform
// ============================================
const syncIntegration = async (req, res) => {
    const { id } = req.params;

    try {
        // Get integration details
        const integration = await pool.query('SELECT * FROM integrations WHERE id = $1', [id]);

        if (integration.rows.length === 0) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        const platform = integration.rows[0].platform;

        // Here you would implement actual API calls to each platform
        // For now, we'll just update the last_sync timestamp

        await pool.query(
            'UPDATE integrations SET last_sync = NOW(), updated_at = NOW() WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: `${platform} synchronized successfully`,
            last_sync: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error syncing integration:', error);
        res.status(500).json({ error: 'Failed to sync integration' });
    }
};

// ============================================
// GOOGLE ADS - OAuth callback handler
// ============================================
const handleGoogleAdsCallback = async (req, res) => {
    const { code, state } = req.query;
    const user_id = state; // In production, validate this properly

    try {
        // In production, exchange code for access token with Google OAuth
        // const tokens = await exchangeCodeForTokens(code);

        // For now, simulate successful connection
        await pool.query(
            `UPDATE integrations 
       SET status = 'connected', 
           access_token = $1, 
           last_sync = NOW(),
           updated_at = NOW()
       WHERE user_id = $2 AND platform = 'google_ads'`,
            ['simulated_google_token', user_id]
        );

        res.redirect('/settings?integration=google_ads&status=success');
    } catch (error) {
        console.error('Error handling Google Ads callback:', error);
        res.redirect('/settings?integration=google_ads&status=error');
    }
};

// ============================================
// META ADS - OAuth callback handler
// ============================================
const handleMetaAdsCallback = async (req, res) => {
    const { code, state } = req.query;
    const user_id = state;

    try {
        // In production, exchange code for access token with Meta OAuth
        // const tokens = await exchangeCodeForTokens(code);

        await pool.query(
            `UPDATE integrations 
       SET status = 'connected', 
           access_token = $1, 
           last_sync = NOW(),
           updated_at = NOW()
       WHERE user_id = $2 AND platform = 'meta_ads'`,
            ['simulated_meta_token', user_id]
        );

        res.redirect('/settings?integration=meta_ads&status=success');
    } catch (error) {
        console.error('Error handling Meta Ads callback:', error);
        res.redirect('/settings?integration=meta_ads&status=error');
    }
};

// ============================================
// WHATSAPP - Setup webhook
// ============================================
const setupWhatsAppWebhook = async (req, res) => {
    const { phone_number_id, access_token, verify_token } = req.body;
    const user_id = req.body.user_id || 1;

    try {
        // In production, register webhook with WhatsApp Business API
        // await registerWhatsAppWebhook(phone_number_id, access_token, verify_token);

        await pool.query(
            `UPDATE integrations 
       SET status = 'connected', 
           access_token = $1,
           config = $2,
           last_sync = NOW(),
           updated_at = NOW()
       WHERE user_id = $3 AND platform = 'whatsapp'`,
            [
                access_token,
                JSON.stringify({ phone_number_id, verify_token }),
                user_id
            ]
        );

        res.json({
            success: true,
            message: 'WhatsApp Business API connected successfully'
        });
    } catch (error) {
        console.error('Error setting up WhatsApp:', error);
        res.status(500).json({ error: 'Failed to setup WhatsApp integration' });
    }
};

module.exports = {
    getIntegrations,
    updateIntegrationStatus,
    syncIntegration,
    handleGoogleAdsCallback,
    handleMetaAdsCallback,
    setupWhatsAppWebhook
};
