export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    prompt: string;
    negativePrompt?: string;
    category: 'photography' | 'art' | 'marketing' | 'social-media' | 'architecture';
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
    {
        id: 'photo-realistic',
        name: 'Fotografia Realista',
        description: 'Alta qualidade, estilo fotográfico profissional',
        category: 'photography',
        prompt: 'professional photography of [SUBJECT], hyperrealistic, 8k resolution, highly detailed, sharp focus, cinematic lighting, depth of field, shot on Sony A7R IV, 85mm lens',
        negativePrompt: 'illustration, painting, drawing, cartoon, anime, low quality, blurry, grainy, watermark, text'
    },
    {
        id: 'studio-portrait',
        name: 'Retrato de Estúdio',
        description: 'Iluminação de estúdio, fundo limpo',
        category: 'photography',
        prompt: 'studio portrait of [SUBJECT], professional lighting, rim light, neutral background, high detail skin texture, 8k, masterpiece',
        negativePrompt: 'bad lighting, shadows, messy background, low quality'
    },
    {
        id: 'social-media-post',
        name: 'Post Redes Sociais',
        description: 'Estilo vibrante e engajador para Instagram/LinkedIn',
        category: 'social-media',
        prompt: 'eye-catching social media photo of [SUBJECT], vibrant colors, modern aesthetic, clean composition, trending on instagram, high quality',
        negativePrompt: 'dull colors, dark, messy, low resolution'
    },
    {
        id: 'product-showcase',
        name: 'Showcase de Produto',
        description: 'Foco no produto, iluminação comercial',
        category: 'marketing',
        prompt: 'professional product photography of [SUBJECT], commercial lighting, clean background, 4k, advertising quality, product focus',
        negativePrompt: 'distorted, blurry, dark, amateur'
    },
    {
        id: 'digital-art',
        name: 'Arte Digital',
        description: 'Estilo artístico digital moderno',
        category: 'art',
        prompt: 'digital art of [SUBJECT], trending on artstation, concept art, highly detailed, intricate, sharp focus, illustration',
        negativePrompt: 'photo, realistic, low quality'
    },
    {
        id: 'modern-architecture',
        name: 'Arquitetura Moderna',
        description: 'Edifícios e interiores modernos',
        category: 'architecture',
        prompt: 'modern architecture of [SUBJECT], architectural photography, golden hour, glass and steel, interior design, 8k',
        negativePrompt: 'old, ruined, dirty, low quality'
    }
];
