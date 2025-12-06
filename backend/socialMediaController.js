const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storageService = require('./services/storageService');

// Configure storage for uploaded files - Use Memory Storage for S3
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

// Create a new social post
const createPost = async (req, res) => {
    try {
        const { client_id, platform, content, scheduled_at, status } = req.body;
        let media_url = null;

        if (req.file) {
            // Upload to S3
            media_url = await storageService.uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                'posts'
            );
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
        const newPost = result.rows[0];

        const { jobsQueue } = require('./queueClient');

        // ... (imports)

        // ... (inside createPost function)
        // Se for agendado, criar Job na fila (SaaS Queue)
        if ((status === 'scheduled' || status === 'published') && scheduled_at) {
            // Buscar Integration ID
            // Buscar Integration ID using new schema (client_id, provider)
            // Use finalClientId determined above
            const intResult = await db.query(
                'SELECT id FROM integrations WHERE client_id = $1 AND provider = $2',
                [finalClientId, platform]
            );

            if (intResult.rows.length > 0) {
                const integrationId = intResult.rows[0].id;

                // Adicionar à fila do BullMQ
                await jobsQueue.add('publish_social_post', {
                    postId: newPost.id,
                    integrationId,
                    platform,
                    content,
                    mediaUrl: media_url
                }, {
                    delay: scheduled_at ? new Date(scheduled_at).getTime() - Date.now() : 0,
                    jobId: `social_${newPost.id}_${Date.now()}`
                });

                console.log(`📅 Job de publicação agendado para ${scheduled_at} via BullMQ`);
            } else {
                console.warn(`⚠️ Nenhuma integração encontrada para ${platform}. Post salvo mas não agendado na fila.`);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            post: newPost
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
        let query = 'SELECT * FROM social_posts';
        const values = [];

        if (req.query.client && req.query.client !== 'all') {
            query += ' WHERE client_id = $1';
            values.push(req.query.client);
        }

        query += ' ORDER BY created_at DESC';
        const result = await db.query(query, values);
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
