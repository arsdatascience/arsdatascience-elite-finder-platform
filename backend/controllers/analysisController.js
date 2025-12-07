const axios = require('axios');
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://arsanalytics.aiiam.com.br';
const ML_API_KEY = process.env.ML_API_KEY || 'ArsDataScience2025SecureKey!';

const proxyAnalysis = async (req, res) => {
    try {
        const endpoint = req.params.endpoint; // sales-forecast, churn, etc
        const payload = req.body;

        // Proxy to VPS
        const response = await axios.post(`${ML_SERVICE_URL}/api/${endpoint}`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ML_API_KEY}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Analysis Proxy Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(502).json({ error: 'Failed to connect to ML Service' });
        }
    }
};

module.exports = {
    proxyAnalysis
};
