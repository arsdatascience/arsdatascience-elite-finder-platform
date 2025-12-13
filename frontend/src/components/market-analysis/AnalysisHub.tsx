import React, { useState } from 'react';
import {
    TrendingUp, Users, AlertTriangle, DollarSign, Instagram, Video,
    Target, BarChart3, ShoppingCart, Heart, Layers, Clock,
    Activity, PieChart, RefreshCw, ArrowRight, Search, Sparkles,
    Wallet, Package, Receipt, UserCheck, ThumbsUp, GitBranch,
    Percent, Award, Building, Calendar, Zap, Settings, Brain, Info, X
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

// Analysis categories
const CATEGORIES = [
    { id: 'core', name: 'Core Analytics', icon: Brain, color: '#8B5CF6' },
    { id: 'social', name: 'Social Media', icon: Instagram, color: '#E1306C' },
    { id: 'financial', name: 'Financeiro', icon: Wallet, color: '#10B981' },
    { id: 'training', name: 'Custom Training', icon: Settings, color: '#F59E0B' },
    { id: 'advanced', name: 'Avançado', icon: Sparkles, color: '#3B82F6' }
];

// All 35 analyses
const ANALYSES = {
    core: [
        { id: 'sales-forecast', name: 'Sales Forecast', icon: TrendingUp, desc: 'Previsão de vendas' },
        { id: 'churn-prediction', name: 'Churn Prediction', icon: AlertTriangle, desc: 'Previsão de churn' },
        { id: 'customer-segmentation', name: 'Customer Segmentation', icon: Users, desc: 'Segmentação de clientes' },
        { id: 'trend-analysis', name: 'Trend Analysis', icon: Activity, desc: 'Análise de tendências' },
        { id: 'anomaly-detection', name: 'Anomaly Detection', icon: AlertTriangle, desc: 'Detecção de anomalias' },
        { id: 'marketing-roi', name: 'Marketing ROI', icon: DollarSign, desc: 'ROI de marketing' }
    ],
    social: [
        { id: 'instagram-performance', name: 'Instagram', icon: Instagram, desc: 'Performance Instagram' },
        { id: 'tiktok-performance', name: 'TikTok', icon: Video, desc: 'Performance TikTok' },
        { id: 'social-comparison', name: 'Social Comparison', icon: BarChart3, desc: 'Comparar plataformas' },
        { id: 'influencer-roi', name: 'Influencer ROI', icon: Award, desc: 'ROI de influencers' }
    ],
    financial: [
        { id: 'cashflow-forecast', name: 'Cashflow Forecast', icon: Wallet, desc: 'Previsão de caixa' },
        { id: 'profitability', name: 'Profitability', icon: PieChart, desc: 'Análise de lucratividade' },
        { id: 'revenue-scenarios', name: 'Revenue Scenarios', icon: GitBranch, desc: 'Cenários de receita' }
    ],
    training: [
        { id: 'train/regression', name: 'Regression', icon: TrendingUp, desc: 'Treinar modelo de regressão' },
        { id: 'train/classification', name: 'Classification', icon: Layers, desc: 'Treinar classificador' },
        { id: 'train/clustering', name: 'Clustering', icon: Users, desc: 'Treinar clustering' },
        { id: 'train/timeseries', name: 'Time Series', icon: Clock, desc: 'Treinar série temporal' }
    ],
    advanced: [
        { id: 'lead-forecast', name: 'Lead Forecast', icon: Target, desc: 'Previsão de leads' },
        { id: 'budget-optimization', name: 'Budget Optimization', icon: DollarSign, desc: 'Otimização de budget' },
        { id: 'inventory-optimization', name: 'Inventory', icon: Package, desc: 'Otimização de estoque' },
        { id: 'demand-forecast', name: 'Demand Forecast', icon: TrendingUp, desc: 'Previsão de demanda' },
        { id: 'return-analysis', name: 'Return Analysis', icon: Receipt, desc: 'Análise de devoluções' },
        { id: 'ltv-prediction', name: 'LTV Prediction', icon: Heart, desc: 'Previsão de LTV' },
        { id: 'rfm-analysis', name: 'RFM Analysis', icon: Layers, desc: 'Análise RFM' },
        { id: 'purchase-propensity', name: 'Purchase Propensity', icon: ShoppingCart, desc: 'Propensão de compra' },
        { id: 'satisfaction-trends', name: 'Satisfaction', icon: ThumbsUp, desc: 'Tendências de satisfação' },
        { id: 'funnel-optimization', name: 'Funnel', icon: GitBranch, desc: 'Otimização de funil' },
        { id: 'cart-abandonment', name: 'Cart Abandonment', icon: ShoppingCart, desc: 'Abandono de carrinho' },
        { id: 'ab-test', name: 'A/B Test', icon: Percent, desc: 'Análise de teste A/B' },
        { id: 'market-benchmark', name: 'Benchmark', icon: Award, desc: 'Benchmark de mercado' },
        { id: 'competitor-analysis', name: 'Competitor', icon: Building, desc: 'Análise competitiva' },
        { id: 'seasonality-forecast', name: 'Seasonality', icon: Calendar, desc: 'Previsão de sazonalidade' },
        { id: 'event-impact', name: 'Event Impact', icon: Zap, desc: 'Impacto de eventos' },
        { id: 'scenario-simulator', name: 'Scenario Simulator', icon: Settings, desc: 'Simulador de cenários' },
        { id: 'time-series-prophet', name: 'Prophet Forecast', icon: Clock, desc: 'Forecast com Prophet' }
    ]
};

// Detailed analysis documentation
const ANALYSIS_DETAILS: Record<string, { 
    fullDescription: string;
    metrics: string[];
    algorithms: string[];
    useCase: string;
    dataRequired: string[];
}> = {
    // === CORE ANALYTICS ===
    'sales-forecast': {
        fullDescription: 'Previsão de vendas futuras baseada em histórico e sazonalidade. Usa algoritmos de séries temporais para prever receita, unidades vendidas e padrões de demanda.',
        metrics: ['MAPE (Mean Absolute Percentage Error)', 'RMSE (Root Mean Squared Error)', 'MAE (Mean Absolute Error)', 'R²'],
        algorithms: ['Prophet (Facebook)', 'ARIMA', 'SARIMA', 'LSTM (Deep Learning)', 'XGBoost Regressor'],
        useCase: 'Planejamento de estoque, alocação de budget, definição de metas de vendas, previsão de receita trimestral/anual.',
        dataRequired: ['Histórico de vendas (min. 6 meses)', 'Data/período', 'Valor de vendas', 'Produtos/categorias (opcional)']
    },
    'churn-prediction': {
        fullDescription: 'Identifica clientes com alta probabilidade de cancelamento/abandono. Analisa comportamento, engajamento e transações para prever churn.',
        metrics: ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC-ROC'],
        algorithms: ['Random Forest Classifier', 'XGBoost', 'LightGBM', 'Logistic Regression', 'Gradient Boosting'],
        useCase: 'Retenção de clientes, campanhas de winback, identificação de clientes em risco, priorização de atendimento.',
        dataRequired: ['Histórico de transações', 'Dados de engajamento', 'Recência/Frequência', 'Status de churn (treino)']
    },
    'customer-segmentation': {
        fullDescription: 'Agrupa clientes em segmentos homogêneos baseado em comportamento, valor e características. Usa clustering não supervisionado.',
        metrics: ['Silhouette Score', 'Davies-Bouldin Index', 'Inertia', 'Número ótimo de clusters'],
        algorithms: ['K-Means', 'DBSCAN', 'Hierarchical Clustering', 'Gaussian Mixture Models'],
        useCase: 'Personalização de marketing, estratégias diferenciadas por segmento, pricing dinâmico, recomendações.',
        dataRequired: ['Dados demográficos', 'Histórico de compras', 'Valor total gasto', 'Frequência de compras']
    },
    'trend-analysis': {
        fullDescription: 'Analisa tendências de métricas ao longo do tempo, identifica padrões de crescimento, sazonalidade e mudanças de comportamento.',
        metrics: ['Taxa de crescimento', 'Variação percentual', 'Tendência linear/exponencial', 'Sazonalidade detectada'],
        algorithms: ['Decomposição STL', 'Moving Averages', 'Exponential Smoothing', 'Mann-Kendall Test'],
        useCase: 'Análise de KPIs, detecção de mudanças de mercado, planejamento estratégico, benchmark de performance.',
        dataRequired: ['Série temporal de métrica', 'Data/período', 'Valor da métrica', 'Min. 3 meses de dados']
    },
    'anomaly-detection': {
        fullDescription: 'Detecta comportamentos anômalos em vendas, tráfego ou métricas. Identifica fraudes, erros de sistema ou oportunidades inesperadas.',
        metrics: ['Z-Score', 'IQR (Interquartile Range)', 'Isolation Score', 'Anomaly Count'],
        algorithms: ['Isolation Forest', 'Local Outlier Factor', 'One-Class SVM', 'Autoencoders'],
        useCase: 'Detecção de fraudes, alertas de performance, identificação de picos/quedas anormais, monitoramento de sistemas.',
        dataRequired: ['Dados históricos normais', 'Métricas numéricas', 'Timestamp', 'Min. 1000 observações']
    },
    'marketing-roi': {
        fullDescription: 'Calcula retorno sobre investimento de campanhas de marketing. Atribui receita a canais e campanhas específicas.',
        metrics: ['ROI %', 'ROAS (Return on Ad Spend)', 'CAC (Customer Acquisition Cost)', 'LTV/CAC Ratio'],
        algorithms: ['Regressão Linear Múltipla', 'Attribution Models', 'Marketing Mix Modeling', 'Shapley Values'],
        useCase: 'Otimização de budget de marketing, comparação de canais, decisões de investimento em ads, planejamento de campanhas.',
        dataRequired: ['Gastos por canal/campanha', 'Receita gerada', 'Data', 'Conversões atribuídas']
    },

    // === SOCIAL MEDIA ===
    'instagram-performance': {
        fullDescription: 'Análise completa de performance no Instagram: engajamento, alcance, crescimento de seguidores e efetividade de conteúdo.',
        metrics: ['Engagement Rate', 'Reach', 'Impressions', 'Follower Growth Rate', 'Saves/Shares'],
        algorithms: ['Time Series Analysis', 'Correlation Analysis', 'Content Performance Scoring'],
        useCase: 'Otimização de conteúdo, melhores horários de post, identificação de trending topics, análise de influencers.',
        dataRequired: ['Métricas de posts (likes, comments, saves)', 'Alcance/Impressões', 'Data de publicação', 'Tipo de conteúdo']
    },
    'tiktok-performance': {
        fullDescription: 'Avaliação de performance no TikTok: viralização, watch time, completeness rate e crescimento de audiência.',
        metrics: ['Views', 'Watch Time', 'Completion Rate', 'Shares', 'Follower Conversion Rate'],
        algorithms: ['Viral Coefficient Analysis', 'Engagement Prediction', 'Trend Detection'],
        useCase: 'Identificação de vídeos virais, otimização de duração, análise de hashtags, estratégia de conteúdo.',
        dataRequired: ['Métricas de vídeos', 'Watch time', 'Completion rate', 'Hashtags usadas', 'Data de publicação']
    },
    'social-comparison': {
        fullDescription: 'Comparação cruzada de performance entre plataformas sociais (Instagram, TikTok, Facebook, LinkedIn). Identifica melhor ROI por plataforma.',
        metrics: ['Engagement Rate por plataforma', 'Cost per Engagement', 'Reach Efficiency', 'Conversion Rate'],
        algorithms: ['Multi-dimensional Analysis', 'Weighted Scoring', 'Platform Attribution'],
        useCase: 'Alocação de recursos entre plataformas, identificação de canais mais efetivos, benchmarking, estratégia omnichannel.',
        dataRequired: ['Dados de múltiplas plataformas', 'Métricas padronizadas', 'Investimento por plataforma']
    },
    'influencer-roi': {
        fullDescription: 'Calcula retorno de parcerias com influencers. Atribui vendas e conversões a campanhas específicas de influenciadores.',
        metrics: ['ROI por influencer', 'CPE (Cost per Engagement)', 'Conversion Rate', 'Earned Media Value'],
        algorithms: ['Attribution Modeling', 'Incremental Sales Analysis', 'Influence Scoring'],
        useCase: 'Seleção de influencers, negociação de contratos, avaliação de parcerias, otimização de budget de influencer marketing.',
        dataRequired: ['Investimento em influencers', 'Alcance/Engajamento gerado', 'Conversões atribuídas', 'Dados de campanha']
    },

    // === FINANCIAL ===
    'cashflow-forecast': {
        fullDescription: 'Previsão de fluxo de caixa futuro baseado em entradas, saídas e padrões históricos. Auxilia planejamento financeiro.',
        metrics: ['Cash Position', 'Burn Rate', 'Runway', 'Forecast Accuracy'],
        algorithms: ['ARIMA', 'Prophet', 'Monte Carlo Simulation', 'Exponential Smoothing'],
        useCase: 'Planejamento financeiro, gestão de liquidez, prevenção de crises de caixa, decisões de investimento.',
        dataRequired: ['Histórico de entradas/saídas', 'Contas a receber/pagar', 'Sazonalidade de pagamentos']
    },
    'profitability': {
        fullDescription: 'Análise detalhada de lucratividade por produto, cliente, canal ou região. Identifica drivers de margem e oportunidades.',
        metrics: ['Margem Bruta %', 'Margem Líquida %', 'Contribution Margin', 'Profit por Segmento'],
        algorithms: ['Cost Allocation Models', 'ABC Analysis', 'Pareto Analysis', 'Margin Optimization'],
        useCase: 'Pricing strategy, descontinuação de produtos, foco em clientes rentáveis, redução de custos.',
        dataRequired: ['Receita por item', 'Custos diretos', 'Custos indiretos alocados', 'Volume de vendas']
    },
    'revenue-scenarios': {
        fullDescription: 'Simulação de cenários de receita baseado em diferentes premissas (otimista, realista, pessimista). Usa Monte Carlo.',
        metrics: ['P10/P50/P90 Revenue', 'Confidence Intervals', 'Scenario Probability', 'Expected Value'],
        algorithms: ['Monte Carlo Simulation', 'Scenario Analysis', 'Sensitivity Analysis', 'Decision Trees'],
        useCase: 'Planejamento estratégico, avaliação de riscos, pitch de investidores, definição de metas realistas.',
        dataRequired: ['Premissas de negócio', 'Distribuições de probabilidade', 'Variáveis-chave de receita']
    },

    // === CUSTOM TRAINING ===
    'train/regression': {
        fullDescription: 'Treina modelo personalizado de regressão para prever valores contínuos (vendas, preços, demanda). Você escolhe features e target.',
        metrics: ['R² Score', 'RMSE', 'MAE', 'MAPE'],
        algorithms: ['Linear Regression', 'Ridge/Lasso', 'Random Forest', 'XGBoost', 'LightGBM', 'Neural Networks'],
        useCase: 'Qualquer problema de previsão numérica: vendas, clicks, conversões, preços, LTV, etc.',
        dataRequired: ['Dataset com features (variáveis independentes)', 'Target numérico', 'Min. 1000 linhas']
    },
    'train/classification': {
        fullDescription: 'Treina classificador personalizado para problemas binários ou multiclasse (churn, conversão, categoria de cliente).',
        metrics: ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC-ROC', 'Confusion Matrix'],
        algorithms: ['Logistic Regression', 'Random Forest', 'XGBoost', 'LightGBM', 'SVM', 'Neural Networks'],
        useCase: 'Qualquer problema de classificação: churn, conversão, fraude, sentimento, segmento, tipo de cliente.',
        dataRequired: ['Dataset com features', 'Target categórico (labels)', 'Min. 1000 linhas', 'Classes balanceadas']
    },
    'train/clustering': {
        fullDescription: 'Treina modelo de clustering não supervisionado para descobrir grupos naturais em dados (segmentação, padrões).',
        metrics: ['Silhouette Score', 'Davies-Bouldin Index', 'Calinski-Harabasz Score', 'Inertia'],
        algorithms: ['K-Means', 'DBSCAN', 'Hierarchical', 'Gaussian Mixture', 'OPTICS'],
        useCase: 'Segmentação exploratória, descoberta de padrões, agrupamento de produtos/clientes, análise de comportamento.',
        dataRequired: ['Dataset com features numéricas', 'Dados normalizados', 'Min. 500 linhas']
    },
    'train/timeseries': {
        fullDescription: 'Treina modelo de séries temporais personalizado para forecasting de qualquer métrica ao longo do tempo.',
        metrics: ['MAPE', 'RMSE', 'MAE', 'Forecast Horizon Accuracy'],
        algorithms: ['Prophet', 'ARIMA', 'SARIMA', 'LSTM', 'GRU', 'Transformer'],
        useCase: 'Previsão de vendas, demanda, tráfego, conversões, qualquer métrica temporal.',
        dataRequired: ['Série temporal com timestamp', 'Min. 3 meses de dados', 'Frequência regular (diária, semanal, mensal)']
    },

    // === ADVANCED ===
    'lead-forecast': {
        fullDescription: 'Previsão de geração de leads futuros baseado em sazonalidade, campanhas e tendências históricas.',
        metrics: ['Lead Volume Forecast', 'Lead Quality Score', 'Forecast Accuracy', 'Confidence Intervals'],
        algorithms: ['Prophet', 'ARIMA with External Regressors', 'XGBoost Regressor'],
        useCase: 'Planejamento de equipe de vendas, budget de marketing, previsão de pipeline, alocação de recursos.',
        dataRequired: ['Histórico de leads gerados', 'Data', 'Fonte de lead', 'Investimento em marketing']
    },
    'budget-optimization': {
        fullDescription: 'Otimiza alocação de budget de marketing entre canais para maximizar ROI usando programação linear e simulação.',
        metrics: ['Optimal Allocation %', 'Expected ROI', 'Marginal Returns', 'Budget Efficiency'],
        algorithms: ['Linear Programming', 'Gradient Descent', 'Genetic Algorithms', 'Bayesian Optimization'],
        useCase: 'Planejamento de budget de marketing, alocação entre canais (Google, Meta, TikTok), maximização de ROI.',
        dataRequired: ['Performance histórica por canal', 'Budget constraints', 'ROI de cada canal', 'Limites de investimento']
    },
    'inventory-optimization': {
        fullDescription: 'Otimiza níveis de estoque para minimizar custos de armazenagem e rupturas. Calcula ponto de reposição e quantidade ideal.',
        metrics: ['EOQ (Economic Order Quantity)', 'Inventory Turnover', 'Stockout Rate', 'Holding Cost'],
        algorithms: ['EOQ Model', 'Newsvendor Model', 'ABC Analysis', 'Safety Stock Calculation'],
        useCase: 'Gestão de estoque, redução de custos, prevenção de rupturas, planejamento de compras.',
        dataRequired: ['Demanda histórica', 'Lead time de fornecedores', 'Custos de armazenagem', 'Custo de ruptura']
    },
    'demand-forecast': {
        fullDescription: 'Previsão de demanda futura por produto/categoria. Incorpora sazonalidade, promoções e fatores externos.',
        metrics: ['MAPE', 'Bias', 'Forecast Value Added', 'Stock Coverage Days'],
        algorithms: ['Prophet', 'SARIMA', 'XGBoost with Lags', 'Deep Learning (LSTM)'],
        useCase: 'Planejamento de produção, compras, gestão de estoque, prevenção de excessos e faltas.',
        dataRequired: ['Histórico de demanda/vendas', 'Calendário de promoções', 'Fatores externos (feriados, eventos)']
    },
    'return-analysis': {
        fullDescription: 'Analisa padrões de devolução de produtos. Identifica produtos problemáticos e causas raiz de returns.',
        metrics: ['Return Rate %', 'Return Cost', 'Most Returned Products', 'Return Reasons Distribution'],
        algorithms: ['Classification (Return Prediction)', 'Association Rules', 'Clustering', 'Text Mining (motivos)'],
        useCase: 'Redução de devoluções, melhoria de produtos, otimização de descrições, controle de qualidade.',
        dataRequired: ['Dados de devoluções', 'Produtos', 'Motivos de devolução', 'Dados de compra original']
    },
    'ltv-prediction': {
        fullDescription: 'Previsão do Lifetime Value (valor total) que um cliente gerará durante todo relacionamento com a empresa.',
        metrics: ['Predicted LTV', 'LTV/CAC Ratio', 'Payback Period', 'Customer Value Score'],
        algorithms: ['BG/NBD Model', 'Gamma-Gamma Model', 'XGBoost Regressor', 'Survival Analysis'],
        useCase: 'Segmentação de alto valor, priorização de retenção, cálculo de CAC aceitável, valuation de base de clientes.',
        dataRequired: ['Histórico de transações por cliente', 'Recência/Frequência/Valor', 'Data da primeira compra']
    },
    'rfm-analysis': {
        fullDescription: 'Segmentação RFM (Recency, Frequency, Monetary). Classifica clientes em grupos baseado em comportamento de compra.',
        metrics: ['RFM Score', 'Customer Segments', 'Value Distribution', 'Segment Size'],
        algorithms: ['Quantile-based Scoring', 'K-Means Clustering', 'Custom Segmentation Rules'],
        useCase: 'Segmentação de clientes, campanhas personalizadas, identificação de champions/at-risk, estratégia de retenção.',
        dataRequired: ['Histórico de transações', 'Data da última compra', 'Frequência de compras', 'Valor monetário total']
    },
    'purchase-propensity': {
        fullDescription: 'Calcula probabilidade de compra de cada cliente. Permite direcionar ofertas para quem tem maior propensão.',
        metrics: ['Purchase Probability', 'Propensity Score', 'AUC-ROC', 'Lift over Random'],
        algorithms: ['Logistic Regression', 'XGBoost Classifier', 'Neural Networks', 'Gradient Boosting'],
        useCase: 'Targeting de campanhas, otimização de ofertas, cross-sell/up-sell, priorização de contatos.',
        dataRequired: ['Dados comportamentais', 'Histórico de navegação/wishlist', 'Compras anteriores', 'Dados demográficos']
    },
    'satisfaction-trends': {
        fullDescription: 'Análise de tendências de satisfação do cliente (NPS, CSAT). Identifica fatores que impactam satisfação.',
        metrics: ['NPS Trend', 'CSAT Trend', 'Detractor Rate', 'Satisfaction Drivers'],
        algorithms: ['Time Series Analysis', 'Sentiment Analysis', 'Correlation Analysis', 'Driver Analysis'],
        useCase: 'Monitoramento de experiência do cliente, identificação de problemas, priorização de melhorias, benchmark.',
        dataRequired: ['Pesquisas de satisfação', 'NPS/CSAT scores', 'Data', 'Atributos de clientes/transações']
    },
    'funnel-optimization': {
        fullDescription: 'Analisa funil de conversão, identifica gargalos e oportunidades de otimização em cada etapa.',
        metrics: ['Conversion Rate por etapa', 'Drop-off Rate', 'Time in Stage', 'Funnel Efficiency'],
        algorithms: ['Funnel Analysis', 'A/B Test Analysis', 'Cohort Analysis', 'Path Analysis'],
        useCase: 'Otimização de checkout, melhoria de landing pages, redução de abandono, aumento de conversão.',
        dataRequired: ['Eventos de funil', 'Timestamp', 'User ID', 'Atributos de sessão']
    },
    'cart-abandonment': {
        fullDescription: 'Analisa abandono de carrinho, prediz quem vai abandonar e sugere ações de recuperação.',
        metrics: ['Abandonment Rate', 'Avg Cart Value Lost', 'Recovery Rate', 'Abandonment Reasons'],
        algorithms: ['Classification (Abandonment Prediction)', 'Survival Analysis', 'Behavioral Clustering'],
        useCase: 'Recuperação de carrinhos, otimização de checkout, identificação de fricções, email marketing.',
        dataRequired: ['Eventos de adicionar ao carrinho', 'Checkouts iniciados/completados', 'Dados de sessão']
    },
    'ab-test': {
        fullDescription: 'Análise estatística de testes A/B. Calcula significância, confidence intervals e recomenda vencedor.',
        metrics: ['Conversion Rate Lift', 'Statistical Significance (p-value)', 'Confidence Interval', 'Sample Size'],
        algorithms: ['Z-test', 'T-test', 'Chi-square', 'Bayesian A/B Testing', 'Sequential Testing'],
        useCase: 'Validação de mudanças de produto, testes de pricing, otimização de landing pages, decisões data-driven.',
        dataRequired: ['Dados de variantes (A/B)', 'Conversões', 'Impressões/Visitas', 'Timestamps']
    },
    'market-benchmark': {
        fullDescription: 'Compara performance da empresa com benchmarks de mercado e concorrentes. Identifica gaps e oportunidades.',
        metrics: ['Market Share', 'Performance vs Median', 'Percentile Rank', 'Gap Analysis'],
        algorithms: ['Statistical Comparison', 'Percentile Analysis', 'Competitive Indexing'],
        useCase: 'Avaliação de competitividade, identificação de gaps, validação de estratégias, reports para stakeholders.',
        dataRequired: ['Dados internos de performance', 'Benchmarks de mercado', 'Dados de concorrentes (se disponível)']
    },
    'competitor-analysis': {
        fullDescription: 'Análise de estratégias e performance de concorrentes. Identifica ameaças e oportunidades competitivas.',
        metrics: ['Share of Voice', 'Pricing Gap', 'Feature Comparison', 'Growth Rate vs Competition'],
        algorithms: ['Web Scraping', 'Sentiment Analysis', 'Price Tracking', 'Market Share Modeling'],
        useCase: 'Definição de pricing, planejamento estratégico, identificação de ameaças, oportunidades de diferenciação.',
        dataRequired: ['Dados de concorrentes', 'Pricing', 'Features', 'Performance de marketing', 'Reviews']
    },
    'seasonality-forecast': {
        fullDescription: 'Identifica e modela padrões sazonais em vendas/demanda. Prevê picos e vales sazonais futuros.',
        metrics: ['Seasonal Indices', 'Peak Period Forecast', 'Seasonal Amplitude', 'Forecast Accuracy'],
        algorithms: ['STL Decomposition', 'Prophet', 'SARIMA', 'Fourier Analysis'],
        useCase: 'Planejamento de estoque sazonal, staffing, campanhas de marketing em high seasons, logística.',
        dataRequired: ['Série temporal longa (min. 2 anos)', 'Data', 'Métrica de interesse', 'Calendário de eventos']
    },
    'event-impact': {
        fullDescription: 'Mede impacto de eventos específicos (promoções, lançamentos, crises) em métricas de negócio usando análise causal.',
        metrics: ['Incremental Impact', 'Statistical Significance', 'ROI of Event', 'Attribution %'],
        algorithms: ['Difference-in-Differences', 'Causal Impact (Bayesian)', 'Synthetic Control', 'Interrupted Time Series'],
        useCase: 'Avaliação de campanhas, medição de impacto de mudanças, análise pós-mortem, planejamento de eventos.',
        dataRequired: ['Série temporal antes/depois do evento', 'Data do evento', 'Grupo de controle (se disponível)']
    },
    'scenario-simulator': {
        fullDescription: 'Simula múltiplos cenários de negócio ajustando variáveis-chave. Permite what-if analysis interativo.',
        metrics: ['Scenario Outcomes', 'Sensitivity Analysis', 'Risk Assessment', 'Decision Recommendations'],
        algorithms: ['Monte Carlo Simulation', 'Sensitivity Analysis', 'Decision Trees', 'Optimization'],
        useCase: 'Planejamento estratégico, análise de riscos, decisões de investimento, preparação para incertezas.',
        dataRequired: ['Modelo de negócio (relações entre variáveis)', 'Ranges de variáveis-chave', 'Distribuições de probabilidade']
    },
    'time-series-prophet': {
        fullDescription: 'Forecast usando Prophet (Facebook), ideal para dados com sazonalidade múltipla e feriados. Robusto a dados faltantes.',
        metrics: ['MAPE', 'RMSE', 'Coverage (Prediction Intervals)', 'Trend Change Points'],
        algorithms: ['Prophet (Additive Model)', 'Automatic Seasonality Detection', 'Holiday Effects'],
        useCase: 'Previsão de vendas daily/weekly, métricas de app/site, demanda com múltiplas sazonalidades.',
        dataRequired: ['Série temporal com data', 'Min. 3 meses', 'Dados de feriados (opcional)', 'Eventos especiais (opcional)']
    }
};

interface AnalysisResult {
    success: boolean;
    analysis_type: string;
    [key: string]: any;
}

export const AnalysisHub: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState('core');
    const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [clientId, setClientId] = useState('1');
    const [params, setParams] = useState<Record<string, any>>({});
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoAnalysisId, setInfoAnalysisId] = useState<string | null>(null);

    const runAnalysis = async () => {
        if (!selectedAnalysis) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await apiClient.marketAnalysis.predict(selectedAnalysis, {
                client_id: parseInt(clientId),
                ...params
            });
            setResult(response);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const renderParamInput = (analysisId: string) => {
        const commonParams = (
            <div className="space-y-3">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Client ID</label>
                    <input
                        type="number"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Dias Históricos</label>
                    <input
                        type="number"
                        value={params.historical_days || 90}
                        onChange={(e) => setParams({ ...params, historical_days: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                </div>
            </div>
        );

        if (analysisId.includes('forecast') || analysisId.includes('prophet')) {
            return (
                <>
                    {commonParams}
                    <div className="mt-3">
                        <label className="block text-sm text-gray-400 mb-1">Dias de Previsão</label>
                        <input
                            type="number"
                            value={params.forecast_days || params.forecast_periods || 30}
                            onChange={(e) => setParams({ ...params, forecast_days: parseInt(e.target.value), forecast_periods: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                    </div>
                </>
            );
        }

        if (analysisId === 'budget-optimization') {
            return (
                <>
                    {commonParams}
                    <div className="mt-3">
                        <label className="block text-sm text-gray-400 mb-1">Budget Total (R$)</label>
                        <input
                            type="number"
                            value={params.total_budget || 10000}
                            onChange={(e) => setParams({ ...params, total_budget: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                    </div>
                </>
            );
        }

        if (analysisId === 'trend-analysis') {
            return (
                <>
                    {commonParams}
                    <div className="mt-3">
                        <label className="block text-sm text-gray-400 mb-1">Métrica</label>
                        <select
                            value={params.metric || 'revenue'}
                            onChange={(e) => setParams({ ...params, metric: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        >
                            <option value="revenue">Revenue</option>
                            <option value="orders">Orders</option>
                            <option value="visits">Visits</option>
                            <option value="conversion_rate">Conversion Rate</option>
                        </select>
                    </div>
                </>
            );
        }

        if (analysisId === 'customer-segmentation' || analysisId === 'train/clustering') {
            return (
                <>
                    {commonParams}
                    <div className="mt-3">
                        <label className="block text-sm text-gray-400 mb-1">Número de Clusters</label>
                        <input
                            type="number"
                            value={params.n_clusters || 5}
                            onChange={(e) => setParams({ ...params, n_clusters: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        />
                    </div>
                </>
            );
        }

        return commonParams;
    };

    const renderResult = () => {
        if (!result) return null;

        return (
            <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-white font-medium">{result.analysis_type}</span>
                </div>

                <pre className="text-xs text-gray-300 overflow-auto max-h-96 bg-gray-950 p-3 rounded">
                    {JSON.stringify(result, null, 2)}
                </pre>
            </div>
        );
    };

    const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);
    const analyses = ANALYSES[selectedCategory as keyof typeof ANALYSES] || [];

    return (
        <div className="p-6 bg-gray-950 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Analysis Hub</h1>
                    <p className="text-gray-400">35 análises de ML disponíveis</p>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isActive = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => { setSelectedCategory(cat.id); setSelectedAnalysis(null); setResult(null); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${isActive
                                        ? 'text-white'
                                        : 'bg-gray-800 text-gray-400 hover:text-white'
                                    }`}
                                style={isActive ? { backgroundColor: cat.color } : undefined}
                            >
                                <Icon size={16} />
                                {cat.name}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Analysis Cards */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {analyses.map(analysis => {
                                const Icon = analysis.icon;
                                const isSelected = selectedAnalysis === analysis.id;
                                return (
                                    <div key={analysis.id} className="relative group">
                                        <button
                                            onClick={() => { setSelectedAnalysis(analysis.id); setResult(null); setError(null); }}
                                            className={`w-full p-4 rounded-lg border text-left transition-all ${isSelected
                                                    ? 'border-violet-500 bg-violet-500/10'
                                                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                                }`}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                                                style={{ backgroundColor: currentCategory?.color + '20' }}
                                            >
                                                <Icon size={20} style={{ color: currentCategory?.color }} />
                                            </div>
                                            <h3 className="text-white font-medium text-sm">{analysis.name}</h3>
                                            <p className="text-gray-500 text-xs mt-1">{analysis.desc}</p>
                                        </button>
                                        {ANALYSIS_DETAILS[analysis.id] && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setInfoAnalysisId(analysis.id); setShowInfoModal(true); }}
                                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                title="Ver detalhes"
                                            >
                                                <Info size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Config & Run Panel */}
                    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 h-fit">
                        {selectedAnalysis ? (
                            <>
                                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                                    <Settings size={16} />
                                    Configurar Análise
                                </h3>

                                {renderParamInput(selectedAnalysis)}

                                <button
                                    onClick={runAnalysis}
                                    disabled={loading}
                                    className="w-full mt-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                                    style={{ backgroundColor: currentCategory?.color }}
                                >
                                    {loading ? (
                                        <RefreshCw size={18} className="animate-spin text-white" />
                                    ) : (
                                        <>
                                            <ArrowRight size={18} className="text-white" />
                                            <span className="text-white">Executar</span>
                                        </>
                                    )}
                                </button>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {renderResult()}
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Search size={32} className="mx-auto mb-3 opacity-50" />
                                <p>Selecione uma análise</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Modal */}
                {showInfoModal && infoAnalysisId && ANALYSIS_DETAILS[infoAnalysisId] && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowInfoModal(false)}>
                        <div className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-start justify-between">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        {analyses.find(a => a.id === infoAnalysisId)?.name}
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                        {analyses.find(a => a.id === infoAnalysisId)?.desc}
                                    </p>
                                </div>
                                <button onClick={() => setShowInfoModal(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Description */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">📋 Descrição Completa</h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        {ANALYSIS_DETAILS[infoAnalysisId].fullDescription}
                                    </p>
                                </div>

                                {/* Metrics */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">📊 Métricas Principais</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {ANALYSIS_DETAILS[infoAnalysisId].metrics.map((metric, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-sm font-medium">
                                                {metric}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Algorithms */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">🤖 Algoritmos & Modelos</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ANALYSIS_DETAILS[infoAnalysisId].algorithms.map((algo, i) => (
                                            <div key={i} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
                                                • {algo}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Use Case */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">💡 Casos de Uso</h3>
                                    <p className="text-gray-300 leading-relaxed bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                        {ANALYSIS_DETAILS[infoAnalysisId].useCase}
                                    </p>
                                </div>

                                {/* Data Required */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">📁 Dados Necessários</h3>
                                    <ul className="space-y-2">
                                        {ANALYSIS_DETAILS[infoAnalysisId].dataRequired.map((data, i) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-300">
                                                <span className="text-green-400 mt-0.5">✓</span>
                                                <span>{data}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisHub;
