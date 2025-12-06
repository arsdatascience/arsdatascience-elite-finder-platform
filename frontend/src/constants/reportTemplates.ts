import { LayoutDashboard, Target, Users, Megaphone, ShoppingBag, Search, BarChart3, TrendingUp, Layers, MousePointer2 } from 'lucide-react';

export interface ReportTemplate {
    id: string;
    title: string;
    description: string;
    platform: 'google' | 'meta' | 'all';
    category: 'performance' | 'audience' | 'creative' | 'specialized';
    icon: any;
    widgets: string[]; // IDs of widgets to show
    filters?: {
        metricType?: string[];
        dimension?: string;
    };
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
    // --- GOOGLE ADS ---

    // 1. Desempenho de Campanhas
    {
        id: 'google_performance',
        title: 'Performance de Campanhas',
        description: 'Impressões, Cliques, CTR, Custo e Conversões.',
        platform: 'google',
        category: 'performance',
        icon: TrendingUp,
        widgets: ['kpis', 'top_campaigns', 'finance_chart', 'conversion_funnel'],
        filters: { metricType: ['impressions', 'clicks', 'ctr', 'cost', 'conversions'] }
    },
    // 2. Termos de Pesquisa & Leilão
    {
        id: 'google_search_terms',
        title: 'Termos de Pesquisa & Leilão',
        description: 'Quais buscas acionaram seus anúncios e comparação com concorrentes.',
        platform: 'google',
        category: 'performance',
        icon: Search,
        widgets: ['search_terms_table', 'auction_insights', 'kpis'],
        filters: {}
    },
    // 3. Anúncios e Grupos
    {
        id: 'google_ads_groups',
        title: 'Anúncios e Grupos',
        description: 'Performance individual de anúncios e análise de extensões.',
        platform: 'google',
        category: 'creative',
        icon: Megaphone,
        widgets: ['top_ads', 'ad_extensions', 'kpis'],
        filters: {}
    },
    // 4. Públicos e Palavras-chave
    {
        id: 'google_audiences',
        title: 'Públicos e Palavras-chave',
        description: 'Performance por KW, demografia, geolocalização e dispositivos.',
        platform: 'google',
        category: 'audience',
        icon: Target,
        widgets: ['keyword_performance', 'demographics_chart', 'geo_heatmap', 'device_breakdown'],
        filters: {}
    },
    // 5. Especializados (Shopping, GA4)
    {
        id: 'google_specialized',
        title: 'E-commerce & Shopping',
        description: 'Performance de Shopping e comportamento pós-clique (GA4).',
        platform: 'google',
        category: 'specialized',
        icon: ShoppingBag,
        widgets: ['shopping_performance', 'ga4_behavior', 'conversion_attribution'],
        filters: {}
    },

    // --- META ADS ---

    // 1. Campanhas (Visão Geral)
    {
        id: 'meta_performance',
        title: 'Performance Meta Ads',
        description: 'Alcance, frequência, impressões e engajamento por campanha.',
        platform: 'meta',
        category: 'performance',
        icon: BarChart3,
        widgets: ['kpis', 'meta_campaigns_table', 'reach_frequency', 'engagement_chart'],
        filters: { metricType: ['reach', 'impressions', 'frequency', 'engagement'] }
    },
    // 2. Públicos (Demografia + Posicionamento)
    {
        id: 'meta_audiences',
        title: 'Análise de Públicos',
        description: 'Idade, Gênero, Localização e Posicionamentos (Reels, Stories).',
        platform: 'meta',
        category: 'audience',
        icon: Users,
        widgets: ['demographics_chart', 'placements_chart', 'custom_audiences'],
        filters: {}
    },
    // 3. Criativos
    {
        id: 'meta_creative',
        title: 'Análise de Criativos',
        description: 'Performance por formato (Vídeo, Imagem, Carrossel).',
        platform: 'meta',
        category: 'creative',
        icon: Layers,
        widgets: ['creative_performance', 'format_breakdown', 'top_creatives'],
        filters: {}
    },
    // 4. Especializados (Sales, Pixel)
    {
        id: 'meta_specialized',
        title: 'Conversões & Vendas',
        description: 'Atribuição, Eventos do Pixel e Vendas de Catálogo.',
        platform: 'meta',
        category: 'specialized',
        icon: MousePointer2,
        widgets: ['pixel_events', 'catalog_sales', 'attribution_model'],
        filters: {}
    }
];
