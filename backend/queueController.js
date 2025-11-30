const db = require('./database');

const getQueueStatus = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT status, COUNT(*) as count 
            FROM jobs 
            GROUP BY status
        `);

        const stats = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0
        };

        result.rows.forEach(row => {
            stats[row.status] = parseInt(row.count);
        });

        // Buscar jobs falhos recentes
        const failedJobs = await db.query(`
            SELECT id, type, error, updated_at 
            FROM jobs 
            WHERE status = 'failed' 
            ORDER BY updated_at DESC 
            LIMIT 5
        `);

        res.json({
            success: true,
            stats,
            recentFailures: failedJobs.rows
        });
    } catch (error) {
        console.error('Error fetching queue status:', error);
        res.status(500).json({ error: 'Database error' });
    }
};

module.exports = { getQueueStatus };
