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
    seed: Joi.number().integer().optional(),
    num_outputs: Joi.number().integer().min(1).max(4).default(1)
});

const editSchema = Joi.object({
    imageUrl: Joi.string().uri().required(),
    prompt: Joi.string().required(),
    strength: Joi.number().min(0).max(1).default(0.75),
    negativePrompt: Joi.string().allow('', null),
    model: Joi.string().default('sdxl-lightning'),
    seed: Joi.number().integer().optional()
});

const upscaleSchema = Joi.object({
    imageUrl: Joi.string().uri().required(),
    scale: Joi.number().valid(2, 4).default(2)
});

const removeBgSchema = Joi.object({
    imageUrl: Joi.string().uri().required()
});

// ... (uploadToCloudinary permanece igual)

// Geradores Específicos
async function generateWithFluxSchnell(input) {
    const params = {
        prompt: input.prompt,
        num_outputs: input.num_outputs || 1,
        aspect_ratio: "1:1", // Flux Schnell usa aspect_ratio ou width/height, mas prefere aspect_ratio para presets
        output_format: "png",
        output_quality: 90
    };
    if (input.seed) params.seed = input.seed;

    const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        { input: params }
    );
    return output; // Retorna array de URLs
}

async function generateWithSDXLLightning(input) {
    const params = {
        prompt: input.prompt,
        negative_prompt: input.negativePrompt || "low quality, bad quality",
        width: input.width,
        height: input.height,
        num_outputs: input.num_outputs || 1,
        scheduler: "K_EULER",
        num_inference_steps: input.num_inference_steps || 4,
        guidance_scale: input.guidance_scale || 0 // SDXL Lightning usa guidance 0 geralmente
    };
    if (input.seed) params.seed = input.seed;

    const output = await replicate.run(
        "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        { input: params }
    );
    return output; // Retorna array de URLs
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

async function generateWithImg2Img(input) {
    // SDXL Lightning suporta img2img se passarmos 'image' e 'strength'
    // Caso o modelo específico não suporte, podemos usar o stable-diffusion-img2img genérico
    const params = {
        image: input.imageUrl,
        prompt: input.prompt,
        negative_prompt: input.negativePrompt || "low quality, bad quality",
        strength: input.strength,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: 4,
        guidance_scale: 0,
        output_format: "png"
    };
    if (input.seed) params.seed = input.seed;

    const output = await replicate.run(
        "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        { input: params }
    );
    return output[0];
}

async function generateUpscale(input) {
    const output = await replicate.run(
        "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        {
            input: {
                image: input.imageUrl,
                scale: input.scale,
                face_enhance: false
            }
        }
    );
    return output;
}

async function generateRemoveBg(input) {
    const output = await replicate.run(
        "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        {
            input: {
                image: input.imageUrl
            }
        }
    );
    return output;
}

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
    seed: Joi.number().integer().optional(),
    num_outputs: Joi.number().integer().min(1).max(4).default(1)
});

const editSchema = Joi.object({
    imageUrl: Joi.string().uri().required(),
    prompt: Joi.string().required(),
    strength: Joi.number().min(0).max(1).default(0.75),
    negativePrompt: Joi.string().allow('', null),
    model: Joi.string().default('sdxl-lightning'),
    seed: Joi.number().integer().optional()
});

const upscaleSchema = Joi.object({
    imageUrl: Joi.string().uri().required(),
    scale: Joi.number().valid(2, 4).default(2)
});

const removeBgSchema = Joi.object({
    imageUrl: Joi.string().uri().required()
});

// ... (uploadToCloudinary permanece igual)

// Geradores Específicos
async function generateWithFluxSchnell(input) {
    const params = {
        prompt: input.prompt,
        num_outputs: input.num_outputs || 1,
        aspect_ratio: "1:1", // Flux Schnell usa aspect_ratio ou width/height, mas prefere aspect_ratio para presets
        output_format: "png",
        output_quality: 90
    };
    if (input.seed) params.seed = input.seed;

    const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        { input: params }
    );
    return output; // Retorna array de URLs
}

