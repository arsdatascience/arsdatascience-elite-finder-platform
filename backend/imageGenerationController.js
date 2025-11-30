const Replicate = require('replicate');
const { HfInference } = require('@huggingface/inference');
const cloudinary = require('cloudinary').v2;
const db = require('./database');
const Joi = require('joi');

// Configuração Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração Replicate e Hugging Face
const replicateToken = process.env.REPLICATE_API_TOKEN;
if (replicateToken) {
    console.log(`[Config] Replicate Token configured: ${replicateToken.substring(0, 4)}...${replicateToken.substring(replicateToken.length - 4)}`);
} else {
    console.warn('[Config] Replicate Token NOT configured!');
}

const replicate = new Replicate({
    auth: replicateToken,
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Validação
const generateSchema = Joi.object({
    prompt: Joi.string().min(1).max(1000).required(),
    negativePrompt: Joi.string().max(500).allow('', null),
    width: Joi.number().integer().min(256).max(2048).default(1024),
    height: Joi.number().integer().min(256).max(2048).default(1024),
    model: Joi.string().valid('flux-schnell', 'sdxl-lightning', 'stable-diffusion', 'z-image-turbo').default('flux-schnell'),
    num_inference_steps: Joi.number().integer().min(1).max(50).optional(),
    guidance_scale: Joi.number().min(0).max(20).optional(),
    seed: Joi.number().integer().optional()
});

// ... (uploadToCloudinary permanece igual)

// Geradores Específicos
async function generateWithFluxSchnell(input) {
    const params = {
        prompt: input.prompt,
        num_outputs: 1,
        aspect_ratio: "1:1", // Flux Schnell usa aspect_ratio ou width/height, mas prefere aspect_ratio para presets
        output_format: "png",
        output_quality: 90
    };
    if (input.seed) params.seed = input.seed;

    const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        { input: params }
    );
    return output[0];
}

async function generateWithSDXLLightning(input) {
    const params = {
        prompt: input.prompt,
        negative_prompt: input.negativePrompt || "low quality, bad quality",
        width: input.width,
        height: input.height,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: input.num_inference_steps || 4,
        guidance_scale: input.guidance_scale || 0 // SDXL Lightning usa guidance 0 geralmente
    };
    if (input.seed) params.seed = input.seed;

    const output = await replicate.run(
        "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        { input: params }
    );
    return output[0];
}

async function generateWithZImageTurbo(input) {
    const params = {
        prompt: input.prompt,
        width: input.width,
        height: input.height,
        output_format: "jpg",
        guidance_scale: input.guidance_scale || 0,
        output_quality: 80,
        num_inference_steps: input.num_inference_steps || 8
    };
    if (input.seed) params.seed = input.seed;

    const output = await replicate.run(
        "prunaai/z-image-turbo",
        { input: params }
    );
    return output[0];
}

async function generateWithHuggingFace(input) {
    try {
        const response = await hf.textToImage({
            model: 'stabilityai/stable-diffusion-xl-base-1.0',
            inputs: input.prompt,
            parameters: {
                negative_prompt: input.negativePrompt,
                num_inference_steps: input.num_inference_steps || 25,
                guidance_scale: input.guidance_scale || 7.5,
                // Seed não é diretamente suportado no textToImage simples do HF Inference, mas ok
            }
        });

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
        console.error('Erro Hugging Face:', error);
        throw new Error('Falha na geração com Hugging Face: ' + error.message);
    }
}

// Controller Methods
const generateImage = async (req, res) => {
    try {
        const { error, value } = generateSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { prompt, negativePrompt, width, height, model, num_inference_steps, guidance_scale, seed } = value;
        const userId = req.user ? req.user.id : null;

        let rawOutput;
        console.log(`[ImageGen] Gerando com modelo ${model}: "${prompt}"`);

        const inputParams = { prompt, negativePrompt, width, height, num_inference_steps, guidance_scale, seed };

        if (model === 'flux-schnell') {
            rawOutput = await generateWithFluxSchnell(inputParams);
        } else if (model === 'sdxl-lightning') {
            rawOutput = await generateWithSDXLLightning(inputParams);
        } else if (model === 'z-image-turbo') {
            rawOutput = await generateWithZImageTurbo(inputParams);
        } else if (model === 'stable-diffusion') {
            rawOutput = await generateWithHuggingFace(inputParams);
        } else {
            return res.status(400).json({ error: 'Modelo não suportado.' });
        }

        if (!rawOutput) throw new Error('Falha na geração da imagem (Output vazio)');

        let imageUrl;
        // Processar output para garantir formato aceito pelo Cloudinary (String URL ou Data URI)
        if (typeof rawOutput !== 'string') {
            console.log('[ImageGen] Output não é string, processando stream/objeto...');
            if (rawOutput.url && typeof rawOutput.url === 'function') {
                imageUrl = rawOutput.url().href;
            } else if (typeof rawOutput.arrayBuffer === 'function') {
                const buffer = Buffer.from(await rawOutput.arrayBuffer());
                const mimeType = model === 'z-image-turbo' ? 'image/jpeg' : 'image/png';
                imageUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
            } else {
                imageUrl = rawOutput.toString();
            }
        } else {
            imageUrl = rawOutput;
        }

        console.log('[ImageGen] Uploading to Cloudinary...');
        const uploadResult = await uploadToCloudinary(imageUrl);

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
            uploadResult.publicId
        ];

        const dbResult = await db.query(query, values);
        const savedImage = dbResult.rows[0];

        res.json({ success: true, data: savedImage });

    } catch (error) {
        console.error('[ImageGen] Erro:', error);
        if (error.message.includes('402')) {
            return res.status(402).json({ success: false, error: 'Créditos insuficientes no Replicate. Tente o modelo Stable Diffusion (Hugging Face) que é gratuito.' });
        }
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

        const checkQuery = 'SELECT * FROM generated_images WHERE id = $1';
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Imagem não encontrada' });
        }

        const image = checkResult.rows[0];
        if (userId && image.user_id !== userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        await cloudinary.uploader.destroy(image.cloudinary_public_id);
        await db.query('DELETE FROM generated_images WHERE id = $1', [id]);

        res.json({ success: true, message: 'Imagem deletada com sucesso' });

    } catch (error) {
        console.error('[ImageGen] Erro ao deletar:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getModels = (req, res) => {
    const models = [
        { id: 'flux-schnell', name: 'FLUX Schnell (Replicate)', description: 'Ultra-rápido, alta qualidade (Pago)', speed: 'ultra-fast', quality: 'excellent', free: false },
        { id: 'sdxl-lightning', name: 'SDXL Lightning (Replicate)', description: 'Geração relâmpago (Pago)', speed: 'ultra-fast', quality: 'great', free: false },
        { id: 'z-image-turbo', name: 'Z-Image Turbo (Replicate)', description: 'Modelo Turbo Otimizado (Pago)', speed: 'ultra-fast', quality: 'good', free: false },
        { id: 'stable-diffusion', name: 'Stable Diffusion XL (Hugging Face)', description: 'Gratuito (Pode ser mais lento)', speed: 'medium', quality: 'good', free: true },
    ];
    res.json({ models });
};

module.exports = {
    generateImage,
    listImages,
    deleteImage,
    getModels
};
