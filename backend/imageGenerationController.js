const Replicate = require('replicate');
const { HfInference } = require('@huggingface/inference');
const cloudinary = require('cloudinary').v2;
const db = require('./database');
const Joi = require('joi');
const OpenAI = require('openai');
const { GoogleGenAI } = require("@google/genai");

// Configurações
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key' });
if (!process.env.OPENAI_API_KEY) console.warn('⚠️ OPENAI_API_KEY não encontrada! DALL-E falhará.');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Schemas
const generateSchema = Joi.object({
    prompt: Joi.string().required(),
    negativePrompt: Joi.string().allow('', null),
    width: Joi.number().integer().min(256).max(2048).default(1024),
    height: Joi.number().integer().min(256).max(2048).default(1024),
    model: Joi.string().required(),
    num_inference_steps: Joi.number().integer().min(1).max(100).default(30),
    guidance_scale: Joi.number().min(0).max(20).default(7.5),
    seed: Joi.number().integer().allow(null),
    num_outputs: Joi.number().integer().min(1).max(4).default(1)
});

const editSchema = Joi.object({
    imageUrl: Joi.string().required(),
    prompt: Joi.string().required(),
    strength: Joi.number().min(0).max(1).default(0.8),
    negativePrompt: Joi.string().allow('', null),
    model: Joi.string().default('sdxl-lightning'),
    seed: Joi.number().integer().allow(null)
});

const upscaleSchema = Joi.object({
    imageUrl: Joi.string().required(),
    scale: Joi.number().valid(2, 4).default(2)
});

const removeBgSchema = Joi.object({
    imageUrl: Joi.string().required()
});

// Funções Auxiliares
async function uploadToCloudinary(url, folder = 'generated') {
    try {
        const result = await cloudinary.uploader.upload(url, { folder });
        return {
            url: result.secure_url,
            publicId: result.public_id,
            thumbnailUrl: cloudinary.url(result.public_id, { width: 300, height: 300, crop: 'fill' })
        };
    } catch (error) {
        console.error('Erro Cloudinary:', error);
        throw new Error('Falha no upload para Cloudinary');
    }
}

// Geradores
async function generateWithFluxSchnell(input) {
    const output = await replicate.run("black-forest-labs/flux-schnell", {
        input: {
            prompt: input.prompt,
            num_outputs: input.num_outputs || 1,
            aspect_ratio: "1:1",
            output_format: "png",
            output_quality: 90,
            seed: input.seed
        }
    });
    return output;
}

async function generateWithSDXLLightning(input) {
    const output = await replicate.run("bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637", {
        input: {
            prompt: input.prompt,
            negative_prompt: input.negativePrompt,
            width: input.width,
            height: input.height,
            num_outputs: input.num_outputs || 1,
            scheduler: "K_EULER",
            num_inference_steps: 4,
            guidance_scale: 0,
            seed: input.seed
        }
    });
    return output;
}

async function generateWithZImageTurbo(input) {
    const output = await replicate.run("prunaai/z-image-turbo", {
        input: {
            prompt: input.prompt,
            width: input.width,
            height: input.height,
            num_inference_steps: input.num_inference_steps || 8,
            guidance_scale: input.guidance_scale || 0,
            seed: input.seed
        }
    });
    return output;
}

async function generateWithHuggingFace(input) {
    const outputs = [];
    for (let i = 0; i < (input.num_outputs || 1); i++) {
        const response = await hf.textToImage({
            model: 'stabilityai/stable-diffusion-xl-base-1.0',
            inputs: input.prompt,
            parameters: {
                negative_prompt: input.negativePrompt,
                num_inference_steps: input.num_inference_steps,
                guidance_scale: input.guidance_scale
            }
        });
        const buffer = Buffer.from(await response.arrayBuffer());
        outputs.push(`data:image/jpeg;base64,${buffer.toString('base64')}`);
    }
    return outputs;
}

async function generateWithDallE3(input, quality = 'standard') {
    console.log(`[DALL-E] Iniciando geração (${quality})... Prompt: ${input.prompt.substring(0, 50)}...`);
    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: input.prompt,
            n: 1,
            size: "1024x1024",
            quality: quality,
            response_format: "b64_json",
            style: "vivid"
        });
        console.log('[DALL-E] Imagem gerada com sucesso.');
        return `data:image/png;base64,${response.data[0].b64_json}`;
    } catch (error) {
        console.error('[DALL-E] Erro crítico:', error);
        throw error;
    }
}