async function generateWithSDXLLightning(input) {
    const params = {
        prompt: input.prompt,
        negative_prompt: input.negativePrompt || "low quality, bad quality",
        width: input.width,
        height: input.height,
        num_outputs: input.num_outputs || 1,
        scheduler: "K_EULER",
        num_inference_steps: input.num_inference_steps || 4,
        guidance_scale: input.guidance_scale || 0 // SDXL Lightning usa guidance 0 geralmente
    };
    if (input.seed) params.seed = input.seed;

    const output = await replicate.run(
        "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        { input: params }
    );
    return output; // Retorna array de URLs
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
    return output; // Retorna array de URLs
}

async function generateWithHuggingFace(input) {
    try {
        const outputs = [];
        for (let i = 0; i < (input.num_outputs || 1); i++) {
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
            outputs.push(`data:image/jpeg;base64,${base64}`);
        }
        return outputs;
    } catch (error) {
        console.error('Erro Hugging Face:', error);
        throw new Error('Falha na geração com Hugging Face: ' + error.message);
    }
}

async function generateWithImg2Img(input) {
    // SDXL Lightning suporta img2img se passarmos 'image' e 'strength'
    // Caso o modelo específico não suporte, podemos usar o stable-diffusion-img2img genérico
    const params = {
        image: input.imageUrl,
        prompt: input.prompt,
        negative_prompt: input.negativePrompt || "low quality, bad quality",
        strength: input.strength,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: 4,
        guidance_scale: 0,
        output_format: "png"
    };
    if (input.seed) params.seed = input.seed;

    const output = await replicate.run(
        "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        { input: params }
    );
    return output[0];
}

async function generateUpscale(input) {
    const output = await replicate.run(
        "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        {
            input: {
                image: input.imageUrl,
                scale: input.scale,
                face_enhance: false
            }
        }
    );
    return output;
}

async function generateRemoveBg(input) {
    const output = await replicate.run(
        "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        {
            input: {
                image: input.imageUrl
            }
        }
    );
    return output;
}

