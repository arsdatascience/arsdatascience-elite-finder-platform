const pool = require('./database');
const crypto = require('crypto');

/**
 * List approval requests (Inbox or Sent)
 */
exports.getApprovals = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { type } = req.query; // 'pending', 'history', 'sent'

        let query = `
            SELECT ar.*, 
                   a.name as asset_name, a.file_url as asset_url,
                   u.name as requester_name
            FROM approval_requests ar
            LEFT JOIN assets a ON ar.asset_id = a.id
            LEFT JOIN users u ON ar.requester_id = u.id
            WHERE ar.tenant_id = $1
        `;

        if (type === 'sent') {
            query += ` AND ar.requester_id = ${req.user.id}`;
        } else if (type === 'pending') {
            query += ` AND ar.status = 'pending'`;
            // In a real system, we'd filter by reviewer logic (if user is the reviewer)
            // For now, admins/managers see all pending for the tenant?
        }

        query += ` ORDER BY ar.created_at DESC`;

        const result = await pool.query(query, [tenantId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching approvals:', error);
        res.status(500).json({ error: 'Failed to fetch approvals' });
    }
};

/**
 * Create an approval request
 */
exports.createApproval = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const userId = req.user.id;
        const { title, notes, asset_id, social_post_id } = req.body;

        // Generate a public review token
        const reviewToken = crypto.randomBytes(32).toString('hex');

        const result = await pool.query(
            `INSERT INTO approval_requests (tenant_id, requester_id, title, notes, asset_id, social_post_id, review_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [tenantId, userId, title, notes, asset_id, social_post_id, reviewToken]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating approval:', error);
        res.status(500).json({ error: 'Failed to create approval request' });
    }
};

/**
 * Review an approval request (Approve/Reject)
 */
exports.reviewApproval = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const { id } = req.params;
        const { status, comments } = req.body; // 'approved', 'rejected', 'changes_requested'

        const validStatuses = ['approved', 'rejected', 'changes_requested'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            `UPDATE approval_requests 
             SET status = $1, reviewer_comments = $2, reviewed_at = NOW()
             WHERE id = $3 AND tenant_id = $4 RETURNING *`,
            [status, comments, id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Approval not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error reviewing approval:', error);
        res.status(500).json({ error: 'Failed to review request' });
    }
};

/**
 * Public Review (No Auth required, uses Token)
 */
exports.publicReview = async (req, res) => {
    try {
        const { token } = req.params;
        const { status, comments } = req.body;

        const validStatuses = ['approved', 'rejected', 'changes_requested'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            `UPDATE approval_requests 
             SET status = $1, reviewer_comments = $2, reviewed_at = NOW()
             WHERE review_token = $3 RETURNING *`,
            [status, comments, token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired token' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error performing public review:', error);
        res.status(500).json({ error: 'Failed to review request' });
    }
};

/**
 * Get Public Approval Details (for the review page)
 */
exports.getPublicApproval = async (req, res) => {
    try {
        const { token } = req.params;

        const result = await pool.query(
            `SELECT ar.*, 
                   a.name as asset_name, a.file_url as asset_url, a.file_type,
                   u.name as requester_name
             FROM approval_requests ar
             LEFT JOIN assets a ON ar.asset_id = a.id
             LEFT JOIN users u ON ar.requester_id = u.id
             WHERE ar.review_token = $1`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid token' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching public approval:', error);
        res.status(500).json({ error: 'Failed to fetch approval details' });
    }
};
