const Replicate = require('replicate');
const { HfInference } = require('@huggingface/inference');
const cloudinary = require('cloudinary').v2;
const db = require('./database');
const Joi = require('joi');
const OpenAI = require('openai');
const { GoogleGenAI } = require("@google/genai");

// Configuração OpenAI (Local)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Configuração Gemini (Local) - Instanciada sob demanda na função


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
    model: Joi.string().valid(
        'flux-schnell', 'sdxl-lightning', 'stable-diffusion', 'z-image-turbo',
        'dall-e-3', 'dall-e-3-hd',
        'gemini-flash-image', 'gemini-pro-image'
    ).default('flux-schnell'),
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

// Função de Upload para Cloudinary
const uploadToCloudinary = async (fileUrl, folder = 'generated') => {
    try {
        const result = await cloudinary.uploader.upload(fileUrl, {
            folder: folder,
        });
        return {
            url: result.secure_url,
            thumbnailUrl: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Erro no upload para Cloudinary:', error);
        throw new Error('Falha no upload da imagem para Cloudinary.');
    }
};

// Geradores Específicos
async function generateWithFluxSchnell(input) {
    const params = {
        prompt: input.prompt,
        num_outputs: input.num_outputs || 1,
        aspect_ratio: "1:1",
        output_format: "png",
        output_quality: 90
    };
    if (input.seed) params.seed = input.seed;

    const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        { input: params }
    );
    return output;
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
        guidance_scale: input.guidance_scale || 0
    };
    if (input.seed) params.seed = input.seed;

    const output = await replicate.run(
        "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        { input: params }
    );
    return output;
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
    return output;
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

async function generateWithDallE3(input, quality = 'standard') {
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

        const b64 = response.data[0].b64_json;
        return `data:image/png;base64,${b64}`;
    } catch (error) {
        console.error('Erro DALL-E 3:', error);
        throw new Error(`Falha DALL-E 3: ${error.message}`);
    }
}

async function generateWithGemini(input, modelType) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Google API Key não configurada.');

    const ai = new GoogleGenAI({ apiKey });

    // Modelo sugerido pelo usuário: gemini-2.5-flash-image
    // Se modelType for 'pro', poderíamos tentar outro, mas por enquanto vamos focar no que sabemos que existe.
    const targetModel = 'gemini-2.5-flash-image';

    try {
        const response = await ai.models.generateContent({
            model: targetModel,
            contents: input.prompt,
            config: {
                responseModalities: ["IMAGE"]
            }
        });

        if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }

        throw new Error('Nenhuma imagem retornada na resposta do Gemini.');

    } catch (error) {
        console.error('Erro Gemini:', error);
        throw new Error(`Falha Gemini: ${error.message}`);
    }
}

