const axios = require('axios');
const pool = require('../database'); // Adapte conforme sua conexão DB
const { encrypt, decrypt } = require('../services/cryptoService');

// Configuration
const CONFIG = {
    facebook: {
        clientId: process.env.META_APP,
        clientSecret: process.env.META_SECRET,
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        // User requested specific domain and legacy path for Facebook App Match
        redirectUri: 'https://marketinghub.aiiam.com.br/api/auth/meta',
        scopes: ['ads_read', 'read_insights', 'pages_show_list']
    },
    google: {
        clientId: process.env.GOOGLE_ID_OAUTH_CLIENT,
        clientSecret: process.env.GOOGLE_OAUTH_SECRET,
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        redirectUri: 'https://marketinghub.aiiam.com.br/api/oauth/google/callback',
        scopes: ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/adwords']
    }
};

const oauthController = {
    // 1. Iniciate Auth Flow
    initiateAuth: (req, res) => {
        const { provider, clientId } = req.query; // clientId is internal client ID

        if (!CONFIG[provider]) {
            return res.status(400).json({ error: 'Provider not supported' });
        }

        const config = CONFIG[provider];
        const state = JSON.stringify({ clientId, provider }); // Pass internal client ID in state

        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            state: state,
            response_type: 'code',
            scope: config.scopes.join(' '),
            access_type: 'offline', // For Google Refresh Token
            prompt: 'consent'
        });

        res.json({ url: `${config.authUrl}?${params.toString()}` });
    },

    // 2. Handle Callback
    handleCallback: async (req, res) => {
        const { code, state } = req.query;
        const { provider } = req.params;

        if (!code || !CONFIG[provider]) {
            return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=invalid_request`);
        }

        try {
            const config = CONFIG[provider];
            const stateData = JSON.parse(state || '{}');
            const internalClientId = stateData.clientId;

            // Exchange Code for Token
            const tokenResponse = await axios.post(config.tokenUrl, {
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code,
                redirect_uri: config.redirectUri,
                grant_type: 'authorization_code'
            });

            const { access_token, refresh_token, expires_in } = tokenResponse.data;
            let expiresAt = new Date();
            if (expires_in) expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

            // Fetch generic account info (optional, just to store name/id)
            let accountId = 'unknown';
            let accountName = provider;

            if (provider === 'facebook') {
                const me = await axios.get(`https://graph.facebook.com/me?access_token=${access_token}`);
                accountName = me.data.name;
                accountId = me.data.id;
            }

            // Upsert into DB
            await pool.query(
                `INSERT INTO integrations (client_id, provider, access_token, refresh_token, expires_at, account_id, account_name)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (client_id, provider) 
                 DO UPDATE SET access_token = EXCLUDED.access_token, 
                               refresh_token = COALESCE(EXCLUDED.refresh_token, integrations.refresh_token),
                               expires_at = EXCLUDED.expires_at,
                               updated_at = NOW()`,
                [
                    internalClientId || 1, // Fallback to 1 or handle error
                    provider,
                    encrypt(access_token),
                    refresh_token ? encrypt(refresh_token) : null,
                    expiresAt,
                    accountId,
                    accountName
                ]
            );

            res.redirect(`${process.env.FRONTEND_URL}/integrations?success=true&provider=${provider}`);

        } catch (error) {
            console.error('OAuth Callback Error:', error.response?.data || error.message);
            res.redirect(`${process.env.FRONTEND_URL}/integrations?error=auth_failed`);
        }
    },

    // 3. List Integrations for a Client
    listIntegrations: async (req, res) => {
        const { clientId } = req.query;
        try {
            const result = await pool.query(
                `SELECT id, provider, account_name, created_at, updated_at 
                 FROM integrations 
                 WHERE client_id = $1`,
                [clientId || 1]
            );
            res.json(result.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Database error' });
        }
    },

    // 4. Disconnect
    disconnect: async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM integrations WHERE id = $1', [id]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    }
};

module.exports = oauthController;
