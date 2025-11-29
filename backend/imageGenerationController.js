const Replicate = require('replicate');
const { HfInference } = require('@huggingface/inference');
const cloudinary = require('cloudinary').v2;
const db = require('./database'); // Assumindo que existe um wrapper de banco ou usar pool direto
const Joi = require('joi');

// Configuração Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração Replicate e Hugging Face
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Validação
const generateSchema = Joi.object({
    prompt: Joi.string().min(1).max(1000).required(),
    negativePrompt: Joi.string().max(500).allow('', null),
    width: Joi.number().integer().min(256).max(2048).default(1024),
    height: Joi.number().integer().min(256).max(2048).default(1024),
    model: Joi.string().valid('flux-schnell', 'sdxl-lightning', 'stable-diffusion', 'playground').default('flux-schnell')
});

// Upload para Cloudinary
async function uploadToCloudinary(imageUrl, folder = 'ai-generated') {
    try {
        const result = await cloudinary.uploader.upload(imageUrl, {
            folder: folder,
            resource_type: 'image'
        });

        // Criar thumbnail (transformação on-the-fly ou upload separado)
        // Cloudinary gera thumbnails automaticamente via URL transformation, mas vamos salvar a URL
        const thumbnailUrl = cloudinary.url(result.public_id, {
            width: 256,
            height: 256,
            crop: 'fill'
        });

        return {
            url: result.secure_url,
            thumbnailUrl: thumbnailUrl,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Erro no upload Cloudinary:', error);
        throw new Error('Falha ao salvar imagem na nuvem');
    }
}

// Geradores Específicos
async function generateWithFluxSchnell(input) {
    const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
            input: {
                prompt: input.prompt,
                num_outputs: 1,
                aspect_ratio: "1:1", // Simplificação, idealmente calcular baseado em width/height
                output_format: "png",
                output_quality: 90
            }
        }
    );
    // Flux retorna array de streams ou URLs
    return output[0]; // URL ou Stream
}

async function generateWithSDXLLightning(input) {
    const output = await replicate.run(
        "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        {
            input: {
                prompt: input.prompt,
                negative_prompt: input.negativePrompt || "low quality, bad quality",
                width: input.width,
                height: input.height,
                num_outputs: 1,
                scheduler: "K_EULER",
                num_inference_steps: 4
            }
        }
    );
    return output[0];
}

// Controller Methods
const generateImage = async (req, res) => {
    try {
        // Validar input
        const { error, value } = generateSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { prompt, negativePrompt, width, height, model } = value;
        const userId = req.user ? req.user.id : null; // Assumindo middleware de auth

        let imageUrl;
        console.log(`[ImageGen] Gerando com modelo ${model}: "${prompt}"`);

        // Selecionar gerador
        if (model === 'flux-schnell') {
            imageUrl = await generateWithFluxSchnell({ prompt });
        } else if (model === 'sdxl-lightning') {
            imageUrl = await generateWithSDXLLightning({ prompt, negativePrompt, width, height });
        } else {
            // Fallback ou outros modelos (HF)
            // Implementar HF se necessário, por enquanto focar nos principais do Replicate
            return res.status(400).json({ error: 'Modelo não suportado ou não implementado ainda.' });
        }

        if (!imageUrl) throw new Error('Falha na geração da imagem (URL vazia)');

        // Upload para Cloudinary
        console.log('[ImageGen] Uploading to Cloudinary...');
        const uploadResult = await uploadToCloudinary(imageUrl);

        // Salvar no Banco
        console.log('[ImageGen] Saving to DB...');
        const query = `
            INSERT INTO generated_images 
            (url, thumbnail_url, prompt, negative_prompt, model, width, height, user_id, cloudinary_public_id, thumbnail_public_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const values = [
            uploadResult.url,
            uploadResult.thumbnailUrl,
            prompt,
            negativePrompt,
            model,
            width,
            height,
            userId,
            uploadResult.publicId,
            uploadResult.publicId // Usando mesmo ID para thumbnail (transformação via URL)
        ];

        const dbResult = await db.query(query, values);
        const savedImage = dbResult.rows[0];

        res.json({ success: true, data: savedImage });

    } catch (error) {
        console.error('[ImageGen] Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const listImages = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM generated_images';
        let countQuery = 'SELECT COUNT(*) FROM generated_images';
        let params = [];

        if (userId) {
            query += ' WHERE user_id = $1';
            countQuery += ' WHERE user_id = $1';
            params.push(userId);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        const result = await db.query(query, [...params, limit, offset]);
        const countResult = await db.query(countQuery, params);

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            limit
        });

    } catch (error) {
        console.error('[ImageGen] Erro ao listar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null;

        // Verificar se imagem existe e pertence ao usuário
        const checkQuery = 'SELECT * FROM generated_images WHERE id = $1';
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Imagem não encontrada' });
        }

        const image = checkResult.rows[0];
        if (userId && image.user_id !== userId) { // Se tiver auth, verifica dono
            // Permitir admin deletar? Por enquanto restrito ao dono
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Deletar do Cloudinary
        await cloudinary.uploader.destroy(image.cloudinary_public_id);

        // Deletar do Banco
        await db.query('DELETE FROM generated_images WHERE id = $1', [id]);

        res.json({ success: true, message: 'Imagem deletada com sucesso' });

    } catch (error) {
        console.error('[ImageGen] Erro ao deletar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getModels = (req, res) => {
    const models = [
        { id: 'flux-schnell', name: 'FLUX Schnell', description: 'Geração ultra-rápida (2-4s)', speed: 'ultra-fast', quality: 'excellent', free: true },
        { id: 'sdxl-lightning', name: 'SDXL Lightning', description: 'Geração relâmpago (1-2s)', speed: 'ultra-fast', quality: 'great', free: true },
        // Adicionar outros futuramente
    ];
    res.json({ models });
};

module.exports = {
    generateImage,
    listImages,
    deleteImage,
    getModels
};
