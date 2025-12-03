const { Pool } = require('pg');
const axios = require('axios');
const { decrypt } = require('../utils/crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Send a WhatsApp message using the configured integration (EvolutionAPI or Official)
 * @param {number} userId - The ID of the user sending the message
 * @param {string} to - The phone number to send to (E.164 format without +)
 * @param {string} content - The text content to send
 */
const sendMessage = async (userId, to, content) => {
    try {
        // 1. Get Integration Config
        // We look for 'whatsapp' (Official) or 'evolution_api'
        const result = await pool.query(
            `SELECT platform, access_token, config FROM integrations 
             WHERE user_id = $1 AND platform IN ('whatsapp', 'evolution_api') AND status = 'connected'
             LIMIT 1`,
            [userId]
        );

        if (result.rows.length === 0) {
            console.warn(`No connected WhatsApp integration found for user ${userId}`);
            return null; // Or throw error
        }

        const integration = result.rows[0];
        const platform = integration.platform;
        const config = integration.config || {};
        const accessToken = integration.access_token ? decrypt(integration.access_token) : null;

        console.log(`Sending WhatsApp message via ${platform} to ${to}`);

        // 2. Send based on Platform
        if (platform === 'evolution_api') {
            return await sendEvolutionApi(config, accessToken, to, content);
        } else if (platform === 'whatsapp') {
            return await sendOfficialApi(config, accessToken, to, content);
        }
    } catch (error) {
        console.error('Error in whatsappService.sendMessage:', error);
        throw error;
    }
};

const sendEvolutionApi = async (config, accessToken, to, content) => {
    // Config expected: { baseUrl: 'https://api.evolution.com', instanceName: 'my-instance' }
    // AccessToken is the API Key

    const baseUrl = config.baseUrl || config.url;
    const instanceName = config.instanceName || config.instance;
    const apiKey = accessToken || config.apiKey;

    if (!baseUrl || !instanceName || !apiKey) {
        throw new Error('Invalid EvolutionAPI configuration. Missing url, instance, or apiKey.');
    }

    // Clean URL
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    // Ensure number has DDI (55 for Brazil) if it seems to be a BR number (10 or 11 digits)
    // This is a heuristic; ideally we should store numbers in E.164
    let formattedTo = to.replace(/\D/g, ''); // Remove non-digits
    if (formattedTo.length === 10 || formattedTo.length === 11) {
        formattedTo = '55' + formattedTo;
    }

    const payload = {
        number: formattedTo,
        options: {
            delay: 1200,
            presence: "composing",
            linkPreview: false
        },
        textMessage: {
            text: content
        }
    };

    console.log('📤 Sending to EvolutionAPI:', JSON.stringify(payload));

    try {
        // EvolutionAPI v2 Endpoint: /message/sendText/{instance}
        const response = await axios.post(
            `${cleanBaseUrl}/message/sendText/${instanceName}`,
            payload,
            {
                headers: {
                    'apikey': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('EvolutionAPI Error:', error.response?.data || error.message);
        // Log full error for debugging
        if (error.response) {
            console.error('EvolutionAPI Response Status:', error.response.status);
            console.error('EvolutionAPI Response Data:', JSON.stringify(error.response.data));
        }
        throw new Error(`EvolutionAPI Failed: ${error.response?.data?.message || error.message}`);
    }
};

const sendOfficialApi = async (config, accessToken, to, content) => {
    // Config expected: { phone_number_id: '...' }
    const phoneNumberId = config.phone_number_id;

    if (!phoneNumberId || !accessToken) {
        throw new Error('Invalid WhatsApp Cloud API configuration. Missing phone_number_id or access_token.');
    }

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: content }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('WhatsApp Cloud API Error:', error.response?.data || error.message);
        throw new Error(`WhatsApp Cloud API Failed: ${error.response?.data?.error?.message || error.message}`);
    }
};

module.exports = { sendMessage };
