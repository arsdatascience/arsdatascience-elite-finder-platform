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
    listImages,
        deleteImage,
        getModels
};
