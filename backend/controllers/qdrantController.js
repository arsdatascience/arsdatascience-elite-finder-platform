const qdrantService = require('../services/qdrantService');

const qdrantController = {
    // 1. Get Collections
    getCollections: async (req, res) => {
        try {
            const result = await qdrantService.getCollections();
            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('Controller Error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    },

    // 2. Test Connection
    testConnection: async (req, res) => {
        try {
            const result = await qdrantService.testConnection();
            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            console.error('Controller Error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    }
};

module.exports = qdrantController;
