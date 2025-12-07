-- =====================================================
-- CLIENT METRICS TABLE
-- Daily metrics tracking for clients
-- =====================================================

CREATE TABLE IF NOT EXISTS client_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- ============================================
    -- TEMPORAL
    -- ============================================
    date DATE NOT NULL,
    day_of_week INTEGER,              -- 0-6 (Domingo a Sábado)
    week_of_year INTEGER,             -- 1-53
    month INTEGER,                    -- 1-12
    quarter INTEGER,                  -- 1-4
    year INTEGER,                     -- 2024, 2025...
    is_weekend BOOLEAN DEFAULT FALSE,
    is_holiday BOOLEAN DEFAULT FALSE,
    holiday_name VARCHAR(100),        -- "Natal", "Black Friday", etc
    
    -- ============================================
    -- VENDAS E RECEITA
    -- ============================================
    revenue DECIMAL(12, 2),                 -- Receita total do dia
    gross_revenue DECIMAL(12, 2),           -- Receita bruta (antes descontos)
    net_revenue DECIMAL(12, 2),             -- Receita líquida (após devoluções)
    discount_amount DECIMAL(12, 2),         -- Total de descontos aplicados
    refund_amount DECIMAL(12, 2),           -- Total de devoluções
    tax_amount DECIMAL(12, 2),              -- Impostos
    shipping_revenue DECIMAL(12, 2),        -- Receita de frete
    
    -- ============================================
    -- TRANSAÇÕES E PEDIDOS
    -- ============================================
    orders INTEGER,                         -- Número de pedidos
    transactions INTEGER,                   -- Transações totais
    completed_orders INTEGER,               -- Pedidos concluídos
    canceled_orders INTEGER,                -- Pedidos cancelados
    pending_orders INTEGER,                 -- Pedidos pendentes
    avg_order_value DECIMAL(12, 2),         -- Ticket médio
    median_order_value DECIMAL(12, 2),      -- Mediana de pedidos
    max_order_value DECIMAL(12, 2),         -- Maior pedido
    min_order_value DECIMAL(12, 2),         -- Menor pedido
    
    -- ============================================
    -- PRODUTOS
    -- ============================================
    products_sold INTEGER,                  -- Quantidade de produtos vendidos
    unique_products INTEGER,                -- Produtos únicos vendidos
    avg_products_per_order DECIMAL(8, 2),   -- Produtos por pedido
    top_category VARCHAR(255),              -- Categoria mais vendida
    top_product VARCHAR(255),               -- Produto mais vendido
    out_of_stock INTEGER,                   -- Produtos fora de estoque
    low_stock INTEGER,                      -- Produtos com estoque baixo
    
    -- ============================================
    -- TRÁFEGO E VISITANTES
    -- ============================================
    visits INTEGER,                         -- Visitas totais
    unique_visitors INTEGER,                -- Visitantes únicos
    page_views INTEGER,                     -- Visualizações de página
    new_visitors INTEGER,                   -- Novos visitantes
    returning_visitors INTEGER,             -- Visitantes recorrentes
    bounce_rate DECIMAL(5, 4),              -- Taxa de rejeição (0-1)
    avg_session_duration INTEGER,           -- Duração média sessão (segundos)
    pages_per_session DECIMAL(8, 2),        -- Páginas por sessão
    
    -- ============================================
    -- CONVERSÃO
    -- ============================================
    conversion_rate DECIMAL(5, 4),          -- Taxa de conversão (0-1)
    add_to_cart_rate DECIMAL(5, 4),         -- Taxa adicionar carrinho
    checkout_rate DECIMAL(5, 4),            -- Taxa checkout iniciado
    cart_abandonment_rate DECIMAL(5, 4),    -- Taxa abandono carrinho
    payment_success_rate DECIMAL(5, 4),     -- Taxa sucesso pagamento
    
    -- ============================================
    -- MARKETING E AQUISIÇÃO (GERAL)
    -- ============================================
    marketing_spend DECIMAL(12, 2),         -- Investimento total marketing
    
    -- Google Ads
    google_ads_spend DECIMAL(12, 2),
    google_ads_impressions INTEGER,
    google_ads_clicks INTEGER,
    google_ads_ctr DECIMAL(5, 4),
    google_ads_cpc DECIMAL(8, 2),
    google_ads_conversions INTEGER,
    google_ads_roas DECIMAL(8, 2),
    
    -- Facebook/Meta Ads
    facebook_ads_spend DECIMAL(12, 2),
    facebook_impressions INTEGER,
    facebook_clicks INTEGER,
    facebook_ctr DECIMAL(5, 4),
    facebook_cpc DECIMAL(8, 2),
    facebook_conversions INTEGER,
    facebook_roas DECIMAL(8, 2),
    facebook_reach INTEGER,
    facebook_frequency DECIMAL(5, 2),
    
    -- Outros canais pagos
    instagram_ads_spend DECIMAL(12, 2),
    tiktok_ads_spend DECIMAL(12, 2),
    linkedin_ads_spend DECIMAL(12, 2),
    youtube_ads_spend DECIMAL(12, 2),
    pinterest_ads_spend DECIMAL(12, 2),
    email_marketing_spend DECIMAL(12, 2),
    seo_spend DECIMAL(12, 2),
    affiliate_spend DECIMAL(12, 2),
    influencer_spend DECIMAL(12, 2),
    other_ads_spend DECIMAL(12, 2),
    
    -- Resultados por canal (tráfego)
    organic_visits INTEGER,
    paid_visits INTEGER,
    social_visits INTEGER,
    direct_visits INTEGER,
    referral_visits INTEGER,
    email_visits INTEGER,
    
    -- Métricas gerais de performance
    impressions INTEGER,
    clicks INTEGER,
    ctr DECIMAL(5, 4),
    cpc DECIMAL(8, 2),
    cpm DECIMAL(8, 2),
    cpa DECIMAL(12, 2),
    roas DECIMAL(8, 2),
    
    -- ============================================
    -- INSTAGRAM - PERFIL E CONTEÚDO
    -- ============================================
    
    -- Audiência e Alcance
    instagram_followers INTEGER,
    instagram_followers_gain INTEGER,
    instagram_followers_lost INTEGER,
    instagram_reach INTEGER,
    instagram_impressions INTEGER,
    instagram_profile_views INTEGER,
    instagram_website_clicks INTEGER,
    
    -- Engajamento
    instagram_likes INTEGER,
    instagram_comments INTEGER,
    instagram_shares INTEGER,
    instagram_saves INTEGER,
    instagram_engagement INTEGER,
    instagram_engagement_rate DECIMAL(5, 4),
    
    -- Stories
    instagram_stories_posted INTEGER,
    instagram_stories_reach INTEGER,
    instagram_stories_impressions INTEGER,
    instagram_stories_replies INTEGER,
    instagram_stories_exits INTEGER,
    instagram_stories_swipe_ups INTEGER,
    instagram_stories_taps INTEGER,
    
    -- Feed Posts
    instagram_posts_published INTEGER,
    instagram_posts_reach INTEGER,
    instagram_posts_impressions INTEGER,
    instagram_posts_engagement INTEGER,
    
    -- Reels
    instagram_reels_posted INTEGER,
    instagram_reels_views INTEGER,
    instagram_reels_reach INTEGER,
    instagram_reels_likes INTEGER,
    instagram_reels_comments INTEGER,
    instagram_reels_shares INTEGER,
    instagram_reels_saves INTEGER,
    instagram_reels_plays INTEGER,
    instagram_reels_avg_watch_time INTEGER,
    
    -- Direct Messages
    instagram_dms_received INTEGER,
    instagram_dms_replied INTEGER,
    instagram_dms_response_time INTEGER,
    
    -- Shopping
    instagram_product_views INTEGER,
    instagram_product_clicks INTEGER,
    instagram_checkouts INTEGER,
    instagram_sales INTEGER,
    instagram_revenue DECIMAL(12, 2),
    
    -- Ads Instagram
    instagram_ads_impressions INTEGER,
    instagram_ads_clicks INTEGER,
    instagram_ads_ctr DECIMAL(5, 4),
    instagram_ads_cpc DECIMAL(8, 2),
    instagram_ads_cpm DECIMAL(8, 2),
    instagram_ads_conversions INTEGER,
    instagram_ads_roas DECIMAL(8, 2),
    
    -- Dados Demográficos Instagram
    instagram_top_city VARCHAR(255),
    instagram_top_country VARCHAR(255),
    instagram_top_age_range VARCHAR(50),
    instagram_gender_ratio DECIMAL(5, 2),
    
    -- ============================================
    -- TIKTOK - PERFIL E CONTEÚDO
    -- ============================================
    
    -- Audiência e Alcance
    tiktok_followers INTEGER,
    tiktok_followers_gain INTEGER,
    tiktok_followers_lost INTEGER,
    tiktok_profile_views INTEGER,
    tiktok_video_views INTEGER,
    tiktok_reach INTEGER,
    
    -- Engajamento
    tiktok_likes INTEGER,
    tiktok_comments INTEGER,
    tiktok_shares INTEGER,
    tiktok_saves INTEGER,
    tiktok_engagement INTEGER,
    tiktok_engagement_rate DECIMAL(5, 4),
    
    -- Vídeos
    tiktok_videos_posted INTEGER,
    tiktok_total_plays INTEGER,
    tiktok_avg_watch_time INTEGER,
    tiktok_avg_watch_percentage DECIMAL(5, 2),
    tiktok_completion_rate DECIMAL(5, 4),
    tiktok_rewatch_rate DECIMAL(5, 4),
    
    -- Viralidade
    tiktok_viral INTEGER,
    tiktok_for_you_page INTEGER,
    tiktok_hashtag_views INTEGER,
    tiktok_sound_uses INTEGER,
    
    -- Lives
    tiktok_lives_streamed INTEGER,
    tiktok_live_viewers INTEGER,
    tiktok_live_duration INTEGER,
    tiktok_live_gifts INTEGER,
    tiktok_live_revenue DECIMAL(12, 2),
    
    -- Shopping TikTok
    tiktok_product_views INTEGER,
    tiktok_product_clicks INTEGER,
    tiktok_checkouts INTEGER,
    tiktok_sales INTEGER,
    tiktok_revenue DECIMAL(12, 2),
    tiktok_aov DECIMAL(12, 2),
    
    -- Ads TikTok
    tiktok_ads_impressions INTEGER,
    tiktok_ads_clicks INTEGER,
    tiktok_ads_ctr DECIMAL(5, 4),
    tiktok_ads_cpc DECIMAL(8, 2),
    tiktok_ads_cpm DECIMAL(8, 2),
    tiktok_ads_cpv DECIMAL(8, 2),
    tiktok_ads_conversions INTEGER,
    tiktok_ads_roas DECIMAL(8, 2),
    
    -- Trends e Descoberta
    tiktok_trending_hashtags VARCHAR(500),
    tiktok_trending_sounds VARCHAR(500),
    tiktok_discoverability INTEGER,
    
    -- Dados Demográficos TikTok
    tiktok_top_city VARCHAR(255),
    tiktok_top_country VARCHAR(255),
    tiktok_top_age_range VARCHAR(50),
    tiktok_gender_ratio DECIMAL(5, 2),
    
    -- Colaborações e Criadores
    tiktok_duets INTEGER,
    tiktok_stitches INTEGER,
    tiktok_creator_fund_earnings DECIMAL(12, 2),
    
    -- ============================================
    -- OUTRAS REDES SOCIAIS
    -- ============================================
    
    -- YouTube
    youtube_views INTEGER,
    youtube_subscribers INTEGER,
    youtube_watch_time INTEGER,
    youtube_engagement INTEGER,
    youtube_revenue DECIMAL(12, 2),
    
    -- Twitter/X
    twitter_followers INTEGER,
    twitter_impressions INTEGER,
    twitter_engagement INTEGER,
    twitter_tweets INTEGER,
    
    -- LinkedIn
    linkedin_followers INTEGER,
    linkedin_impressions INTEGER,
    linkedin_engagement INTEGER,
    linkedin_posts INTEGER,
    
    -- Pinterest
    pinterest_followers INTEGER,
    pinterest_impressions INTEGER,
    pinterest_saves INTEGER,
    pinterest_clicks INTEGER,
    
    -- ============================================
    -- CLIENTES
    -- ============================================
    new_customers INTEGER,
    returning_customers INTEGER,
    active_customers INTEGER,
    churned_customers INTEGER,
    reactivated_customers INTEGER,
    
    -- Lifetime Value
    avg_customer_lifetime_value DECIMAL(12, 2),
    avg_customer_age INTEGER,
    avg_purchase_frequency DECIMAL(8, 2),
    
    -- ============================================
    -- OPERACIONAL
    -- ============================================
    fulfillment_time INTEGER,
    shipping_time INTEGER,
    delivery_time INTEGER,
    return_rate DECIMAL(5, 4),
    customer_support_tickets INTEGER,
    avg_resolution_time INTEGER,
    
    -- ============================================
    -- SATISFAÇÃO E ENGAJAMENTO
    -- ============================================
    nps DECIMAL(4, 2),
    csat DECIMAL(3, 2),
    reviews_count INTEGER,
    avg_rating DECIMAL(3, 2),
    social_engagement INTEGER,
    email_open_rate DECIMAL(5, 4),
    email_click_rate DECIMAL(5, 4),
    
    -- ============================================
    -- FINANCEIRO
    -- ============================================
    operational_cost DECIMAL(12, 2),
    cost_of_goods_sold DECIMAL(12, 2),
    gross_profit DECIMAL(12, 2),
    gross_margin DECIMAL(5, 4),
    net_profit DECIMAL(12, 2),
    net_margin DECIMAL(5, 4),
    
    -- ============================================
    -- ESTOQUE E INVENTÁRIO
    -- ============================================
    inventory_value DECIMAL(12, 2),
    inventory_turnover DECIMAL(8, 2),
    stockout_rate DECIMAL(5, 4),
    
    -- ============================================
    -- DEVICE E TECNOLOGIA
    -- ============================================
    mobile_visits INTEGER,
    desktop_visits INTEGER,
    tablet_visits INTEGER,
    mobile_conversion DECIMAL(5, 4),
    desktop_conversion DECIMAL(5, 4),
    
    -- ============================================
    -- GEO
    -- ============================================
    top_city VARCHAR(255),
    top_state VARCHAR(255),
    top_country VARCHAR(255),
    
    -- ============================================
    -- SAZONALIDADE E EVENTOS
    -- ============================================
    weather_condition VARCHAR(100),
    temperature DECIMAL(5, 2),
    special_event VARCHAR(255),
    campaign_id VARCHAR(100),
    campaign_name VARCHAR(255),
    
    -- ============================================
    -- COMPETIÇÃO
    -- ============================================
    competitor_price DECIMAL(12, 2),
    price_advantage DECIMAL(5, 4),
    market_share DECIMAL(5, 4),
    
    -- ============================================
    -- METADADOS
    -- ============================================
    source VARCHAR(100),
    data_quality DECIMAL(3, 2),
    notes TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_client_metrics_client_date ON client_metrics(client_id, date);
CREATE INDEX idx_client_metrics_date ON client_metrics(date);
CREATE INDEX idx_client_metrics_client_year_month ON client_metrics(client_id, year, month);

-- Unique constraint
CREATE UNIQUE INDEX idx_client_metrics_unique ON client_metrics(client_id, date);
