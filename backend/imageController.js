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
        version: "black-forest-labs/flux-schnell", // Model owner/name for Replicate
    },
    {
        id: "flux-dev",
        name: "Flux Dev (Alta Qualidade)",
        description: "Alta qualidade e realismo. Melhor para resultados finais.",
        version: "black-forest-labs/flux-dev",
    },
    {
        id: "sdxl-lightning",
        name: "SDXL Lightning (Rápido)",
        description: "Stable Diffusion XL otimizado para velocidade.",
        version: "bytedance/sdxl-lightning-4step",
    },
    {
        id: "stable-diffusion-xl",
        name: "Stable Diffusion XL (Padrão)",
        description: "Versão padrão do SDXL. Equilíbrio entre qualidade e controle.",
        version: "stability-ai/sdxl",
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
        const { prompt, model, width, height, num_inference_steps, guidance_scale, seed, num_outputs = 1, negativePrompt } = req.body;

        console.log(`🎨 Generating Image with model ${model}: "${prompt}"`);

        // Map frontend model ID to Replicate model version
        const selectedModel = MODELS.find(m => m.id === model) || MODELS[0];

        let input = {
            prompt,
            num_outputs: num_outputs,
            aspect_ratio: "1:1", // Flux support aspect_ratio or width/height
            // width: width, // Flux sometimes prefers aspect_ratio
            // height: height,
            output_format: "png",
            output_quality: 90,
        };

        // Adjust input based on model specific requirements
        if (selectedModel.id.includes('flux')) {
            input = {
                prompt,
                num_outputs: num_outputs,
                aspect_ratio: width === height ? "1:1" : (width > height ? "16:9" : "9:16"),
                output_format: "png",
                go_fast: true, // Specific for Schnell
            };
            if (seed) input.seed = Number(seed);
        } else {
            // SDXL parameters
            input = {
                prompt,
                negative_prompt: negativePrompt || "bad quality, blurry",
                width: width || 1024,
                height: height || 1024,
                num_outputs: num_outputs,
                scheduler: "K_EULER",
                num_inference_steps: num_inference_steps || 25,
                guidance_scale: guidance_scale || 7.5,
            };
            if (seed) input.seed = Number(seed);
        }

        const output = await replicate.run(
            selectedModel.version,
            { input }
        );

        console.log('✅ Image Generated:', output);

        // Output from Replicate is an array of URLs (or a ReadableStream in some cases, but SDK handles it usually returning URL)
        // Ensure we handle array or string
        const urls = Array.isArray(output) ? output : [output];

        // Mock saving to DB for Gallery
        // In a real app we'd save to S3/Cloudinary and then to DB. 
        // For MVP we just return the Replicate URL (which expires after some time)

        const generatedImages = urls.map(url => ({
            id: Math.random().toString(36).substr(2, 9),
            url: url.toString(), // Ensure string
            thumbnailUrl: url.toString(),
            prompt,
            model: selectedModel.name,
            width,
            height,
            createdAt: new Date().toISOString()
        }));

        res.json({ success: true, data: generatedImages });

    } catch (error) {
        console.error('❌ Image Generation Failed:', error);
        res.status(500).json({ error: error.message || 'Failed to generate image' });
    }
};

const editImage = async (req, res) => {
    // Placeholder: Implement generic image editing (inpainting or instruct-pix2pix)
    res.status(501).json({ error: 'Not implemented yet' });
};

const createVariations = async (req, res) => {
    // Placeholder
    res.status(501).json({ error: 'Not implemented yet' });
};

const upscaleImage = async (req, res) => {
    // Placeholder
    res.status(501).json({ error: 'Not implemented yet' });
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

// Mock Gallery for now or simple in-memory
const listImages = async (req, res) => {
    // In future: Query DB
    res.json({ data: [] });
};

const deleteImage = async (req, res) => {
    res.json({ success: true });
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
