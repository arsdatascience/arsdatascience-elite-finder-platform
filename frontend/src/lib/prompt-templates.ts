export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    prompt: string;
    negativePrompt?: string;
    category: 'photography' | 'art' | 'marketing' | 'social-media' | 'architecture';
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
    // --- PHOTOGRAPHY ---
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
        id: 'landscape-photo',
        name: 'Paisagem Natural',
        description: 'Fotografia de natureza e paisagens',
        category: 'photography',
        prompt: 'breathtaking landscape photography of [SUBJECT], golden hour, wide angle, high dynamic range, detailed textures, national geographic style',
        negativePrompt: 'people, buildings, cars, blurry, overexposed'
    },
    {
        id: 'macro-photo',
        name: 'Macro Fotografia',
        description: 'Detalhes extremos de pequenos objetos',
        category: 'photography',
        prompt: 'macro photography of [SUBJECT], extreme close-up, incredible detail, shallow depth of field, bokeh background, sharp focus',
        negativePrompt: 'blurry, out of focus, noisy'
    },
    {
        id: 'street-photo',
        name: 'Fotografia de Rua',
        description: 'Estilo urbano e espontâneo',
        category: 'photography',
        prompt: 'street photography of [SUBJECT], urban setting, candid moment, natural lighting, leica m10, black and white optional, gritty texture',
        negativePrompt: 'posed, studio, artificial lighting'
    },
    {
        id: 'wildlife-photo',
        name: 'Vida Selvagem',
        description: 'Animais em habitat natural',
        category: 'photography',
        prompt: 'wildlife photography of [SUBJECT] in natural habitat, telephoto lens, sharp focus on eyes, motion blur background, dramatic lighting',
        negativePrompt: 'zoo, cage, fence, human elements'
    },
    {
        id: 'fashion-editorial',
        name: 'Editorial de Moda',
        description: 'Estilo revista de moda',
        category: 'photography',
        prompt: 'high fashion editorial shot of [SUBJECT], vogue style, dramatic pose, couture clothing, professional makeup, studio lighting',
        negativePrompt: 'casual, amateur, bad clothes'
    },
    {
        id: 'food-photo',
        name: 'Fotografia de Comida',
        description: 'Apetitoso e bem iluminado',
        category: 'photography',
        prompt: 'gourmet food photography of [SUBJECT], overhead shot, soft natural lighting, fresh ingredients, appetizing, 4k, food magazine style',
        negativePrompt: 'rotten, messy, dark, unappetizing'
    },
    {
        id: 'aerial-drone',
        name: 'Aérea / Drone',
        description: 'Vista de cima',
        category: 'photography',
        prompt: 'aerial drone shot of [SUBJECT], top-down view, geometric patterns, high altitude, sharp details, dji mavic 3',
        negativePrompt: 'ground level, blurry'
    },
    {
        id: 'underwater-photo',
        name: 'Subaquática',
        description: 'Debaixo d\'água',
        category: 'photography',
        prompt: 'underwater photography of [SUBJECT], light rays breaking through surface, clear blue water, bubbles, marine life, gopro hero 10',
        negativePrompt: 'dark, murky, blurry'
    },

    // --- ART ---
    {
        id: 'digital-art',
        name: 'Arte Digital',
        description: 'Estilo artístico digital moderno',
        category: 'art',
        prompt: 'digital art of [SUBJECT], trending on artstation, concept art, highly detailed, intricate, sharp focus, illustration',
        negativePrompt: 'photo, realistic, low quality'
    },
    {
        id: 'oil-painting',
        name: 'Pintura a Óleo',
        description: 'Estilo clássico de pintura',
        category: 'art',
        prompt: 'oil painting of [SUBJECT], textured brushstrokes, classical style, masterpiece, canvas texture, impasto',
        negativePrompt: 'digital, photo, flat'
    },
    {
        id: 'watercolor',
        name: 'Aquarela',
        description: 'Suave e artístico',
        category: 'art',
        prompt: 'watercolor painting of [SUBJECT], soft edges, pastel colors, paper texture, artistic, dreamy, wet on wet technique',
        negativePrompt: 'sharp, digital, harsh lines'
    },
    {
        id: 'cyberpunk-art',
        name: 'Cyberpunk',
        description: 'Futurista e neon',
        category: 'art',
        prompt: 'cyberpunk style [SUBJECT], neon lights, futuristic city background, high tech, rain, reflections, pink and blue color palette',
        negativePrompt: 'rustic, old, natural'
    },
    {
        id: 'steampunk-art',
        name: 'Steampunk',
        description: 'Retrofuturismo vitoriano',
        category: 'art',
        prompt: 'steampunk illustration of [SUBJECT], brass gears, steam, victorian clothing, copper details, intricate mechanical parts',
        negativePrompt: 'modern, plastic, clean'
    },
    {
        id: 'anime-style',
        name: 'Anime / Manga',
        description: 'Estilo de animação japonesa',
        category: 'art',
        prompt: 'anime style illustration of [SUBJECT], studio ghibli inspired, vibrant colors, cel shading, detailed background, emotional',
        negativePrompt: '3d, realistic, photo'
    },
    {
        id: 'pixel-art',
        name: 'Pixel Art',
        description: 'Estilo retro 8-bit/16-bit',
        category: 'art',
        prompt: 'pixel art of [SUBJECT], 16-bit style, retro game asset, vibrant colors, clean lines',
        negativePrompt: 'blur, anti-aliasing, vector, hd'
    },
    {
        id: '3d-render',
        name: 'Render 3D',
        description: 'Estilo Pixar/Disney ou 3D realista',
        category: 'art',
        prompt: '3d render of [SUBJECT], pixar style, cute, octane render, unreal engine 5, volumetric lighting, soft textures',
        negativePrompt: '2d, drawing, sketch'
    },
    {
        id: 'pop-art',
        name: 'Pop Art',
        description: 'Estilo Andy Warhol',
        category: 'art',
        prompt: 'pop art of [SUBJECT], comic book style, halftone dots, bold colors, thick outlines, roy lichtenstein style',
        negativePrompt: 'realistic, subtle'
    },
    {
        id: 'surrealism',
        name: 'Surrealismo',
        description: 'Onírico e estranho',
        category: 'art',
        prompt: 'surrealist art of [SUBJECT], salvador dali style, dreamlike, melting objects, impossible geometry, mysterious',
        negativePrompt: 'realistic, normal, boring'
    },

    // --- MARKETING ---
    {
        id: 'product-showcase',
        name: 'Showcase de Produto',
        description: 'Foco no produto, iluminação comercial',
        category: 'marketing',
        prompt: 'professional product photography of [SUBJECT], commercial lighting, clean background, 4k, advertising quality, product focus',
        negativePrompt: 'distorted, blurry, dark, amateur'
    },
    {
        id: 'minimalist-ad',
        name: 'Anúncio Minimalista',
        description: 'Limpo e direto',
        category: 'marketing',
        prompt: 'minimalist advertising poster for [SUBJECT], plenty of negative space, clean typography, pastel colors, modern design',
        negativePrompt: 'cluttered, busy, messy'
    },
    {
        id: 'luxury-branding',
        name: 'Marca de Luxo',
        description: 'Elegante e premium',
        category: 'marketing',
        prompt: 'luxury branding image for [SUBJECT], gold and black color scheme, elegant, premium texture, silk background, sophisticated',
        negativePrompt: 'cheap, plastic, bright colors'
    },
    {
        id: 'tech-showcase',
        name: 'Tech Showcase',
        description: 'Moderno e tecnológico',
        category: 'marketing',
        prompt: 'futuristic technology showcase of [SUBJECT], neon accents, sleek design, dark background, glowing elements, high tech',
        negativePrompt: 'old, vintage, rustic'
    },
    {
        id: 'food-ad',
        name: 'Anúncio de Comida',
        description: 'Para restaurantes e delivery',
        category: 'marketing',
        prompt: 'delicious food advertisement for [SUBJECT], steam rising, fresh ingredients, warm lighting, wooden table, appetizing',
        negativePrompt: 'cold, unappetizing, plastic'
    },
    {
        id: 'real-estate-ad',
        name: 'Imobiliário',
        description: 'Venda de imóveis',
        category: 'marketing',
        prompt: 'real estate photography of [SUBJECT], wide angle, bright and airy, modern furniture, staging, inviting atmosphere',
        negativePrompt: 'dark, dirty, small'
    },
    {
        id: 'corporate-office',
        name: 'Corporativo',
        description: 'Ambiente de negócios',
        category: 'marketing',
        prompt: 'corporate office setting with [SUBJECT], professional people, diversity, modern workspace, glass walls, bright lighting',
        negativePrompt: 'casual, messy, dark'
    },
    {
        id: 'event-promo',
        name: 'Promoção de Evento',
        description: 'Festas e conferências',
        category: 'marketing',
        prompt: 'event promotion image for [SUBJECT], energetic crowd, stage lights, confetti, excitement, night life atmosphere',
        negativePrompt: 'empty, boring, quiet'
    },
    {
        id: 'packaging-design',
        name: 'Design de Embalagem',
        description: 'Mockup de embalagem',
        category: 'marketing',
        prompt: 'packaging design mockup for [SUBJECT], studio lighting, 3d render, clean label, eco-friendly materials',
        negativePrompt: 'flat, 2d, sketch'
    },
    {
        id: 'seasonal-promo',
        name: 'Promoção Sazonal',
        description: 'Natal, Verão, etc.',
        category: 'marketing',
        prompt: 'seasonal promotion for [SUBJECT], holiday decorations, festive atmosphere, warm colors, gift giving theme',
        negativePrompt: 'plain, boring'
    },

    // --- SOCIAL MEDIA ---
    {
        id: 'social-media-post',
        name: 'Post Redes Sociais',
        description: 'Estilo vibrante e engajador',
        category: 'social-media',
        prompt: 'eye-catching social media photo of [SUBJECT], vibrant colors, modern aesthetic, clean composition, trending on instagram, high quality',
        negativePrompt: 'dull colors, dark, messy, low resolution'
    },
    {
        id: 'instagram-lifestyle',
        name: 'Lifestyle Instagram',
        description: 'Estilo de vida aspiracional',
        category: 'social-media',
        prompt: 'instagram lifestyle shot of [SUBJECT], golden hour, aesthetic, candid, travel vibes, soft filter, influencer style',
        negativePrompt: 'studio, posed, artificial'
    },
    {
        id: 'linkedin-pro',
        name: 'Profissional LinkedIn',
        description: 'Sério e confiável',
        category: 'social-media',
        prompt: 'professional linkedin headshot or scene of [SUBJECT], business attire, blurred office background, confident look, high quality',
        negativePrompt: 'casual, party, selfie'
    },
    {
        id: 'youtube-thumb',
        name: 'Thumbnail YouTube',
        description: 'Alto contraste e expressivo',
        category: 'social-media',
        prompt: 'youtube thumbnail background for [SUBJECT], high contrast, expressive face, vibrant colors, shock factor, 4k',
        negativePrompt: 'boring, low contrast, text'
    },
    {
        id: 'tiktok-viral',
        name: 'TikTok Viral',
        description: 'Dinâmico e trend',
        category: 'social-media',
        prompt: 'tiktok viral video style frame of [SUBJECT], ring light, gen z aesthetic, colorful led lights in background, dynamic angle',
        negativePrompt: 'static, boring, old'
    },
    {
        id: 'travel-blog',
        name: 'Blog de Viagem',
        description: 'Wanderlust e aventura',
        category: 'social-media',
        prompt: 'travel blog photography of [SUBJECT], scenic view, backpacker vibe, adventure, mountains or beach, natural light',
        negativePrompt: 'indoor, city, office'
    },
    {
        id: 'fitness-inspo',
        name: 'Fitness Inspo',
        description: 'Academia e saúde',
        category: 'social-media',
        prompt: 'fitness inspiration shot of [SUBJECT], gym setting, sweat, dramatic lighting, athletic physique, workout gear',
        negativePrompt: 'lazy, soft, unhealthy'
    },
    {
        id: 'flat-lay',
        name: 'Flat Lay',
        description: 'Objetos organizados de cima',
        category: 'social-media',
        prompt: 'aesthetic flat lay photography of [SUBJECT], organized on white desk, coffee, plant, notebook, top down view, soft light',
        negativePrompt: 'messy, angled, dark'
    },
    {
        id: 'quote-bg',
        name: 'Fundo para Frases',
        description: 'Minimalista para texto',
        category: 'social-media',
        prompt: 'minimalist background for quote about [SUBJECT], soft gradient, blurred texture, calming colors, space for text',
        negativePrompt: 'busy, detailed, distracting'
    },
    {
        id: 'story-vertical',
        name: 'Story Vertical',
        description: 'Formato 9:16',
        category: 'social-media',
        prompt: 'vertical 9:16 story format image of [SUBJECT], immersive, full screen, mobile photography style, engaging',
        negativePrompt: 'landscape, wide, cropped'
    },

    // --- ARCHITECTURE ---
    {
        id: 'modern-architecture',
        name: 'Arquitetura Moderna',
        description: 'Edifícios e interiores modernos',
        category: 'architecture',
        prompt: 'modern architecture of [SUBJECT], architectural photography, golden hour, glass and steel, interior design, 8k',
        negativePrompt: 'old, ruined, dirty, low quality'
    },
    {
        id: 'interior-design',
        name: 'Design de Interiores',
        description: 'Decoração interna',
        category: 'architecture',
        prompt: 'interior design photography of [SUBJECT], scandinavian style, cozy, natural light, plants, minimalist furniture, architectural digest',
        negativePrompt: 'messy, dark, cluttered'
    },
    {
        id: 'minimalist-home',
        name: 'Casa Minimalista',
        description: 'Simples e elegante',
        category: 'architecture',
        prompt: 'minimalist home exterior of [SUBJECT], white concrete, clean lines, blue sky, modern design, zen garden',
        negativePrompt: 'brick, ornate, busy'
    },
    {
        id: 'skyscraper',
        name: 'Arranha-céu',
        description: 'Urbano e alto',
        category: 'architecture',
        prompt: 'futuristic skyscraper [SUBJECT], low angle shot, reflections of clouds, glass facade, metropolis background',
        negativePrompt: 'small, rural, wooden'
    },
    {
        id: 'rustic-cottage',
        name: 'Cabana Rústica',
        description: 'Aconchegante e natural',
        category: 'architecture',
        prompt: 'rustic cottage [SUBJECT] in the woods, stone and wood, smoke from chimney, warm light from windows, cozy atmosphere',
        negativePrompt: 'modern, concrete, cold'
    },
    {
        id: 'industrial-loft',
        name: 'Loft Industrial',
        description: 'Tijolos e metal',
        category: 'architecture',
        prompt: 'industrial loft interior [SUBJECT], exposed brick walls, large windows, metal beams, leather furniture, urban chic',
        negativePrompt: 'traditional, floral, pastel'
    },
    {
        id: 'garden-landscape',
        name: 'Paisagismo',
        description: 'Jardins e áreas externas',
        category: 'architecture',
        prompt: 'landscape architecture of [SUBJECT], manicured garden, stone path, water feature, lush greenery, blooming flowers',
        negativePrompt: 'dead plants, dry, desert'
    },
    {
        id: 'poolside',
        name: 'Área de Piscina',
        description: 'Luxo e lazer',
        category: 'architecture',
        prompt: 'luxury infinity pool [SUBJECT], sunset view, lounge chairs, modern house in background, resort vibe',
        negativePrompt: 'dirty water, small, plastic'
    },
    {
        id: 'futuristic-city',
        name: 'Cidade Futurista',
        description: 'Sci-fi e utopia',
        category: 'architecture',
        prompt: 'futuristic city architecture [SUBJECT], flying cars, vertical gardens, sustainable design, solar panels, utopia',
        negativePrompt: 'dystopia, ruined, dirty'
    },
    {
        id: 'historical-building',
        name: 'Prédio Histórico',
        description: 'Clássico e antigo',
        category: 'architecture',
        prompt: 'historical building [SUBJECT], baroque architecture, intricate details, stone carving, grand entrance, dramatic lighting',
        negativePrompt: 'modern, glass, plain'
    }
];
