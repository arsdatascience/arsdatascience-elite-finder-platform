const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Create a new social post
const createPost = async (req, res) => {
    try {
        const { client_id, platform, content, scheduled_at, status } = req.body;
        let media_url = null;

        if (req.file) {
            // In production, you would upload this to S3 or similar
            // For now, we'll serve it statically
            media_url = `/uploads/${req.file.filename}`;
        } else if (req.body.media_url) {
            media_url = req.body.media_url;
        }

        // Default client_id if not provided (e.g., for testing)
        const finalClientId = client_id || 1;

        const query = `
      INSERT INTO social_posts 
      (client_id, platform, content, media_url, scheduled_at, status) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;

        const values = [
            finalClientId,
            platform,
            content,
            media_url,
            scheduled_at || null,
            status || 'draft'
        ];

        const result = await db.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            post: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating post',
            error: error.message
        });
    }
};

// Get all posts
const getPosts = async (req, res) => {
    try {
        const query = 'SELECT * FROM social_posts ORDER BY created_at DESC';
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    upload,
    createPost,
    getPosts
};
