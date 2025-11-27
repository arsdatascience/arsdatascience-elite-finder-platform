const db = require('./db');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'elite-secret-key-change-me';

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
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role, avatar_url, created_at`,
            [name, email, password_hash, role || 'user']
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

/**
 * Login user.
 * Expected body: { email, password }
 */
const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(`[Login Attempt] Email: ${email}`);

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            console.log('[Login Fail] User not found');
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        console.log(`[Login] User found: ${user.id}, Role: ${user.role}`);
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            console.log('[Login Fail] Password mismatch');
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url
            }
        });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    upload,
    updateAvatar,
    createUser,
    login
};
