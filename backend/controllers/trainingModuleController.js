const { pool } = require('../dbController'); // Using the main pool from dbController or similar
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'training');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.mp4', '.webm', '.avi', '.pdf', '.pptx', '.ppt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Formato inválido. Permitido: MP4, WebM, PDF, PPTX'));
        }
    },
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit for videos
});

const ensureTableExists = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS training_modules (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                duration_minutes INTEGER DEFAULT 0,
                difficulty VARCHAR(50) DEFAULT 'Iniciante',
                video_url TEXT,
                thumbnail_url TEXT,
                file_type VARCHAR(50),
                audience VARCHAR(50) DEFAULT 'team',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        // Optional: User Progress table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS training_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                module_id INTEGER REFERENCES training_modules(id),
                progress_percent INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                last_accessed TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, module_id)
            );
        `);
    } catch (err) {
        console.error('Error ensuring training tables exist:', err);
    }
};

// Initialize tables on load (or could be in main init)
ensureTableExists();

const createModule = async (req, res) => {
    try {
        const { title, description, category, duration, difficulty, audience } = req.body;
        const file = req.file;

        if (!title || !file) {
            return res.status(400).json({ success: false, error: 'Título e Arquivo são obrigatórios' });
        }

        const relativePath = `/uploads/training/${file.filename}`;
        // Detect file type for minimal handling (e.g. if PDF, no "duration" really, but UI needs something)
        const fileType = path.extname(file.originalname).toLowerCase().replace('.', '');

        const result = await pool.query(
            `INSERT INTO training_modules (title, description, category, duration_minutes, difficulty, video_url, audience, file_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                title,
                description,
                category || 'Geral',
                parseInt(duration) || 0,
                difficulty || 'Iniciante',
                relativePath,
                audience || 'team',
                fileType
            ]
        );

        res.json({ success: true, module: result.rows[0] });

    } catch (error) {
        console.error('Error creating training module:', error);
        res.status(500).json({ success: false, error: 'Error creating module' });
    }
};

const getModules = async (req, res) => {
    try {
        const { audience } = req.query;
        let query = 'SELECT * FROM training_modules';
        let params = [];

        if (audience) {
            query += ' WHERE audience = $1';
            params.push(audience);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);

        // If empty, return mock data?? No, return empty array so UI shows "No modules" or the user creates one.
        // Actually, for better UX right now, if empty maybe return the hardcoded list from frontend?
        // No, let's Stick to DB.

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({ success: false, error: 'Error fetching modules' });
    }
};

const getProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query('SELECT * FROM training_progress WHERE user_id = $1', [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ success: false, error: 'Error fetching progress' });
    }
};

module.exports = {
    upload,
    createModule,
    getModules,
    getProgress
};
