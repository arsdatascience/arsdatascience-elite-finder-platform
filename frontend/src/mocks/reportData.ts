
// --- GOOGLE ADS MOCK DATA ---

export const GOOGLE_SEARCH_TERMS = [
    { term: 'agência de marketing digital', impressions: 12500, clicks: 450, ctr: '3.6%', cost: 1250.00, conversions: 12, costPerConv: 104.16 },
    { term: 'gestão de tráfego pago', impressions: 8900, clicks: 320, ctr: '3.5%', cost: 980.50, conversions: 18, costPerConv: 54.47 },
    { term: 'consultoria marketing', impressions: 5400, clicks: 180, ctr: '3.3%', cost: 750.00, conversions: 5, costPerConv: 150.00 },
    { term: 'empresa de seo', impressions: 4200, clicks: 150, ctr: '3.5%', cost: 620.00, conversions: 8, costPerConv: 77.50 },
    { term: 'serviços de marketing', impressions: 3800, clicks: 120, ctr: '3.1%', cost: 450.00, conversions: 3, costPerConv: 150.00 },
];

export const GOOGLE_AUCTION_INSIGHTS = [
    { domain: 'Sua Empresa', impressionShare: '65%', overlapRate: '-', outrankingShare: '-', posAboveRate: '-', topOfPageRate: '85%' },
    { domain: 'concorrente-a.com.br', impressionShare: '42%', overlapRate: '35%', outrankingShare: '45%', posAboveRate: '15%', topOfPageRate: '70%' },
    { domain: 'concorrente-b.com.br', impressionShare: '38%', overlapRate: '28%', outrankingShare: '52%', posAboveRate: '12%', topOfPageRate: '65%' },
    { domain: 'concorrente-c.com.br', impressionShare: '25%', overlapRate: '15%', outrankingShare: '68%', posAboveRate: '8%', topOfPageRate: '55%' },
];

export const GOOGLE_TOP_ADS = [
    { headline: 'Acelere suas Vendas | Marketing de Performance', clicks: 850, ctr: '4.2%', conversions: 45, type: 'Responsive Search' },
    { headline: 'Especialistas em Tráfego Pago | Agende uma Consultoria', clicks: 620, ctr: '3.8%', conversions: 32, type: 'Expanded Text' },
    { headline: 'Gestão de Redes Sociais Profissional', clicks: 450, ctr: '3.1%', conversions: 15, type: 'Responsive Search' },
];

export const GOOGLE_KEYWORDS = [
    { keyword: 'marketing digital', matchType: 'Exata', clicks: 520, cpc: 2.50, cost: 1300, conversions: 25 },
    { keyword: 'gestão de trafego', matchType: 'Frase', clicks: 410, cpc: 3.20, cost: 1312, conversions: 30 },
    { keyword: 'agencia de marketing', matchType: 'Ampla Modificada', clicks: 350, cpc: 2.80, cost: 980, conversions: 15 },
    { keyword: 'consultoria seo', matchType: 'Exata', clicks: 200, cpc: 4.50, cost: 900, conversions: 10 },
];

export const GOOGLE_DEMOGRAPHICS = [
    { ageGroup: '18-24', percentage: 15 },
    { ageGroup: '25-34', percentage: 45 },
    { ageGroup: '35-44', percentage: 25 },
    { ageGroup: '45-54', percentage: 10 },
    { ageGroup: '55+', percentage: 5 },
];

export const GOOGLE_DEVICES = [
    { device: 'Mobile', clicks: 2500, cost: 4500, conversions: 80 },
    { device: 'Desktop', clicks: 900, cost: 2200, conversions: 45 },
    { device: 'Tablet', clicks: 150, cost: 350, conversions: 5 },
];

// --- META ADS MOCK DATA ---

export const META_CAMPAIGNS = [
    { name: 'Prospecting - Cold Traffic', reach: 45000, impressions: 120000, frequency: 2.66, ctr: '1.2%', cpc: 1.50, purchases: 45, roas: 3.5 },
    { name: 'Retargeting - Website Visitors', reach: 12000, impressions: 45000, frequency: 3.75, ctr: '2.5%', cpc: 2.10, purchases: 38, roas: 8.2 },
    { name: 'Lookalike 1% - Purchasers', reach: 85000, impressions: 150000, frequency: 1.76, ctr: '1.5%', cpc: 1.30, purchases: 52, roas: 4.1 },
    { name: 'Brand Awareness - Top Funnel', reach: 250000, impressions: 300000, frequency: 1.20, ctr: '0.8%', cpc: 0.50, purchases: 5, roas: 0.8 },
];

export const META_CREATIVES = [
    { name: 'Video - Depoimento Cliente', type: 'Vídeo', spend: 2500, impressions: 85000, clicks: 1200, ctr: '1.41%', roas: 4.5, thumb: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=100&h=100&fit=crop' },
    { name: 'Imagem - Oferta Especial', type: 'Imagem', spend: 1800, impressions: 65000, clicks: 950, ctr: '1.46%', roas: 3.8, thumb: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=100&h=100&fit=crop' },
    { name: 'Carrossel - Benefícios', type: 'Carrossel', spend: 3200, impressions: 95000, clicks: 1800, ctr: '1.89%', roas: 5.2, thumb: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=100&h=100&fit=crop' },
];

export const META_PLACEMENTS = [
    { name: 'Feeds (FB/IG)', percentage: 45, color: '#4267B2' },
    { name: 'Stories (FB/IG)', percentage: 35, color: '#C13584' },
    { name: 'Reels', percentage: 15, color: '#E1306C' },
    { name: 'Audience Network', percentage: 5, color: '#606770' },
];

export const META_DEMOGRAPHICS = [
    { gender: 'Mulheres', percentage: 65, color: '#ec4899' },
    { gender: 'Homens', percentage: 35, color: '#3b82f6' },
];

export const META_REACH_FREQUENCY = [
    { day: 'Seg', reach: 12000, frequency: 1.2 },
    { day: 'Ter', reach: 14500, frequency: 1.3 },
    { day: 'Qua', reach: 13200, frequency: 1.2 },
    { day: 'Qui', reach: 15800, frequency: 1.4 },
    { day: 'Sex', reach: 16500, frequency: 1.5 },
    { day: 'Sáb', reach: 18000, frequency: 1.6 },
    { day: 'Dom', reach: 19500, frequency: 1.7 },
];

// --- CROSS-PLATFORM DATA ---

export const CONVERSION_FUNNEL_DETAILED = [
    { stage: 'Impressões', google: 150000, meta: 450000, total: 600000 },
    { stage: 'Cliques', google: 4500, meta: 6800, total: 11300 },
    { stage: 'Leads', google: 350, meta: 280, total: 630 },
    { stage: 'Oportunidades', google: 120, meta: 95, total: 215 },
    { stage: 'Vendas', google: 45, meta: 32, total: 77 },
];
