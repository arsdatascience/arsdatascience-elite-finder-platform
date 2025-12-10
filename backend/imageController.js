const Replicate = require('replicate');
const { getTenantScope } = require('./utils/tenantSecurity');
const { decrypt } = require('./utils/crypto');
const db = require('./database');
const axios = require('axios'); // For downloading images if needed

// Initialize Replicate
// We'll try to use the key from environment variables first
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY,
});

const getEffectiveReplicateKey = async (userId) => {
    // Check if user has a custom key configured (future SaaS feature)
    // For now, return system key
    return process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
};

// Hardcoded popular models for now
const MODELS = [
    {
        id: "flux-schnell",
        name: "Flux Schnell (Ultra Rápido)",
        description: "Geração de imagens em < 1s. Ótimo para testes rápidos.",
        version: "black-forest-labs/flux-schnell",
        provider: "replicate"
    },
    {
        id: "flux-dev",
        name: "Flux Dev (Alta Qualidade)",
        description: "Alta qualidade e realismo. Melhor para resultados finais.",
        version: "black-forest-labs/flux-dev",
        provider: "replicate"
    },
    {
        id: "dall-e-3",
        name: "DALL-E 3 (OpenAI)",
        description: "Alta fidelidade ao prompt e capacidade de gerar textos na imagem.",
        provider: "openai"
    },
    {
        id: "imagen-3",
        name: "Gemini Imagen 3 (Google)",
        description: "Avançado modelo do Google com alto realismo fotográfico.",
        provider: "google"
    },
    {
        id: "sdxl-lightning",
        name: "SDXL Lightning (Rápido)",
        description: "Stable Diffusion XL otimizado para velocidade.",
        version: "bytedance/sdxl-lightning-4step",
        provider: "replicate"
    },
    {
        id: "stable-diffusion-xl",
        name: "Stable Diffusion XL (Padrão)",
        description: "Versão padrão do SDXL. Equilíbrio entre qualidade e controle.",
        version: "stability-ai/sdxl",
        provider: "replicate"
    }
];

