export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    prompt: string;
    negativePrompt?: string;
    category: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
    // --- HEALTH AND WELLNESS ---
    {
        id: 'health-clinic-modern',
        name: 'Clínica Médica Moderna',
        description: 'Recepção de clínica médica clean e moderna',
        prompt: 'Modern medical clinic reception, bright and airy, minimalist design, white and soft blue color palette, comfortable seating, plants, professional atmosphere, 8k resolution, photorealistic, architectural photography --ar 16:9',
        category: 'health-wellness'
    },
    {
        id: 'health-nutritionist',
        name: 'Nutricionista com Alimentos',
        description: 'Nutricionista segurando prato saudável',
        prompt: 'Professional nutritionist smiling, holding a bowl of fresh colorful salad, bright kitchen background, healthy lifestyle concept, high quality portrait, soft lighting, 8k --ar 3:2',
        category: 'health-wellness'
    },
    {
        id: 'health-gym-workout',
        name: 'Treino na Academia',
        description: 'Pessoa treinando em academia moderna',
        prompt: 'Fitness model working out in a modern gym, lifting weights, determination on face, dynamic lighting, sweat texture, cinematic shot, depth of field, 8k --ar 16:9',
        category: 'health-wellness'
    },
    {
        id: 'health-yoga-outdoor',
        name: 'Yoga ao Ar Livre',
        description: 'Prática de yoga em parque ao amanhecer',
        prompt: 'Woman practicing yoga in a park at sunrise, golden hour lighting, peaceful atmosphere, nature background, lens flare, zen vibe, photorealistic --ar 16:9',
        category: 'health-wellness'
    },
    {
        id: 'health-dental-care',
        name: 'Consultório Odontológico',
        description: 'Dentista atendendo paciente sorrindo',
        prompt: 'Friendly dentist treating a patient in a modern dental office, bright lighting, professional equipment, clean environment, reassuring atmosphere, 8k --ar 3:2',
        category: 'health-wellness'
    },
    {
        id: 'health-spa-massage',
        name: 'Massagem Relaxante no Spa',
        description: 'Ambiente de spa com velas e massagem',
        prompt: 'Luxury spa setting, massage therapy, dim lighting, candles, orchids, essential oils, relaxing atmosphere, soft focus, high quality texture --ar 16:9',
        category: 'health-wellness'
    },
    {
        id: 'health-physiotherapy',
        name: 'Sessão de Fisioterapia',
        description: 'Fisioterapeuta ajudando paciente',
        prompt: 'Physiotherapist helping a patient with rehabilitation exercises, modern clinic, professional interaction, focus on movement, bright natural light --ar 3:2',
        category: 'health-wellness'
    },
    {
        id: 'health-doctor-consultation',
        name: 'Consulta Médica',
        description: 'Médico conversando com paciente',
        prompt: 'Doctor consulting with a patient, empathetic expression, modern office, stethoscope, medical chart, professional and caring, photorealistic --ar 3:2',
        category: 'health-wellness'
    },
    {
        id: 'health-healthy-food-flatlay',
        name: 'Mesa de Alimentação Saudável',
        description: 'Flatlay de frutas e vegetais frescos',
        prompt: 'Flatlay photography of fresh organic fruits and vegetables, wooden table, healthy eating concept, vibrant colors, natural lighting, high detail --ar 1:1',
        category: 'health-wellness'
    },
    {
        id: 'health-meditation',
        name: 'Meditação Mindfulness',
        description: 'Pessoa meditando em ambiente sereno',
        prompt: 'Person meditating in a serene room, soft morning light, minimalist decor, peaceful expression, mindfulness concept, high resolution --ar 16:9',
        category: 'health-wellness'
    },

    // --- EDUCATION ---
    {
        id: 'edu-modern-classroom',
        name: 'Sala de Aula Moderna',
        description: 'Alunos usando tablets em sala de aula',
        prompt: 'Modern classroom with students using tablets, interactive whiteboard, diverse group of students, engaged learning, bright lighting, educational technology --ar 16:9',
        category: 'education'
    },
    {
        id: 'edu-online-tutor',
        name: 'Tutor Online',
        description: 'Professor dando aula via webcam',
        prompt: 'Friendly online tutor looking at webcam, home office background, headset, teaching math concepts, engaging expression, high quality video call style --ar 3:2',
        category: 'education'
    },
    {
        id: 'edu-library-study',
        name: 'Estudando na Biblioteca',
        description: 'Estudante concentrado em biblioteca',
        prompt: 'University student studying in a classic library, surrounded by books, laptop open, focused expression, warm lighting, academic atmosphere --ar 16:9',
        category: 'education'
    },
    {
        id: 'edu-graduation',
        name: 'Formatura',
        description: 'Grupo de formandos jogando chapéus',
        prompt: 'Group of graduates throwing caps in the air, sunset background, joy and celebration, diverse group, university campus, cinematic lighting --ar 16:9',
        category: 'education'
    },
    {
        id: 'edu-science-lab',
        name: 'Laboratório de Ciências',
        description: 'Experimento em laboratório escolar',
        prompt: 'Students conducting experiment in science lab, safety goggles, colorful liquids in beakers, microscope, focused and curious, educational setting --ar 3:2',
        category: 'education'
    },
    {
        id: 'edu-kids-art',
        name: 'Aula de Artes Infantil',
        description: 'Crianças pintando em sala de aula',
        prompt: 'Kids painting in art class, messy and colorful, happy expressions, creative atmosphere, bright primary colors, high detail --ar 3:2',
        category: 'education'
    },
    {
        id: 'edu-coding-bootcamp',
        name: 'Aula de Programação',
        description: 'Adultos aprendendo a programar',
        prompt: 'Coding bootcamp environment, adults looking at monitors with code, collaborative learning, modern office style, tech education --ar 16:9',
        category: 'education'
    },
    {
        id: 'edu-music-lesson',
        name: 'Aula de Música',
        description: 'Professor ensinando piano',
        prompt: 'Music teacher showing piano chords to a student, close up on hands, sheet music, warm atmosphere, artistic lighting --ar 3:2',
        category: 'education'
    },
    {
        id: 'edu-elearning-concept',
        name: 'Conceito E-Learning',
        description: 'Ilustração 3D de educação digital',
        prompt: '3D illustration of e-learning concept, floating icons of books, graduation cap, laptop, globe, vibrant colors, isometric view, modern design --ar 1:1',
        category: 'education'
    },
    {
        id: 'edu-teacher-portrait',
        name: 'Retrato de Professor',
        description: 'Professor sorrindo no quadro negro',
        prompt: 'Portrait of a friendly teacher standing in front of a blackboard with math formulas, holding a book, warm smile, professional attire, classroom background --ar 2:3',
        category: 'education'
    },

    // --- FOOD AND BEVERAGE ---
    {
        id: 'food-gourmet-dish',
        name: 'Prato Gourmet',
        description: 'Prato de restaurante Michelin',
        prompt: 'Exquisite gourmet dish plating, fine dining restaurant, steak with garnish, artistic presentation, dramatic lighting, macro shot, 8k food photography --ar 3:2',
        category: 'food-beverage'
    },
    {
        id: 'food-coffee-art',
        name: 'Latte Art',
        description: 'Xícara de café com arte no leite',
        prompt: 'Close up of cappuccino with intricate latte art, steam rising, wooden table, coffee beans scattered, cozy coffee shop vibe, warm tones --ar 1:1',
        category: 'food-beverage'
    },
    {
        id: 'food-burger-ad',
        name: 'Hambúrguer Artesanal',
        description: 'Hambúrguer suculento estilo comercial',
        prompt: 'Juicy artisan burger with melting cheese, fresh lettuce, tomato, brioche bun, flying ingredients explosion, commercial food photography, studio lighting, delicious --ar 1:1',
        category: 'food-beverage'
    },
    {
        id: 'food-sushi-platter',
        name: 'Barca de Sushi',
        description: 'Variedade de sushis frescos',
        prompt: 'Assorted sushi platter on slate board, fresh salmon, tuna, rolls, wasabi, ginger, chopsticks, japanese restaurant setting, high detail, vibrant colors --ar 16:9',
        category: 'food-beverage'
    },
    {
        id: 'food-bakery-bread',
        name: 'Pães Artesanais',
        description: 'Cesta de pães na padaria',
        prompt: 'Rustic bakery display, fresh sourdough bread, baguettes, flour dusting, warm golden lighting, artisan baking concept, texture detail --ar 3:2',
        category: 'food-beverage'
    },
    {
        id: 'food-cocktail-bar',
        name: 'Coquetel Colorido',
        description: 'Drink sofisticado em bar',
        prompt: 'Colorful cocktail with garnish on a bar counter, bokeh background of bottles, ice cubes, condensation, nightlife atmosphere, neon accents --ar 2:3',
        category: 'food-beverage'
    },
    {
        id: 'food-pizza-oven',
        name: 'Pizza no Forno a Lenha',
        description: 'Pizza saindo do forno',
        prompt: 'Chef pulling a pizza out of a wood-fired oven, fire in background, bubbling cheese, rustic italian pizzeria, dynamic action shot --ar 16:9',
        category: 'food-beverage'
    },
    {
        id: 'food-ice-cream',
        name: 'Sorvete Artesanal',
        description: 'Casquinha de sorvete colorida',
        prompt: 'Hand holding a colorful gelato cone, summer vibe, blurred street background, melting drip, vibrant pastel colors, happy mood --ar 2:3',
        category: 'food-beverage'
    },
    {
        id: 'food-truck-festival',
        name: 'Festival de Food Truck',
        description: 'Food truck vintage em evento',
        prompt: 'Vintage food truck at a street food festival, string lights, crowd eating, sunset, vibrant atmosphere, chalkboard menu, wide shot --ar 16:9',
        category: 'food-beverage'
    },
    {
        id: 'food-chef-cooking',
        name: 'Chef Cozinhando',
        description: 'Chef finalizando prato na cozinha',
        prompt: 'Professional chef plating a dish in a busy kitchen, steam, focus on hands, stainless steel background, culinary art, intense atmosphere --ar 3:2',
        category: 'food-beverage'
    },

    // --- LEGAL AND FINANCIAL ---
    {
        id: 'legal-law-office',
        name: 'Escritório de Advocacia',
        description: 'Sala de reunião luxuosa',
        prompt: 'Luxury law firm conference room, mahogany table, leather chairs, view of city skyline, law books, professional and authoritative atmosphere --ar 16:9',
        category: 'legal-financial'
    },
    {
        id: 'legal-scales-justice',
        name: 'Balança da Justiça',
        description: 'Símbolo da justiça em mesa',
        prompt: 'Golden scales of justice on a wooden desk, gavel, blurred law library background, dramatic lighting, legal concept, high resolution --ar 3:2',
        category: 'legal-financial'
    },
    {
        id: 'fin-consultant-meeting',
        name: 'Reunião Financeira',
        description: 'Consultor mostrando gráficos em tablet',
        prompt: 'Financial advisor showing investment charts on a tablet to a couple, modern office, professional attire, trust and growth concept, bright lighting --ar 3:2',
        category: 'legal-financial'
    },
    {
        id: 'fin-stock-market',
        name: 'Mercado de Ações',
        description: 'Telas com gráficos de bolsa',
        prompt: 'Stock market trading desk, multiple monitors with candlesticks charts, financial data, blurred busy background, tech finance vibe, blue tones --ar 16:9',
        category: 'legal-financial'
    },
    {
        id: 'fin-piggy-bank',
        name: 'Economia e Poupança',
        description: 'Cofrinho com moedas',
        prompt: 'Pink piggy bank on a desk, stack of gold coins, plant, saving money concept, clean minimalist background, soft lighting --ar 1:1',
        category: 'legal-financial'
    },
    {
        id: 'legal-signing-contract',
        name: 'Assinando Contrato',
        description: 'Mão assinando documento importante',
        prompt: 'Close up of a hand signing a contract with a fountain pen, business suit, focus on the pen tip, important deal, corporate atmosphere --ar 3:2',
        category: 'legal-financial'
    },
    {
        id: 'fin-calculator-tax',
        name: 'Cálculo de Impostos',
        description: 'Calculadora e documentos fiscais',
        prompt: 'Calculator, tax forms, glasses, and a pen on a desk, accounting concept, tax season, organized workspace, top down view --ar 3:2',
        category: 'legal-financial'
    },
    {
        id: 'fin-real-estate-keys',
        name: 'Chaves da Casa Nova',
        description: 'Mão entregando chaves de casa',
        prompt: 'Real estate agent handing keys to a new homeowner, blurred house in background, happy moment, success, close up on hands and keys --ar 3:2',
        category: 'legal-financial'
    },
    {
        id: 'fin-crypto-concept',
        name: 'Criptomoeda',
        description: 'Moeda Bitcoin física 3D',
        prompt: 'Golden physical Bitcoin coin on a circuit board background, digital currency concept, glowing blue lights, futuristic finance, macro shot --ar 16:9',
        category: 'legal-financial'
    },
    {
        id: 'legal-team-portrait',
        name: 'Equipe Jurídica',
        description: 'Grupo de advogados confiantes',
        prompt: 'Portrait of a legal team standing in a modern office lobby, arms crossed, confident smiles, business suits, professional corporate photography --ar 16:9',
        category: 'legal-financial'
    },

    // --- FASHION AND BEAUTY ---
    {
        id: 'fashion-runway',
        name: 'Desfile de Moda',
        description: 'Modelo na passarela',
        prompt: 'Fashion model walking on runway, avant-garde outfit, dramatic spotlight, audience in dark background, high fashion, dynamic pose, full body shot --ar 2:3',
        category: 'fashion-beauty'
    },
    {
        id: 'beauty-makeup-macro',
        name: 'Maquiagem Macro',
        description: 'Close no olho com maquiagem artística',
        prompt: 'Macro photography of an eye with artistic colorful makeup, glitter, long lashes, detailed iris, beauty editorial style, high resolution --ar 1:1',
        category: 'fashion-beauty'
    },
    {
        id: 'fashion-street-style',
        name: 'Estilo Urbano',
        description: 'Modelo em cenário urbano',
        prompt: 'Street style fashion photography, trendy outfit, city street background, natural lighting, candid pose, influencer vibe, urban chic --ar 2:3',
        category: 'fashion-beauty'
    },
    {
        id: 'beauty-hair-salon',
        name: 'Salão de Beleza',
        description: 'Cabeleireiro estilizando cabelo',
        prompt: 'Hair stylist blow drying long hair, salon mirror reflection, beauty salon environment, professional tools, hair movement, bright lighting --ar 3:2',
        category: 'fashion-beauty'
    },
    {
        id: 'fashion-clothing-store',
        name: 'Loja de Roupas',
        description: 'Interior de boutique minimalista',
        prompt: 'Minimalist clothing boutique interior, racks of clothes, neutral colors, modern design, soft lighting, elegant shopping atmosphere --ar 16:9',
        category: 'fashion-beauty'
    },
    {
        id: 'beauty-skincare-product',
        name: 'Produto de Skincare',
        description: 'Frasco de creme em cenário natural',
        prompt: 'Luxury skincare product bottle on a stone podium, water splash, green leaves, natural lighting, product photography, fresh and clean vibe --ar 1:1',
        category: 'fashion-beauty'
    },
    {
        id: 'fashion-design-sketch',
        name: 'Croqui de Moda',
        description: 'Designer desenhando roupa',
        prompt: 'Fashion designer sketching a dress on paper, fabric swatches, pencils, creative workspace, close up on hands, artistic process --ar 3:2',
        category: 'fashion-beauty'
    },
    {
        id: 'beauty-manicure',
        name: 'Manicure Nail Art',
        description: 'Unhas decoradas em destaque',
        prompt: 'Close up of hands with intricate nail art, holding a flower, soft background, beauty salon, elegant and detailed --ar 1:1',
        category: 'fashion-beauty'
    },
    {
        id: 'fashion-accessories',
        name: 'Acessórios de Luxo',
        description: 'Bolsa e sapatos em display',
        prompt: 'Luxury leather handbag and high heels display, marble background, gold accents, fashion editorial still life, studio lighting --ar 3:2',
        category: 'fashion-beauty'
    },
    {
        id: 'beauty-portrait',
        name: 'Retrato de Beleza',
        description: 'Rosto feminino com pele perfeita',
        prompt: 'Beauty portrait of a woman with glowing skin, natural makeup, wind in hair, soft studio lighting, retouching style, high end beauty photography --ar 2:3',
        category: 'fashion-beauty'
    },

    // --- TECHNOLOGY ---
    {
        id: 'tech-developer-coding',
        name: 'Programador Codando',
        description: 'Desenvolvedor focado com múltiplas telas',
        prompt: 'Software developer working late at night, multiple monitors with matrix code, mechanical keyboard, neon lighting, cyberpunk vibe, focus and concentration --ar 16:9',
        category: 'technology'
    },
    {
        id: 'tech-vr-experience',
        name: 'Realidade Virtual',
        description: 'Pessoa usando óculos VR',
        prompt: 'Person wearing a VR headset, reaching out to touch virtual objects, futuristic blue lighting, immersive technology concept, dynamic angle --ar 16:9',
        category: 'technology'
    },
    {
        id: 'tech-server-room',
        name: 'Data Center',
        description: 'Corredor de servidores iluminado',
        prompt: 'Futuristic server room corridor, rows of server racks with blinking blue and green lights, clean white floor, data center, high tech infrastructure --ar 16:9',
        category: 'technology'
    },
    {
        id: 'tech-robot-ai',
        name: 'Robô IA',
        description: 'Rosto de robô humanoide',
        prompt: 'Close up of a humanoid robot face, intricate mechanical details, glowing eyes, artificial intelligence concept, sci-fi style, hyperrealistic --ar 1:1',
        category: 'technology'
    },
    {
        id: 'tech-startup-office',
        name: 'Escritório Startup',
        description: 'Ambiente de trabalho colaborativo',
        prompt: 'Modern open plan startup office, bean bags, glass walls, young team collaborating, whiteboard with ideas, energetic atmosphere, bright daylight --ar 16:9',
        category: 'technology'
    },
    {
        id: 'tech-circuit-board',
        name: 'Placa de Circuito',
        description: 'Macro de processador e circuitos',
        prompt: 'Macro shot of a computer motherboard, CPU, gold pins, intricate circuits, depth of field, technology background, blue and orange lighting --ar 16:9',
        category: 'technology'
    },
    {
        id: 'tech-smart-home',
        name: 'Casa Inteligente',
        description: 'Interface de controle de smart home',
        prompt: 'Modern living room with holographic smart home interface, controlling lights and temperature, futuristic lifestyle, clean design, 3d render --ar 16:9',
        category: 'technology'
    },
    {
        id: 'tech-cyber-security',
        name: 'Cibersegurança',
        description: 'Cadeado digital e código',
        prompt: 'Digital padlock symbol made of glowing code, dark background, shield, cyber security concept, protection, hacker theme, abstract representation --ar 16:9',
        category: 'technology'
    },
    {
        id: 'tech-drone-flying',
        name: 'Drone em Voo',
        description: 'Drone filmando paisagem',
        prompt: 'Professional camera drone flying over a city at sunset, propellers spinning, cinematic angle, aerial technology, action shot --ar 16:9',
        category: 'technology'
    },
    {
        id: 'tech-app-ui',
        name: 'Interface de App',
        description: 'Design de UI/UX em celular',
        prompt: 'Smartphone displaying a sleek modern app interface, floating UI elements, glassmorphism style, vibrant colors, user experience design concept --ar 2:3',
        category: 'technology'
    },

    // --- CONSTRUCTION AND SERVICES ---
    {
        id: 'const-architect-blueprint',
        name: 'Arquiteto e Planta',
        description: 'Arquiteto revisando planta baixa',
        prompt: 'Architect reviewing blueprints on a large table, hard hat, ruler, construction site in background through window, professional focus, detailed --ar 3:2',
        category: 'construction-services'
    },
    {
        id: 'const-modern-house',
        name: 'Casa Moderna',
        description: 'Exterior de casa contemporânea',
        prompt: 'Exterior of a modern luxury house, glass facade, concrete and wood elements, swimming pool, sunset lighting, architectural photography, photorealistic --ar 16:9',
        category: 'construction-services'
    },
    {
        id: 'const-interior-design',
        name: 'Design de Interiores',
        description: 'Sala de estar decorada',
        prompt: 'Interior design of a spacious living room, scandinavian style, beige sofa, large windows, indoor plants, cozy and elegant, magazine quality --ar 16:9',
        category: 'construction-services'
    },
    {
        id: 'const-worker-site',
        name: 'Trabalhador na Obra',
        description: 'Operário com EPI em construção',
        prompt: 'Construction worker wearing safety gear and helmet, holding a drill, building frame background, golden hour, industrial atmosphere, heroic angle --ar 2:3',
        category: 'construction-services'
    },
    {
        id: 'const-renovation',
        name: 'Reforma Residencial',
        description: 'Pintando parede de sala',
        prompt: 'Couple painting a wall in their new home, rollers, paint buckets, protective sheet, happy renovation concept, bright and messy --ar 3:2',
        category: 'construction-services'
    },
    {
        id: 'const-landscaping',
        name: 'Paisagismo',
        description: 'Jardim bem cuidado',
        prompt: 'Beautiful landscaped garden, stone path, manicured lawn, colorful flower beds, fountain, sunny day, residential landscaping --ar 16:9',
        category: 'construction-services'
    },
    {
        id: 'const-carpentry',
        name: 'Marcenaria',
        description: 'Marceneiro trabalhando na madeira',
        prompt: 'Carpenter sanding a wooden table in workshop, sawdust flying, focus on hands and wood texture, warm lighting, craftsmanship --ar 3:2',
        category: 'construction-services'
    },
    {
        id: 'const-solar-panels',
        name: 'Painéis Solares',
        description: 'Instalação de energia solar',
        prompt: 'Technician installing solar panels on a roof, blue sky, renewable energy concept, green technology, bright and clean image --ar 16:9',
        category: 'construction-services'
    },
    {
        id: 'const-plumbing',
        name: 'Serviço de Encanamento',
        description: 'Encanador consertando pia',
        prompt: 'Plumber fixing a sink pipe with a wrench, under cabinet view, tool belt, professional service, focus on the task --ar 3:2',
        category: 'construction-services'
    },
    {
        id: 'const-3d-render',
        name: 'Render 3D Arquitetônico',
        description: 'Visualização 3D de prédio',
        prompt: 'Photorealistic 3D render of a commercial building, busy street, people walking, cars, daylight, architectural visualization style --ar 16:9',
        category: 'construction-services'
    },

    // --- EVENTS AND ENTERTAINMENT ---
    {
        id: 'event-concert-dj',
        name: 'DJ em Festival',
        description: 'DJ tocando para multidão',
        prompt: 'DJ performing at a music festival, hands on mixer, crowd cheering, laser lights, confetti, energetic atmosphere, night time, vibrant colors --ar 16:9',
        category: 'events-entertainment'
    },
    {
        id: 'event-wedding-couple',
        name: 'Casamento Romântico',
        description: 'Noivos em cenário idílico',
        prompt: 'Wedding couple standing under a floral arch, sunset light, romantic atmosphere, bride in white dress, groom in suit, soft bokeh, love concept --ar 2:3',
        category: 'events-entertainment'
    },
    {
        id: 'event-catering-buffet',
        name: 'Buffet de Evento',
        description: 'Mesa de buffet luxuosa',
        prompt: 'Elegant catering buffet setup, silver chafing dishes, gourmet appetizers, champagne glasses, floral centerpiece, wedding reception vibe --ar 16:9',
        category: 'events-entertainment'
    },
    {
        id: 'event-birthday-party',
        name: 'Festa de Aniversário',
        description: 'Crianças soprando velas',
        prompt: 'Happy child blowing out candles on a birthday cake, balloons, party hats, friends clapping, joyful moment, warm lighting --ar 3:2',
        category: 'events-entertainment'
    },
    {
        id: 'event-corporate-conference',
        name: 'Conferência Corporativa',
        description: 'Palestrante no palco',
        prompt: 'Keynote speaker on stage at a corporate conference, large screen behind, audience listening, spotlight, professional event atmosphere --ar 16:9',
        category: 'events-entertainment'
    },
    {
        id: 'event-photographer',
        name: 'Fotógrafo de Eventos',
        description: 'Fotógrafo capturando momento',
        prompt: 'Event photographer holding a camera with flash, taking a photo of a crowd, blurred background lights, professional gear, action shot --ar 3:2',
        category: 'events-entertainment'
    },
    {
        id: 'event-concert-crowd',
        name: 'Multidão em Show',
        description: 'Público com mãos para cima',
        prompt: 'Concert crowd silhouette with hands raised, stage lights, smoke, excitement, music festival vibe, wide shot --ar 16:9',
        category: 'events-entertainment'
    },
    {
        id: 'event-decoration',
        name: 'Decoração de Festa',
        description: 'Detalhes de decoração de mesa',
        prompt: 'Close up of elegant table setting for a gala dinner, candles, flowers, crystal glasses, gold cutlery, luxury event design --ar 3:2',
        category: 'events-entertainment'
    },
    {
        id: 'event-live-band',
        name: 'Banda ao Vivo',
        description: 'Banda tocando em bar',
        prompt: 'Live jazz band performing in a dimly lit bar, saxophone player in focus, moody atmosphere, vintage microphone, artistic shot --ar 16:9',
        category: 'events-entertainment'
    },
    {
        id: 'event-balloons',
        name: 'Arco de Balões',
        description: 'Decoração colorida com balões',
        prompt: 'Colorful balloon arch entrance for a party, pastel colors, streamers, festive background, bright and cheerful --ar 2:3',
        category: 'events-entertainment'
    },

    // --- AUTOMOTIVE ---
    {
        id: 'auto-sports-car',
        name: 'Carro Esportivo',
        description: 'Supercarro em estrada cênica',
        prompt: 'Red sports car driving on a coastal road at sunset, motion blur, sleek design, reflections, cinematic automotive photography, 8k --ar 16:9',
        category: 'automotive'
    },
    {
        id: 'auto-mechanic-shop',
        name: 'Oficina Mecânica',
        description: 'Mecânico consertando motor',
        prompt: 'Mechanic working under the hood of a car, grease on hands, garage environment, tools, focused expression, industrial lighting --ar 3:2',
        category: 'automotive'
    },
    {
        id: 'auto-detailing',
        name: 'Detalhamento Automotivo',
        description: 'Polimento de carro',
        prompt: 'Professional car detailing, polishing a black car hood, reflection, foam soap, sponge, high gloss finish, clean and shiny --ar 3:2',
        category: 'automotive'
    },
    {
        id: 'auto-dealership',
        name: 'Concessionária',
        description: 'Showroom de carros novos',
        prompt: 'Modern car dealership showroom, shiny new cars lined up, glass walls, bright lighting, clean floor, luxury sales environment --ar 16:9',
        category: 'automotive'
    },
    {
        id: 'auto-parts',
        name: 'Peças Automotivas',
        description: 'Motor e peças em display',
        prompt: 'Car engine parts disassembled, gears, pistons, metallic texture, oil, mechanical engineering, studio lighting, high detail --ar 16:9',
        category: 'automotive'
    },
    {
        id: 'auto-vintage-classic',
        name: 'Carro Clássico',
        description: 'Carro antigo restaurado',
        prompt: 'Vintage classic car parked on a cobblestone street, chrome details, nostalgic vibe, sepia tone, elegant automotive history --ar 3:2',
        category: 'automotive'
    },
    {
        id: 'auto-car-wash',
        name: 'Lava-Rápido',
        description: 'Carro sendo lavado com espuma',
        prompt: 'Car in a car wash tunnel, covered in white foam, blue brushes spinning, water spray, dynamic action, clean concept --ar 16:9',
        category: 'automotive'
    },
    {
        id: 'auto-interior',
        name: 'Interior de Luxo',
        description: 'Painel de carro de luxo',
        prompt: 'Interior view of a luxury car, leather seats, steering wheel, dashboard screen, ambient lighting, premium materials, driver point of view --ar 16:9',
        category: 'automotive'
    },
    {
        id: 'auto-offroad',
        name: 'Off-Road 4x4',
        description: 'Jeep na lama',
        prompt: '4x4 vehicle driving through mud and water splash, forest background, off-road adventure, rugged tires, action photography --ar 16:9',
        category: 'automotive'
    },
    {
        id: 'auto-electric-charging',
        name: 'Carregamento Elétrico',
        description: 'Carro elétrico carregando',
        prompt: 'Electric car plugged into a charging station, green led light, futuristic city background, sustainable transport concept --ar 16:9',
        category: 'automotive'
    },

    // --- PETS ---
    {
        id: 'pets-dog-park',
        name: 'Cachorro no Parque',
        description: 'Golden Retriever correndo feliz',
        prompt: 'Golden Retriever running in a park, tongue out, ears flapping, catching a ball, sunny day, green grass, shallow depth of field, happy dog --ar 3:2',
        category: 'pets'
    },
    {
        id: 'pets-cat-window',
        name: 'Gato na Janela',
        description: 'Gato olhando a chuva',
        prompt: 'Fluffy cat sitting by a window with rain drops, looking outside, cozy indoor atmosphere, soft lighting, reflection, cute and moody --ar 3:2',
        category: 'pets'
    },
    {
        id: 'pets-veterinarian',
        name: 'Consulta Veterinária',
        description: 'Vet examinando filhote',
        prompt: 'Veterinarian examining a cute puppy on a metal table, stethoscope, smiling vet, clean clinic background, care and love for animals --ar 3:2',
        category: 'pets'
    },
    {
        id: 'pets-grooming',
        name: 'Banho e Tosa',
        description: 'Cachorro tomando banho',
        prompt: 'Dog getting a bath in a grooming salon, bubbles on head, wet fur, groomer hands, funny expression, bright and clean environment --ar 1:1',
        category: 'pets'
    },
    {
        id: 'pets-parrot',
        name: 'Papagaio Colorido',
        description: 'Arara em galho',
        prompt: 'Colorful macaw parrot perched on a branch, vibrant tropical feathers, jungle background, sharp focus on eye, nature photography --ar 2:3',
        category: 'pets'
    },
    {
        id: 'pets-aquarium',
        name: 'Aquário',
        description: 'Peixe Betta nadando',
        prompt: 'Betta fish swimming in an aquarium, flowing fins, blue and red colors, black background, macro underwater photography, elegant movement --ar 16:9',
        category: 'pets'
    },
    {
        id: 'pets-sleeping-puppy',
        name: 'Filhote Dormindo',
        description: 'Cachorrinho dormindo em manta',
        prompt: 'Tiny puppy sleeping on a soft knitted blanket, peaceful, close up, warm tones, adorable and cozy --ar 16:9',
        category: 'pets'
    },
    {
        id: 'pets-dog-training',
        name: 'Adestramento',
        description: 'Cachorro dando a pata',
        prompt: 'Dog training session, border collie shaking hands with trainer, treat in hand, outdoor park, focus on interaction, obedience --ar 3:2',
        category: 'pets'
    },
    {
        id: 'pets-hamster',
        name: 'Hamster Fofo',
        description: 'Hamster comendo semente',
        prompt: 'Cute hamster holding a sunflower seed, chubby cheeks, sawdust bedding, macro shot, soft lighting, adorable pet --ar 1:1',
        category: 'pets'
    },
    {
        id: 'pets-cat-play',
        name: 'Gato Brincando',
        description: 'Gato pulando em brinquedo',
        prompt: 'Action shot of a cat jumping to catch a feather toy, mid-air, claws out, focused eyes, living room background, dynamic movement --ar 16:9',
        category: 'pets'
    },

    // --- MARKETING AND COMMUNICATION ---
    {
        id: 'mkt-strategy-meeting',
        name: 'Reunião de Estratégia',
        description: 'Equipe discutindo em quadro branco',
        prompt: 'Marketing team brainstorming in front of a whiteboard with sticky notes, pointing at diagrams, diverse group, creative office, collaboration --ar 16:9',
        category: 'marketing-communication'
    },
    {
        id: 'mkt-social-media-concept',
        name: 'Conceito Redes Sociais',
        description: 'Ícones de social media 3D',
        prompt: '3D floating icons of social media platforms (like, share, comment), pastel colors, mobile phone in center, digital marketing concept, clean background --ar 1:1',
        category: 'marketing-communication'
    },
    {
        id: 'mkt-analytics-dashboard',
        name: 'Dashboard de Analytics',
        description: 'Telas com gráficos de crescimento',
        prompt: 'Futuristic analytics dashboard on a screen, glowing graphs showing upward trend, data visualization, business growth, tech blue interface --ar 16:9',
        category: 'marketing-communication'
    },
    {
        id: 'mkt-influencer',
        name: 'Influencer Gravando',
        description: 'Pessoa gravando vlog com ring light',
        prompt: 'Social media influencer recording a video with a smartphone and ring light, happy expression, holding a product, colorful room background --ar 2:3',
        category: 'marketing-communication'
    },
    {
        id: 'mkt-seo-concept',
        name: 'Conceito SEO',
        description: 'Lupa sobre palavras-chave',
        prompt: 'Magnifying glass focusing on the word SEO on a laptop screen, code in background, search engine optimization concept, professional desk --ar 16:9',
        category: 'marketing-communication'
    },
    {
        id: 'mkt-podcast-setup',
        name: 'Estúdio de Podcast',
        description: 'Microfone profissional em estúdio',
        prompt: 'Professional podcast microphone in a studio, headphones, "On Air" sign, soundproofing foam, moody lighting, broadcasting concept --ar 1:1',
        category: 'marketing-communication'
    },
    {
        id: 'mkt-email-marketing',
        name: 'Email Marketing',
        description: 'Envelope aberto com notificação',
        prompt: '3D illustration of an open envelope with a notification bubble, email marketing concept, flying paper planes, blue and white theme, clean design --ar 16:9',
        category: 'marketing-communication'
    },
    {
        id: 'mkt-brand-identity',
        name: 'Identidade Visual',
        description: 'Papelaria corporativa e logo',
        prompt: 'Brand identity mockup, business cards, letterhead, notebook, pen, minimalist design, logo placeholder, overhead shot, clean desk --ar 3:2',
        category: 'marketing-communication'
    },
    {
        id: 'mkt-target-audience',
        name: 'Público Alvo',
        description: 'Alvo com flecha no centro',
        prompt: 'Bullseye target with an arrow in the center, business background, success concept, targeting audience, sharp focus, high contrast --ar 1:1',
        category: 'marketing-communication'
    },
    {
        id: 'mkt-content-creation',
        name: 'Criação de Conteúdo',
        description: 'Workspace de criador com câmera e laptop',
        prompt: 'Content creator workspace, camera, laptop with editing software, coffee, notebook, creative mess, warm lighting, top down view --ar 16:9',
        category: 'marketing-communication'
    }
];
