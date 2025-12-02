const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'elite-secret-key-change-me';

const authenticateToken = (req, res, next) => {
    // 1. Check for API Key (Service-to-Service, e.g., n8n)
    const apiKey = req.headers['x-api-key'];
    if (apiKey && process.env.N8N_API_KEY && apiKey === process.env.N8N_API_KEY) {
        req.user = {
            id: 'service-n8n',
            name: 'N8N Automation',
            role: 'super_admin',
            tenant_id: 1 // Default System Tenant
        };
        return next();
    }

    // 2. Check for JWT (User Session)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;