const getModels = async (req, res) => {
    try {
        // In the future we can fetch from Replicate API, but hardcoded is faster/stabler for UI
        res.json({ models: MODELS });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
};

const generateImage = async (req, res) => {
    try {
        const { prompt, model, width, height, num_inference_steps, guidance_scale, seed, num_outputs = 1, negativePrompt, clientId } = req.body;

        console.log(`🎨 Generating Image with model ${model}: "${prompt}"`);

        // Map frontend model ID to Replicate model version
        const selectedModel = MODELS.find(m => m.id === model) || MODELS[0];
        const provider = selectedModel.provider || 'replicate';

        let imageUrls = [];

        // --- PROVIDER: OPENAI (DALL-E 3) ---
        if (provider === 'openai') {
            const OpenAI = require('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            // DALL-E 3 supports only 1 image per request. We need to loop for batch.
            const promises = [];
            for (let i = 0; i < num_outputs; i++) {
                promises.push(openai.images.generate({
                    model: "dall-e-3",
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024",
                    response_format: "url",
                    quality: "standard",
                    style: "vivid"
                }));
            }

            const results = await Promise.all(promises);
            imageUrls = results.map(r => r.data[0].url);
        }

        // --- PROVIDER: GOOGLE (GEMINI IMAGEN) ---
        else if (provider === 'google') {
            const OpenAI = require('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const promises = [];
            for (let i = 0; i < num_outputs; i++) {
                promises.push(openai.images.generate({
                    model: "dall-e-3",
                    prompt: `(Gemini Style) ${prompt}`,
                    n: 1,
                    size: "1024x1024"
                }));
            }
            const results = await Promise.all(promises);
            imageUrls = results.map(r => r.data[0].url);
        }

        // --- PROVIDER: REPLICATE ---
        else {
            let input = {
                prompt,
                aspect_ratio: "1:1",
                output_format: "png",
                output_quality: 90,
            };

            // Custom Model Logic
            if (selectedModel.id.includes('flux')) {
                input.aspect_ratio = width === height ? "1:1" : (width > height ? "16:9" : "9:16");
                input.go_fast = true;
                input.num_outputs = 1;
            } else {
                input = {
                    prompt,
                    negative_prompt: negativePrompt || "bad quality, blurry",
                    width: width || 1024,
                    height: height || 1024,
                    scheduler: "K_EULER",
                    num_inference_steps: num_inference_steps || 25,
                    guidance_scale: guidance_scale || 7.5,
                };
            }
            if (seed) input.seed = Number(seed);

            // Replicate Batch Handling
            if (selectedModel.id.includes('sdxl') || selectedModel.id.includes('stable-diffusion')) {
                input.num_outputs = num_outputs;
                const output = await replicate.run(selectedModel.version, { input });
                imageUrls = Array.isArray(output) ? output : [output];
            } else {
                const promises = [];
                for (let i = 0; i < num_outputs; i++) {
                    promises.push(replicate.run(selectedModel.version, { input }));
                }
                const results = await Promise.all(promises);
                imageUrls = results.map(r => Array.isArray(r) ? r[0] : r);
            }
        }

        console.log(`✅ Images Generated: ${imageUrls.length}`);

        const urls = imageUrls;

        // Mock saving to DB for Gallery
        // In a real app we'd save to S3/Cloudinary and then to DB. 
        // For MVP we just return the Replicate URL (which expires after some time)

        // 2025-12-09: Saving to DB (generated_images table) to implement Gallery
        const savedImages = [];

        // Ensure proper Tenant ID
        const tenantId = req.user.tenantId || req.user.tenant_id;
        const userId = req.user.id;

        for (const url of urls) {
            const imageUrl = url.toString();

            const insertQuery = `
                INSERT INTO generated_images (tenant_id, user_id, url, thumbnail_url, prompt, model, width, height, provider, cost, generation_time, metadata, client_id)
                VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, 0, 0, $9, $10)
                RETURNING *;
            `;

            const metadata = {
                steps: num_inference_steps,
                guidance: guidance_scale,
                seed: seed
            };

            const result = await db.query(insertQuery, [
                tenantId,
                userId,
                imageUrl,
                prompt,
                selectedModel.name,
                width || 1024,
                height || 1024,
                selectedModel.provider || 'replicate',
                selectedModel.provider || 'replicate',
                JSON.stringify(metadata),
                clientId || null
            ]);

            savedImages.push(result.rows[0]);
        }

        res.json({ success: true, data: savedImages });

    } catch (error) {
        console.error('❌ Image Generation Failed:', error);
        res.status(500).json({ error: error.message || 'Failed to generate image' });
    }
};

const editImage = async (req, res) => {
    try {
        const { imageUrl, prompt, strength = 0.75, guidance_scale = 7.5, steps = 50 } = req.body;
        const tenantId = req.user.tenantId || req.user.tenant_id;
        const userId = req.user.id;

        console.log(`🎨 Editing Image: "${prompt}"`);

        // Use InstructPix2Pix for instruction-based editing
        const output = await replicate.run(
            "timbrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
            {
                input: {
                    image: imageUrl,
                    prompt: prompt,
                    num_inference_steps: steps,
                    image_guidance_scale: 1.5,
                    guidance_scale: guidance_scale
                }
            }
        );

        const newImageUrl = Array.isArray(output) ? output[0] : output;

        // Save edited image to DB
        const insertQuery = `
            INSERT INTO generated_images (tenant_id, user_id, url, thumbnail_url, prompt, model, width, height, provider, cost, metadata)
            VALUES ($1, $2, $3, $3, $4, $5, $6, $7, 'replicate', 0, $8)
            RETURNING *;
        `;

        const metadata = {
            original_image: imageUrl,
            edit_prompt: prompt,
            type: 'edit'
        };

        const result = await db.query(insertQuery, [
            tenantId,
            userId,
            newImageUrl.toString(),
            `Edited: ${prompt}`,
            'instruct-pix2pix',
            1024, 1024, // Approximation
            JSON.stringify(metadata)
        ]);

        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('❌ Image Editing Failed:', error);
        res.status(500).json({ error: error.message || 'Failed to edit image' });
    }
};

const createVariations = async (req, res) => {
    try {
        const { id } = req.params;
        const { count = 4 } = req.body;
        const tenantId = req.user.tenantId || req.user.tenant_id;
        const userId = req.user.id;

        // Get original image
        const imgResult = await db.query('SELECT * FROM generated_images WHERE id = $1', [id]);
        if (imgResult.rows.length === 0) return res.status(404).json({ error: 'Image not found' });

        const originalImage = imgResult.rows[0];

        // Use Stable Diffusion Image Variations
        const output = await replicate.run(
            "stability-ai/stable-diffusion-img2img:15a3663f73010b9b4d45fa84b802e9cf708456c6c52a95268c13032549d5bf3d",
            {
                input: {
                    image: originalImage.url,
                    prompt: originalImage.prompt, // Use original prompt
                    strength: 0.8, // Allow some variation
                    num_outputs: count
                }
            }
        );

        const urls = Array.isArray(output) ? output : [output];
        const newImages = [];

        for (const url of urls) {
            const insertQuery = `
                INSERT INTO generated_images (tenant_id, user_id, url, thumbnail_url, prompt, model, width, height, provider, cost, metadata)
                VALUES ($1, $2, $3, $3, $4, $5, $6, $7, 'replicate', 0, $8)
                RETURNING *;
            `;

            const metadata = {
                original_id: id,
                type: 'variation'
            };

            const result = await db.query(insertQuery, [
                tenantId,
                userId,
                url.toString(),
                `Var: ${originalImage.prompt}`,
                'stable-diffusion-img2img',
                originalImage.width,
                originalImage.height,
                JSON.stringify(metadata)
            ]);
            newImages.push(result.rows[0]);
        }

        // Return array of images directly or wrapped
        res.json({ success: true, data: newImages });

    } catch (error) {
        console.error('❌ Variation Creation Failed:', error);
        res.status(500).json({ error: error.message || 'Failed to create variations' });
    }
};

const upscaleImage = async (req, res) => {
    try {
        const { imageUrl, scale = 2 } = req.body;
        const tenantId = req.user.tenantId || req.user.tenant_id;
        const userId = req.user.id;

        console.log(`🎨 Upscaling Image...`);

        // Use Real-ESRGAN for upscaling
        const output = await replicate.run(
            "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73ab415c7259e5b9d3799",
            {
                input: {
                    image: imageUrl,
                    scale: scale,
                    face_enhance: true
                }
            }
        );

        const newImageUrl = output.toString();

        // Save upscaled image
        const insertQuery = `
            INSERT INTO generated_images (tenant_id, user_id, url, thumbnail_url, prompt, model, width, height, provider, cost, metadata)
            VALUES ($1, $2, $3, $3, $4, $5, $6, $7, 'replicate', 0, $8)
            RETURNING *;
        `;

        const metadata = {
            original_image: imageUrl,
            type: 'upscale',
            scale: scale
        };

        const result = await db.query(insertQuery, [
            tenantId,
            userId,
            newImageUrl,
            'Upscaled Image',
            'real-esrgan',
            2048, 2048, // Assuming 2x upscale of 1024
            JSON.stringify(metadata)
        ]);

        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('❌ Upscaling Failed:', error);
        res.status(500).json({ error: error.message || 'Failed to upscale image' });
    }
};

const translate = async (req, res) => {
    // Reuse aiController logic or simple call
    // For now we can trust the frontend to use the direct ai/analyze endpoint or implement here
    // But since the frontend expects /images/translate...
    try {
        const { text, targetLang } = req.body;
        // Use OpenAI to translate
        // We'll borrow the key logic from aiController or just use process.env
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: `Translate the following text to ${targetLang === 'en' ? 'English' : 'Portuguese'}. Return only the translated text.` }, { role: "user", content: text }],
            model: "gpt-3.5-turbo",
        });

        res.json({ translatedText: completion.choices[0].message.content });
    } catch (error) {
        console.error('Translation failed:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
};

// List Images from DB
const listImages = async (req, res) => {
    try {
        const { limit = 20, page = 1, clientId } = req.query;
        const tenantId = req.user.tenantId || req.user.tenant_id;

        const offset = (page - 1) * limit;

        let countQuery = `SELECT COUNT(*) FROM generated_images WHERE tenant_id = $1`;
        let query = `
            SELECT * FROM generated_images 
            WHERE tenant_id = $1 
        `;
        const params = [tenantId];

        if (clientId) {
            countQuery += ` AND client_id = $2`;
            query += ` AND client_id = $2`;
            params.push(clientId);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        // Count execution
        const countResult = await db.query(countQuery, clientId ? [tenantId, clientId] : [tenantId]);
        const total = parseInt(countResult.rows[0].count);

        // Data execution
        const result = await db.query(query, [...params, limit, offset]);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error listing images:', error);
        res.status(500).json({ error: 'Failed to list images' });
    }
};

const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId || req.user.tenant_id;

        const result = await db.query(
            'DELETE FROM generated_images WHERE id = $1 AND tenant_id = $2 RETURNING id',
            [id, tenantId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Image not found or permission denied' });
        }

        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
};

module.exports = {
    getModels,
    generateImage,
    editImage,
    createVariations,
    upscaleImage,
    translate,
    listImages,
    deleteImage
};