async function generateWithGemini(input) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Google API Key não configurada.');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: input.prompt,
        config: { responseModalities: ["IMAGE"] }
    });

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error('Nenhuma imagem retornada pelo Gemini.');
}

async function generateWithImg2Img(input) {
    const output = await replicate.run("bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637", {
        input: {
            image: input.imageUrl,
            prompt: input.prompt,
            negative_prompt: input.negativePrompt,
            strength: input.strength,
            num_inference_steps: 4,
            guidance_scale: 0,
            seed: input.seed
        }
    });
    return Array.isArray(output) ? output[0] : output;
}

async function generateUpscale(input) {
    return await replicate.run("nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b", {
        input: { image: input.imageUrl, scale: input.scale, face_enhance: false }
    });
}

async function generateRemoveBg(input) {
    return await replicate.run("cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003", {
        input: { image: input.imageUrl }
    });
}

// Controllers
const generateImage = async (req, res) => {
    try {
        const { error, value } = generateSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { prompt, negativePrompt, width, height, model, num_inference_steps, guidance_scale, seed, num_outputs } = value;
        const userId = req.user?.id;
        const inputParams = { prompt, negativePrompt, width, height, num_inference_steps, guidance_scale, seed, num_outputs };

        let rawOutput;
        if (model === 'flux-schnell') rawOutput = await generateWithFluxSchnell(inputParams);
        else if (model === 'sdxl-lightning') rawOutput = await generateWithSDXLLightning(inputParams);
        else if (model === 'z-image-turbo') rawOutput = await generateWithZImageTurbo(inputParams);
        else if (model === 'stable-diffusion') rawOutput = await generateWithHuggingFace(inputParams);
        else if (model === 'dall-e-3') rawOutput = await generateWithDallE3(inputParams, 'standard');
        else if (model === 'dall-e-3-hd') rawOutput = await generateWithDallE3(inputParams, 'hd');
        else if (model.includes('gemini')) rawOutput = await generateWithGemini(inputParams);
        else return res.status(400).json({ error: 'Modelo não suportado.' });

        const urls = Array.isArray(rawOutput) ? rawOutput : [rawOutput];
        const savedImages = await Promise.all(urls.map(async (url) => {
            let finalUrl = url;
            if (url && typeof url === 'object' && url.url) finalUrl = url.url();
            else if (url && typeof url === 'object' && url.toString) finalUrl = url.toString();

            const uploadResult = await uploadToCloudinary(finalUrl);

            let cost = 0, provider = 'replicate';
            if (model.includes('dall-e')) { provider = 'openai'; cost = model.includes('hd') ? 0.08 : 0.04; }
            else if (model.includes('gemini')) { provider = 'google-gemini'; cost = 0.04; }
            else if (model === 'stable-diffusion') { provider = 'huggingface'; cost = 0; }
            else { if (model.includes('flux')) cost = 0.05; if (model.includes('sdxl')) cost = 0.03; }

            const result = await db.query(`
                INSERT INTO generated_images 
                (url, thumbnail_url, prompt, negative_prompt, model, width, height, user_id, cloudinary_public_id, thumbnail_public_id, cost, provider)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                [uploadResult.url, uploadResult.thumbnailUrl, prompt, negativePrompt, model, width, height, userId, uploadResult.publicId, uploadResult.publicId, cost, provider]
            );
            return result.rows[0];
        }));

        res.json({ success: true, data: savedImages.length === 1 ? savedImages[0] : savedImages });
    } catch (error) {
        console.error('[ImageGen] Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const listImages = async (req, res) => {
    try {
        const userId = req.user?.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM generated_images', countQuery = 'SELECT COUNT(*) FROM generated_images', params = [];
        if (userId) { query += ' WHERE user_id = $1'; countQuery += ' WHERE user_id = $1'; params.push(userId); }
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        const [result, countResult] = await Promise.all([
            db.query(query, [...params, limit, offset]),
            db.query(countQuery, params)
        ]);

        res.json({ success: true, data: result.rows, total: parseInt(countResult.rows[0].count), page, limit });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const result = await db.query('SELECT * FROM generated_images WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Imagem não encontrada' });

        const image = result.rows[0];
        if (userId && image.user_id !== userId) return res.status(403).json({ error: 'Acesso negado' });

        await cloudinary.uploader.destroy(image.cloudinary_public_id);
        await db.query('DELETE FROM generated_images WHERE id = $1', [id]);
        res.json({ success: true, message: 'Imagem deletada' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getModels = (req, res) => {
    res.json({
        models: [
            { id: 'flux-schnell', name: 'FLUX Schnell (Replicate)', description: 'Ultra-rápido, alta qualidade (Pago)', speed: 'ultra-fast', quality: 'excellent', free: false },
            { id: 'sdxl-lightning', name: 'SDXL Lightning (Replicate)', description: 'Geração relâmpago (Pago)', speed: 'ultra-fast', quality: 'great', free: false },
            { id: 'z-image-turbo', name: 'Z-Image Turbo (Replicate)', description: 'Modelo Turbo Otimizado (Pago)', speed: 'ultra-fast', quality: 'good', free: false },
            { id: 'stable-diffusion', name: 'Stable Diffusion XL (Hugging Face)', description: 'Gratuito (Pode ser mais lento)', speed: 'medium', quality: 'good', free: true },
            { id: 'dall-e-3', name: 'DALL-E 3 Standard (OpenAI)', description: 'Melhor para texto (Pago)', speed: 'slow', quality: 'excellent', free: false, premium: true },
            { id: 'dall-e-3-hd', name: 'DALL-E 3 HD (OpenAI)', description: 'Qualidade Máxima (Pago)', speed: 'slow', quality: 'best', free: false, premium: true },
            { id: 'gemini-flash-image', name: 'Gemini 2.5 Flash Image (Google)', description: 'Rápido e Eficiente (Pago)', speed: 'fast', quality: 'great', free: false, premium: true }
        ]
    });
};

const editImage = async (req, res) => {
    try {
        const { value, error } = editSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const rawOutput = await generateWithImg2Img(value);
        const uploadResult = await uploadToCloudinary(rawOutput);

        const result = await db.query(`
            INSERT INTO generated_images (url, thumbnail_url, prompt, negative_prompt, model, width, height, user_id, cloudinary_public_id, thumbnail_public_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [uploadResult.url, uploadResult.thumbnailUrl, `[EDITED] ${value.prompt}`, value.negativePrompt, `${value.model}-img2img`, 1024, 1024, req.user?.id, uploadResult.publicId, uploadResult.publicId]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createVariations = async (req, res) => {
    try {
        const { id } = req.params;
        const { count = 4 } = req.body;
        const userId = req.user?.id;

        const imgResult = await db.query('SELECT * FROM generated_images WHERE id = $1', [id]);
        if (imgResult.rows.length === 0) return res.status(404).json({ error: 'Imagem não encontrada' });
        const original = imgResult.rows[0];

        const promises = [];
        for (let i = 0; i < count; i++) {
            const seed = Math.floor(Math.random() * 1000000);
            const inputParams = { prompt: original.prompt.replace('[EDITED] ', ''), negativePrompt: original.negative_prompt, width: original.width, height: original.height, num_inference_steps: 4, guidance_scale: 0, seed, num_outputs: 1 };

            promises.push((original.model.includes('flux') ? generateWithFluxSchnell(inputParams) : generateWithSDXLLightning(inputParams)).then(async (raw) => {
                const url = Array.isArray(raw) ? raw[0] : raw;
                const upload = await uploadToCloudinary(url);
                return db.query(`INSERT INTO generated_images (url, thumbnail_url, prompt, negative_prompt, model, width, height, user_id, cloudinary_public_id, thumbnail_public_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                    [upload.url, upload.thumbnailUrl, original.prompt, original.negative_prompt, original.model, original.width, original.height, userId, upload.publicId, upload.publicId]
                ).then(r => r.rows[0]);
            }));
        }
        const results = await Promise.all(promises);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const upscaleImage = async (req, res) => {
    try {
        const { value, error } = upscaleSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const raw = await generateUpscale(value);
        const upload = await uploadToCloudinary(raw);

        const result = await db.query(`INSERT INTO generated_images (url, thumbnail_url, prompt, negative_prompt, model, width, height, user_id, cloudinary_public_id, thumbnail_public_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [upload.url, upload.thumbnailUrl, `[UPSCALED ${value.scale}x]`, null, `real-esrgan-${value.scale}x`, 0, 0, req.user?.id, upload.publicId, upload.publicId]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const removeBackground = async (req, res) => {
    try {
        const { value, error } = removeBgSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const raw = await generateRemoveBg(value);
        const upload = await uploadToCloudinary(raw);

        const result = await db.query(`INSERT INTO generated_images (url, thumbnail_url, prompt, negative_prompt, model, width, height, user_id, cloudinary_public_id, thumbnail_public_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [upload.url, upload.thumbnailUrl, `[NO BG]`, null, `rembg`, 0, 0, req.user?.id, upload.publicId, upload.publicId]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getRecentPrompts = async (req, res) => {
    try {
        const userId = req.user?.id;
        const prompts = await db.query(`SELECT prompt, MAX(created_at) as last_used FROM generated_images WHERE user_id = $1 GROUP BY prompt ORDER BY last_used DESC LIMIT 20`, [userId]);
        res.json({ success: true, prompts: prompts.rows.map(r => r.prompt) });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar histórico.' });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const modelFilter = req.query.model;
        const params = [userId];
        let filterClause = '';
        if (modelFilter && modelFilter !== 'all') { filterClause = 'AND model = $2'; params.push(modelFilter); }

        const totalResult = await db.query(`SELECT COUNT(*) FROM generated_images WHERE user_id = $1 ${filterClause}`, params);
        const modelResult = await db.query(`SELECT model, COUNT(*) as count FROM generated_images WHERE user_id = $1 ${filterClause} GROUP BY model ORDER BY count DESC`, params);

        const imagesByModel = modelResult.rows.map(r => {
            let costPerImage = 0.04;
            if (r.model.includes('flux')) costPerImage = 0.05;
            if (r.model.includes('sdxl')) costPerImage = 0.03;
            if (r.model.includes('esrgan')) costPerImage = 0.1;
            if (r.model.includes('dall-e-3-hd')) costPerImage = 0.08;
            else if (r.model.includes('dall-e-3')) costPerImage = 0.04;
            if (r.model.includes('gemini')) costPerImage = 0.04;

            return { name: r.model, value: parseInt(r.count), cost: parseFloat((costPerImage * parseInt(r.count)).toFixed(3)), costPerImage };
        });

        const activityResult = await db.query(`SELECT DATE(created_at) as date, COUNT(*) as count FROM generated_images WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days' ${filterClause} GROUP BY DATE(created_at) ORDER BY date ASC`, params);
        const activity = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = activityResult.rows.find(r => new Date(r.date).toISOString().split('T')[0] === dateStr);
            activity.push({ date: dateStr, count: found ? parseInt(found.count) : 0 });
        }

        const recentImagesResult = await db.query(`SELECT id, prompt, model, created_at, width, height, cost FROM generated_images WHERE user_id = $1 ${filterClause} ORDER BY created_at DESC LIMIT 50`, params);

        const recentImages = recentImagesResult.rows.map(img => ({
            ...img,
            cost: parseFloat(img.cost || 0)
        }));

        res.json({
            success: true, data: {
                totalImages: parseInt(totalResult.rows[0].count),
                imagesByModel,
                activity,
                totalCredits: parseFloat(imagesByModel.reduce((acc, curr) => acc + curr.cost, 0).toFixed(2)),
                recentImages
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const translateText = async (req, res) => {
    try {
        const { text, targetLang } = req.body;
        if (!text) return res.status(400).json({ error: 'Texto obrigatório' });

        const prompt = `Translate the following text to ${targetLang === 'pt' ? 'Portuguese (Brazil)' : 'English (US)'}. Return only the translated text, nothing else.\n\nText: "${text}"`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });

        res.json({ translatedText: response.choices[0].message.content.trim() });
    } catch (error) {
        console.error('Erro Tradução:', error);
        res.status(500).json({ error: 'Falha na tradução' });
    }
};

module.exports = { generateImage, listImages, deleteImage, getModels, editImage, createVariations, upscaleImage, removeBackground, getRecentPrompts, getAnalytics, translateText };