// Controller Methods
const generateImage = async (req, res) => {
    try {
        const { error, value } = generateSchema.validate(req.body);
    };

    // Geradores Específicos
    async function generateWithFluxSchnell(input) {
        const params = {
            prompt: input.prompt,
            num_outputs: input.num_outputs || 1,
            aspect_ratio: "1:1",
            output_format: "png",
            output_quality: 90
        };
        if (input.seed) params.seed = input.seed;

        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            { input: params }
        );
        return output;
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
            guidance_scale: input.guidance_scale || 0
        };
        if (input.seed) params.seed = input.seed;

        const output = await replicate.run(
            "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
            { input: params }
        );
        return output;
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
        return output;
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

    async function generateWithDallE3(input, quality = 'standard') {
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

            const b64 = response.data[0].b64_json;
            return `data:image/png;base64,${b64}`;
        } catch (error) {
            console.error('Erro DALL-E 3:', error);
            throw new Error(`Falha DALL-E 3: ${error.message}`);
        }
    }

    async function generateWithGemini(input, modelType) {
        if (!genAI) throw new Error('Google API Key não configurada.');

        // Mapeamento para modelos experimentais que suportam imagem
        // Nota: Nomes sujeitos a alteração pela Google
        const targetModel = modelType === 'flash' ? 'gemini-2.0-flash-exp' : 'gemini-pro-vision';

        try {
            const model = genAI.getGenerativeModel({ model: targetModel });

            // Tentar gerar imagem
            // Se a API oficial ainda não suportar 'responseModalities', isso pode falhar.
            // Mas seguindo a instrução do usuário:
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
                // generationConfig: { responseModalities: ['IMAGE'] } // Comentado por segurança se SDK antigo
            });

            const response = await result.response;
            // Tentar extrair imagem (lógica genérica)
            // Se o modelo retornar texto descrevendo imagem, isso falha.
            // Assumindo que o modelo retorna imagem em inlineData

            // Simulação/Fallback se o SDK não retornar imagem direta:
            // throw new Error('Geração de imagem nativa Gemini ainda não disponível nesta versão da API.');

            // Se funcionar como esperado:
            // const candidates = response.candidates;
            // const part = candidates[0].content.parts[0];
            // if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;

            throw new Error('Integração Gemini Image ainda em fase experimental. Use DALL-E 3 ou Replicate.');

        } catch (error) {
            console.error('Erro Gemini:', error);
            throw new Error(`Falha Gemini: ${error.message}`);
        }
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
                rawOutput = await generateWithZImageTurbo(inputParams);
            } else if (model === 'stable-diffusion') {
                rawOutput = await generateWithHuggingFace(inputParams);
            } else if (model === 'dall-e-3') {
                rawOutput = await generateWithDallE3(inputParams, 'standard');
            } else if (model === 'dall-e-3-hd') {
                rawOutput = await generateWithDallE3(inputParams, 'hd');
            } else if (model === 'gemini-flash-image') {
                rawOutput = await generateWithGemini(inputParams, 'flash');
            } else if (model === 'gemini-pro-image') {
                rawOutput = await generateWithGemini(inputParams, 'pro');
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

                const uploadResult = await uploadToCloudinary(finalUrl, 'generated');

                // Definir custo e provider
                let cost = 0;
                let provider = 'replicate';

                if (model.includes('dall-e')) {
                    provider = 'openai';
                    cost = model.includes('hd') ? 0.08 : 0.04;
                } else if (model.includes('gemini')) {
                    provider = 'google-gemini';
                    cost = model.includes('pro') ? 0.12 : 0.039;
                } else if (model === 'stable-diffusion') {
                    provider = 'huggingface';
                    cost = 0;
                } else {
                    // Replicate models
                    if (model.includes('flux')) cost = 0.05;
                    if (model.includes('sdxl')) cost = 0.03;
                }

                const query = `
                INSERT INTO generated_images 
                (url, thumbnail_url, prompt, negative_prompt, model, width, height, user_id, cloudinary_public_id, thumbnail_public_id, cost, provider)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
                    uploadResult.publicId,
                    cost,
                    provider
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
            { id: 'dall-e-3', name: 'DALL-E 3 Standard (OpenAI)', description: 'Melhor para texto (Pago)', speed: 'slow', quality: 'excellent', free: false, premium: true },
            { id: 'dall-e-3-hd', name: 'DALL-E 3 HD (OpenAI)', description: 'Qualidade Máxima (Pago)', speed: 'slow', quality: 'best', free: false, premium: true },
            { id: 'gemini-flash-image', name: 'Gemini 2.5 Flash Image (Google)', description: 'Rápido e Eficiente (Pago)', speed: 'fast', quality: 'great', free: false, premium: true },
            { id: 'gemini-pro-image', name: 'Gemini Pro Image (Google)', description: 'Qualidade de Estúdio (Pago)', speed: 'medium', quality: 'excellent', free: false, premium: true }
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

            const imgQuery = 'SELECT * FROM generated_images WHERE id = $1';
            const imgResult = await db.query(imgQuery, [id]);
            if (imgResult.rows.length === 0) return res.status(404).json({ error: 'Imagem não encontrada' });

            const original = imgResult.rows[0];

            const modelToUse = original.model.includes('flux') ? 'flux-schnell' : 'sdxl-lightning';

            const promises = [];
            for (let i = 0; i < count; i++) {
                const seed = Math.floor(Math.random() * 1000000);
                const inputParams = {
                    prompt: original.prompt.replace('[EDITED] ', ''),
                    negativePrompt: original.negative_prompt,
                    width: original.width,
                    height: original.height,
                    num_inference_steps: 4,
                    guidance_scale: 0,
                    seed,
                    num_outputs: 1
                };

                const task = (modelToUse === 'flux-schnell' ? generateWithFluxSchnell(inputParams) : generateWithSDXLLightning(inputParams))
                    .then(async (rawOutput) => {
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
                0,
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

            const modelFilter = req.query.model; // Filtro opcional

            // Base query params
            const params = [userId];
            let filterClause = '';
            if (modelFilter && modelFilter !== 'all') {
                filterClause = 'AND model = $2';
                params.push(modelFilter);
            }

            // 1. Total Images (Filtered)
            const totalQuery = `SELECT COUNT(*) FROM generated_images WHERE user_id = $1 ${filterClause}`;
            const totalResult = await db.query(totalQuery, params);
            const totalImages = parseInt(totalResult.rows[0].count);

            // 2. Images by Model
            const modelQuery = `
            SELECT model, COUNT(*) as count 
            FROM generated_images 
            WHERE user_id = $1 ${filterClause}
            GROUP BY model 
            ORDER BY count DESC
        `;
            const modelResult = await db.query(modelQuery, params);

            // Calcular custo por modelo
            const imagesByModel = modelResult.rows.map(r => {
                let costPerImage = 0.04;
                if (r.model.includes('flux')) costPerImage = 0.05;
                if (r.model.includes('sdxl')) costPerImage = 0.03;
                if (r.model.includes('esrgan')) costPerImage = 0.1;
                if (r.model.includes('dall-e-3-hd')) costPerImage = 0.08;
                else if (r.model.includes('dall-e-3')) costPerImage = 0.04;
                if (r.model.includes('gemini-pro')) costPerImage = 0.12;
                else if (r.model.includes('gemini-flash')) costPerImage = 0.039;

                const totalCost = costPerImage * parseInt(r.count);

                return {
                    name: r.model,
                    value: parseInt(r.count),
                    cost: parseFloat(totalCost.toFixed(3)),
                    costPerImage
                };
            });

            // 3. Activity (Last 30 days) (Filtered)
            const activityQuery = `
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM generated_images 
            WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days' ${filterClause}
            GROUP BY DATE(created_at) 
            ORDER BY date ASC
        `;
            const activityResult = await db.query(activityQuery, params);

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

            // 4. Total Credits (Filtered)
            const totalCredits = imagesByModel.reduce((acc, curr) => acc + curr.cost, 0);

            // 5. Recent Images with Cost (New!)
            const recentImagesQuery = `
            SELECT id, prompt, model, created_at, width, height, cost 
            FROM generated_images 
            WHERE user_id = $1 ${filterClause}
            ORDER BY created_at DESC 
            LIMIT 50
        `;
            const recentImagesResult = await db.query(recentImagesQuery, params);

            const recentImages = recentImagesResult.rows.map(img => {
                let cost = img.cost ? parseFloat(img.cost) : 0;
                if (cost === 0) {
                    // Fallback se não tiver salvo no banco
                    if (img.model.includes('flux')) cost = 0.05;
                    if (img.model.includes('sdxl')) cost = 0.03;
                    if (img.model.includes('esrgan')) cost = 0.1;
                    if (img.model.includes('dall-e-3-hd')) cost = 0.08;
                    else if (img.model.includes('dall-e-3')) cost = 0.04;
                    if (img.model.includes('gemini-pro')) cost = 0.12;
                    else if (img.model.includes('gemini-flash')) cost = 0.039;
                }

                return {
                    ...img,
                    cost: cost
                };
            });

            res.json({
                success: true,
                data: {
                    totalImages,
                    imagesByModel,
                    activity,
                    totalCredits: parseFloat(totalCredits.toFixed(2)),
                    recentImages
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
