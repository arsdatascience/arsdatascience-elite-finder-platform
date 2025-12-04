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

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });

        // FIX: Fetch fresh user data from DB to ensure role/tenant updates are applied immediately
        // without requiring re-login.
        try {
            const { rows } = await require('../db').query(
                'SELECT id, name, email, role, tenant_id FROM users WHERE id = $1',
                [decoded.id]
            );

            if (rows.length === 0) {
                return res.status(403).json({ error: 'Forbidden: User not found' });
            }

            req.user = rows[0];
            next();
        } catch (dbError) {
            console.error('Auth Middleware DB Error:', dbError);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
};

module.exports = authenticateToken;