// Controller Methods
const generateImage = async (req, res) => {
    try {
        const { error, value } = generateSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { prompt, negativePrompt, width, height, model, num_inference_steps, guidance_scale, seed, num_outputs } = value;
        const userId = req.user ? req.user.id : null;

        let rawOutput;
        console.log(`[ImageGen] Gerando com modelo ${model}: "${prompt}" (Batch: ${num_outputs})`);

        const inputParams = { prompt, negativePrompt, width, height, num_inference_steps, guidance_scale, seed, num_outputs };

        if (model === 'flux-schnell') {
            rawOutput = await generateWithFluxSchnell(inputParams);
        } else if (model === 'sdxl-lightning') {
            rawOutput = await generateWithSDXLLightning(inputParams);
        } else if (model === 'z-image-turbo') {
            // Z-Image Turbo pode não suportar batch nativo, geramos 1 ou fazemos loop (aqui simplificado para 1)
            rawOutput = await generateWithZImageTurbo(inputParams);
        } else if (model === 'stable-diffusion') {
            rawOutput = await generateWithHuggingFace(inputParams);
        } else {
            return res.status(400).json({ error: 'Modelo não suportado.' });
        }

        if (!rawOutput) throw new Error('Falha na geração da imagem (Output vazio)');

        // Garantir que rawOutput é um array
        const urls = Array.isArray(rawOutput) ? rawOutput : [rawOutput];

        // Processar e salvar todas as imagens
        const savedImages = await Promise.all(urls.map(async (url) => {
            let finalUrl = url;

            // Se for FileOutput (stream), precisamos ler
            if (url && typeof url === 'object' && url.url) {
                finalUrl = url.url(); // Replicate FileOutput
            } else if (url && typeof url === 'object' && url.toString) {
                finalUrl = url.toString();
            }

            // Upload para Cloudinary
            // Assuming uploadToCloudinary is defined elsewhere and handles the 'generated' folder
            const uploadResult = await uploadToCloudinary(finalUrl, 'generated');

            // Salvar no DB
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
            const result = await db.query(query, values);
            return result.rows[0];
        }));

        if (savedImages.length === 1) {
            res.json({ success: true, data: savedImages[0] });
        } else {
            res.json({ success: true, data: savedImages });
        }

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

const editImage = async (req, res) => {
    try {
        const { error, value } = editSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { imageUrl, prompt, strength, negativePrompt, model, seed } = value;
        const userId = req.user ? req.user.id : null;

        console.log(`[ImageGen] Editando imagem (Img2Img)...`);

        const rawOutput = await generateWithImg2Img({ imageUrl, prompt, strength, negativePrompt, seed });

        if (!rawOutput) throw new Error('Falha na edição da imagem');

        const uploadResult = await uploadToCloudinary(rawOutput); // rawOutput do replicate geralmente é URL ou stream

        const query = `
            INSERT INTO generated_images 
            (url, thumbnail_url, prompt, negative_prompt, model, width, height, user_id, cloudinary_public_id, thumbnail_public_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        // Assumindo 1024x1024 para simplificar, ou poderíamos pegar metadata do cloudinary
        const values = [
            uploadResult.url,
            uploadResult.thumbnailUrl,
            `[EDITED] ${prompt}`,
            negativePrompt,
            `${model}-img2img`,
            1024,
            1024,
            userId,
            uploadResult.publicId,
            uploadResult.publicId
        ];

        const dbResult = await db.query(query, values);
        res.json({ success: true, data: dbResult.rows[0] });

    } catch (error) {
        console.error('[ImageGen] Erro Edit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const createVariations = async (req, res) => {
    try {
        const { id } = req.params;
        const { count = 4 } = req.body;
        const userId = req.user ? req.user.id : null;

        if (count < 1 || count > 4) return res.status(400).json({ error: 'Count deve ser entre 1 e 4' });

        // Buscar imagem original
        const imgQuery = 'SELECT * FROM generated_images WHERE id = $1';
        const imgResult = await db.query(imgQuery, [id]);
        if (imgResult.rows.length === 0) return res.status(404).json({ error: 'Imagem não encontrada' });

        const original = imgResult.rows[0];

        // Gerar variações em paralelo
        // Usaremos o mesmo modelo original se possível, ou fallback para flux-schnnell
        const modelToUse = original.model.includes('flux') ? 'flux-schnell' : 'sdxl-lightning';

        const promises = [];
        for (let i = 0; i < count; i++) {
            const seed = Math.floor(Math.random() * 1000000);
            const inputParams = {
                prompt: original.prompt.replace('[EDITED] ', ''), // Limpar prefixo se houver
                negativePrompt: original.negative_prompt,
                width: original.width,
                height: original.height,
                num_inference_steps: 4,
                guidance_scale: 0,
                seed,
                num_outputs: 1 // Each variation is a single output
            };

            // Reutiliza funções existentes
            const task = (modelToUse === 'flux-schnell' ? generateWithFluxSchnell(inputParams) : generateWithSDXLLightning(inputParams))
                .then(async (rawOutput) => {
                    // rawOutput from generators is now always an array, take the first element
                    const singleOutput = Array.isArray(rawOutput) ? rawOutput[0] : rawOutput;
                    const uploadResult = await uploadToCloudinary(singleOutput);
                    const query = `
                        INSERT INTO generated_images 
                        (url, thumbnail_url, prompt, negative_prompt, model, width, height, user_id, cloudinary_public_id, thumbnail_public_id)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        RETURNING *
                    `;
                    const values = [
                        uploadResult.url,
                        uploadResult.thumbnailUrl,
                        original.prompt,
                        original.negative_prompt,
                        modelToUse,
                        original.width,
                        original.height,
                        userId,
                        uploadResult.publicId,
                        uploadResult.publicId
                    ];
                    return db.query(query, values).then(r => r.rows[0]);
                });
            promises.push(task);
        }

        const results = await Promise.all(promises);
        res.json({ success: true, data: results });

    } catch (error) {
        console.error('[ImageGen] Erro Variations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const upscaleImage = async (req, res) => {
    try {
        const { error, value } = upscaleSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { imageUrl, scale } = value;
        const userId = req.user ? req.user.id : null;

        console.log(`[ImageGen] Upscaling ${scale}x...`);
        const rawOutput = await generateUpscale({ imageUrl, scale });
        const uploadResult = await uploadToCloudinary(rawOutput);

        // Tentar obter dimensões reais seria ideal, mas vamos estimar
        // Se original era 1024, agora é 1024*scale. 
        // Para simplificar, salvamos sem validar dimensão exata ou fazemos um fetch antes (caro).
        // Vamos salvar com dimensões "desconhecidas" ou baseadas no scale se tivéssemos a original.
        // Como não temos a original aqui (só URL), vamos por 0 ou padrão.

        const query = `
            INSERT INTO generated_images 
            (url, thumbnail_url, prompt, negative_prompt, model, width, height, user_id, cloudinary_public_id, thumbnail_public_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const values = [
            uploadResult.url,
            uploadResult.thumbnailUrl,
            `[UPSCALED ${scale}x]`,
            null,
            `real-esrgan-${scale}x`,
            0, // Dimensão desconhecida sem processar
            0,
            userId,
            uploadResult.publicId,
            uploadResult.publicId
        ];

        const dbResult = await db.query(query, values);
        res.json({ success: true, data: dbResult.rows[0] });

    } catch (error) {
        console.error('[ImageGen] Erro Upscale:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const removeBackground = async (req, res) => {
    try {
        const { error, value } = removeBgSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { imageUrl } = value;
        const userId = req.user ? req.user.id : null;

        console.log(`[ImageGen] Removing background...`);
        const rawOutput = await generateRemoveBg({ imageUrl });
        const uploadResult = await uploadToCloudinary(rawOutput);

        const query = `
            INSERT INTO generated_images 
            (url, thumbnail_url, prompt, negative_prompt, model, width, height, user_id, cloudinary_public_id, thumbnail_public_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const values = [
            uploadResult.url,
            uploadResult.thumbnailUrl,
            `[NO BG]`,
            null,
            `rembg`,
            0,
            0,
            userId,
            uploadResult.publicId,
            uploadResult.publicId
        ];

        const dbResult = await db.query(query, values);
        res.json({ success: true, data: dbResult.rows[0] });

    } catch (error) {
        console.error('[ImageGen] Erro RemoveBG:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getRecentPrompts = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;

        const prompts = await db.query(
            `SELECT prompt, MAX(created_at) as last_used 
             FROM generated_images 
             WHERE user_id = $1 
             GROUP BY prompt 
             ORDER BY last_used DESC 
             LIMIT 20`,
            [userId]
        );

        res.json({ success: true, prompts: prompts.rows.map(r => r.prompt) });
    } catch (error) {
        console.error('[Prompts] Erro:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico de prompts.' });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // 1. Total Images
        const totalQuery = 'SELECT COUNT(*) FROM generated_images WHERE user_id = $1';
        const totalResult = await db.query(totalQuery, [userId]);
        const totalImages = parseInt(totalResult.rows[0].count);

        // 2. Images by Model
        const modelQuery = `
            SELECT model, COUNT(*) as count 
            FROM generated_images 
            WHERE user_id = $1 
            GROUP BY model 
            ORDER BY count DESC
        `;
        const modelResult = await db.query(modelQuery, [userId]);
        const imagesByModel = modelResult.rows.map(r => ({ name: r.model, value: parseInt(r.count) }));

        // 3. Activity (Last 30 days)
        const activityQuery = `
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM generated_images 
            WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days' 
            GROUP BY DATE(created_at) 
            ORDER BY date ASC
        `;
        const activityResult = await db.query(activityQuery, [userId]);

        // Fill missing days with 0
        const activity = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = activityResult.rows.find(r => {
                const rowDate = new Date(r.date).toISOString().split('T')[0];
                return rowDate === dateStr;
            });
            activity.push({ date: dateStr, count: found ? parseInt(found.count) : 0 });
        }

        // 4. Estimated Cost (Simulated)
        let totalCredits = 0;
        modelResult.rows.forEach(r => {
            let cost = 0.04; // default
            if (r.model.includes('flux')) cost = 0.05;
            if (r.model.includes('sdxl')) cost = 0.03;
            if (r.model.includes('esrgan')) cost = 0.1;
            totalCredits += cost * parseInt(r.count);
        });

        res.json({
            success: true,
            data: {
                totalImages,
                imagesByModel,
                activity,
                totalCredits: parseFloat(totalCredits.toFixed(2))
            }
        });

    } catch (error) {
        console.error('[ImageGen] Analytics Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    generateImage,
    listImages,
    deleteImage,
    getModels,
    editImage,
    createVariations,
    upscaleImage,
    removeBackground,
    getRecentPrompts,
    getAnalytics
};
