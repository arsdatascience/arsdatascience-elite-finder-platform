const db = require('./db');
const path = require('path');
const multer = require('multer');

// Multer configuration – store uploads in ./uploads (outside src)
const upload = multer({
    dest: path.join(__dirname, '..', 'uploads'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

/**
 * Update user avatar (profile picture).
 * Expects multipart/form-data with field "avatar".
 */
const updateAvatar = async (req, res) => {
    const { id } = req.params; // user id
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    try {
        const avatarPath = `/uploads/${req.file.filename}`; // will be served statically
        await db.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatarPath, id]);
        res.json({ success: true, avatarUrl: avatarPath });
    } catch (err) {
        console.error('Error updating avatar:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

/**
 * Create a new user (admin only).
 * Expected body: { name, email, password_hash, role_id? }
 */
const createUser = async (req, res) => {
    const { name, email, password_hash, role_id } = req.body;
    if (!name || !email || !password_hash) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    try {
        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, role_id) VALUES ($1,$2,$3,$4) RETURNING *`,
            [name, email, password_hash, role_id || 2]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

module.exports = {
    upload,
    updateAvatar,
    createUser,
};
