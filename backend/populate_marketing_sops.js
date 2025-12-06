require('dotenv').config();
const { opsPool } = require('./database');

async function populateSOPs() {
    const client = await opsPool.connect();
    try {
        console.log('🔌 Connected to Ops DB. Inserting Marketing SOPs...');

        const sops = [
            // A. GESTÃO DE CLIENTES
            {
                name: "2.1 Onboarding de Clientes",
                description: "Processo de entrada de novos clientes, desde o intake até o kickoff.",
                category: "Marketing - Gestão de Clientes",
                items: [
                    "Formulário de intake inicial e questionário de discovery",
                    "Configuração de contas nas plataformas (Meta, Google, LinkedIn)",
                    "Assinatura de contratos e NDAs",
                    "Setup de acesso ao Marketing Hub AIIAM",
                    "Reunião de kickoff e alinhamento de expectativas",
                    "Definição de KPIs e objetivos SMART",
                    "Criação de calendário de entregas"
                ]
            },
            {
                name: "2.2 Comunicação com Clientes",
                description: "Protocolos para comunicação eficiente e gerenciamento de expectativas.",
                category: "Marketing - Gestão de Clientes",
                items: [
                    "Definir protocolos de comunicação (e-mail, Slack, WhatsApp)",
                    "Estabelecer frequência de reuniões de status",
                    "Padronizar formato de status reports",
                    "Definir fluxo de escalação de problemas",
                    "Estabelecer processo de aprovação de conteúdo"
                ]
            },
            {
                name: "2.3 Reporting e Performance",
                description: "Rotina de coleta de dados e apresentação de resultados.",
                category: "Marketing - Gestão de Clientes",
                items: [
                    "Coleta de dados de múltiplas plataformas",
                    "Atualização da estrutura de relatórios mensais",
                    "Verificação de Dashboards em tempo real",
                    "Preparação da apresentação de resultados",
                    "Elaborar recomendações estratégicas baseadas em dados"
                ]
            },

            // B. SEO
            {
                name: "2.4 Pesquisa de Palavras-Chave",
                description: "Identificação de oportunidades de busca orgânica.",
                category: "Marketing - SEO",
                items: [
                    "Identificação de termos principais e secundários",
                    "Análise de volume de busca e dificuldade",
                    "Mapeamento de intenção de busca",
                    "Análise de concorrência",
                    "Priorização de palavras-chave"
                ]
            },
            {
                name: "2.5 Otimização On-Page",
                description: "Melhorias técnicas e de conteúdo dentro das páginas.",
                category: "Marketing - SEO",
                items: [
                    "Otimização de title tags e meta descriptions",
                    "Revisão da estrutura de headings (H1, H2, H3)",
                    "Otimização de imagens (alt text, compressão)",
                    "Revisão de links internos",
                    "Implementação de Schema markup",
                    "Otimização de velocidade de carregamento"
                ]
            },
            {
                name: "2.6 Link Building",
                description: "Estratégias para aquisição de autoridade externa.",
                category: "Marketing - SEO",
                items: [
                    "Identificação de oportunidades de backlinks",
                    "Análise de perfil de backlinks de concorrentes",
                    "Execução de estratégias de outreach",
                    "Guest posting",
                    "Monitoramento de novos backlinks",
                    "Correção de broken links"
                ]
            },
            {
                name: "2.7 SEO Técnico",
                description: "Manutenção da saúde técnica do website.",
                category: "Marketing - SEO",
                items: [
                    "Auditoria técnica completa",
                    "Correção de erros de crawling",
                    "Otimização de robots.txt e sitemap.xml",
                    "Implementação/Validação de dados estruturados",
                    "Otimização Mobile-first",
                    "Otimização de Core Web Vitals"
                ]
            },

            // C. CONTEÚDO E CRIAÇÃO
            {
                name: "2.8 Planejamento de Calendário Editorial",
                description: "Organização estratégica de publicações.",
                category: "Marketing - Conteúdo",
                items: [
                    "Brainstorming de temas mensais",
                    "Definição de pilares de conteúdo",
                    "Criação do cronograma de publicações",
                    "Distribuição por plataforma",
                    "Aprovação de pautas"
                ]
            },
            {
                name: "2.9 Criação de Conteúdo para Blog",
                description: "Produção de artigos otimizados.",
                category: "Marketing - Conteúdo",
                items: [
                    "Elaboração de brief de conteúdo",
                    "Pesquisa e curadoria de fontes",
                    "Estruturação do artigo",
                    "Redação e otimização SEO",
                    "Revisão editorial",
                    "Inserção de CTAs e links internos",
                    "Publicação e distribuição"
                ]
            },
            {
                name: "2.10 Produção de Conteúdo Visual",
                description: "Design e vídeo para canais digitais.",
                category: "Marketing - Conteúdo",
                items: [
                    "Briefing de design por plataforma",
                    "Criação de artes estáticas",
                    "Produção de vídeos curtos (Reels/TikTok)",
                    "Edição e pós-produção",
                    "Obter aprovação do cliente",
                    "Versionamento para múltiplas plataformas"
                ]
            },
            {
                name: "2.11 Copywriting para Anúncios",
                description: "Escrita persuasiva para campanhas pagas.",
                category: "Marketing - Conteúdo",
                items: [
                    "Análise de persona e dores",
                    "Definição de estruturas (AIDA, PAS)",
                    "Criação de headlines impactantes",
                    "Definição de CTAs persuasivos",
                    "Planejamento de Testes A/B",
                    "Atualização do banco de copies"
                ]
            },

            // D. MÍDIA SOCIAL
            {
                name: "2.12 Gestão de Instagram",
                description: "Rotina de gerenciamento de perfil no Instagram.",
                category: "Marketing - Social Media",
                items: [
                    "Setup/Verificação de conta business",
                    "Planejamento visual do grid",
                    "Criação de Stories diários",
                    "Produção de Reels semanais",
                    "Definição de hashtags",
                    "Engajamento diário com seguidores",
                    "Resposta a DMs e comentários",
                    "Análise semanal de métricas"
                ]
            },
            {
                name: "2.13 Gestão de Facebook",
                description: "Gerenciamento de páginas e comunidades.",
                category: "Marketing - Social Media",
                items: [
                    "Configuração de Página Business",
                    "Programação de posts variados",
                    "Gestão de Grupos vinculados",
                    "Planejamento de Lives",
                    "Moderação de comentários",
                    "Resposta a mensagens (Inbox)"
                ]
            },
            {
                name: "2.14 Gestão de LinkedIn",
                description: "Marketing B2B e posicionamento profissional.",
                category: "Marketing - Social Media",
                items: [
                    "Otimização da Company Page",
                    "Estratégia de conteúdo B2B",
                    "Publicação de Artigos vs Posts",
                    "Gestão do programa de Employee Advocacy",
                    "Planejamento de Eventos/Lives",
                    "Networking ativo e engajamento",
                    "Análise de leads do LinkedIn"
                ]
            },
            {
                name: "2.15 Gestão de YouTube",
                description: "Crescimento e otimização de canal de vídeo.",
                category: "Marketing - Social Media",
                items: [
                    "Setup e branding do canal",
                    "Planejamento de pautas de vídeo",
                    "Otimização SEO (títulos/descrições)",
                    "Criação de thumbnails estratégica",
                    "Gestão de comentários",
                    "Análise de retenção e insights"
                ]
            },
            {
                name: "2.16 Gestão de TikTok",
                description: "Estratégia de vídeos curtos virais.",
                category: "Marketing - Social Media",
                items: [
                    "Setup de conta Business",
                    "Planejamento de conteúdo viral",
                    "Pesquisa de tendências e sons",
                    "Participação em Challenges",
                    "Análise de TikTok Analytics",
                    "Gestão de colaborações"
                ]
            },
            {
                name: "2.17 Moderação e Community",
                description: "Gestão de relacionamento e SAC 2.0.",
                category: "Marketing - Social Media",
                items: [
                    "Seguir diretrizes de tom e voz",
                    "Verificar tempo de resposta",
                    "Gestão de críticas negativas",
                    "Escalação de crises",
                    "Uso de templates de respostas",
                    "Relatório de sentimento da comunidade"
                ]
            },
            {
                name: "2.18 Gerenciamento de Crises",
                description: "Protocolos para situações de risco de imagem.",
                category: "Marketing - Social Media",
                items: [
                    "Identificação rápida da crise",
                    "Ativação da árvore de decisão",
                    "Comunicação interna de alinhamento",
                    "Publicação de resposta oficial",
                    "Monitoramento intensivo pós-crise",
                    "Reunião de aprendizados"
                ]
            },

            // E. MÍDIA PAGA
            {
                name: "2.19 Google Ads - Search",
                description: "Gestão de campanhas na rede de pesquisa.",
                category: "Marketing - Mídia Paga",
                items: [
                    "Estruturação de campanhas",
                    "Criação de grupos de anúncios (SKAGs/Temáticos)",
                    "Redação de anúncios responsivos",
                    "Configuração de extensões de anúncio",
                    "Revisão de estratégias de lances",
                    "Monitoramento de Quality Score",
                    "Otimização de termos de busca (negativação)"
                ]
            },
            {
                name: "2.20 Google Ads - Display",
                description: "Campanhas visuais na rede de display.",
                category: "Marketing - Mídia Paga",
                items: [
                    "Definição de audiências alvo",
                    "Design de banners adaptáveis",
                    "Configuração de Remarketing",
                    "Otimização de canais (Placements)",
                    "Ajuste de Frequency Capping"
                ]
            },
            {
                name: "2.21 Google Ads - Shopping",
                description: "Campanhas para e-commerce.",
                category: "Marketing - Mídia Paga",
                items: [
                    "Setup/Verificação do Merchant Center",
                    "Otimização do feed de produtos",
                    "Revisão de títulos e descrições",
                    "Estratégia de lances por produto/categoria",
                    "Gestão de campanhas Performance Max"
                ]
            },
            {
                name: "2.22 Meta Ads (FB/IG)",
                description: "Gestão de tráfego pago no ecossistema Meta.",
                category: "Marketing - Mídia Paga",
                items: [
                    "Definição de objetivo (Awareness/Conv.)",
                    "Verificação de Pixel e API de Conversões",
                    "Criação de audiências (Lookalike/Custom)",
                    "Setup de anúncios (Carrossel/Vídeo/Imagem)",
                    "Testes A/B de criativos",
                    "Otimização de orçamento (CBO/ABO)",
                    "Análise de ROAS e CPA"
                ]
            },
            {
                name: "2.23 LinkedIn Ads",
                description: "Anúncios B2B profissionais.",
                category: "Marketing - Mídia Paga",
                items: [
                    "Setup no Campaign Manager",
                    "Escolha de formato (Sponsored/Message)",
                    "Segmentação por cargo/indústria",
                    "Configuração de Lead Gen Forms",
                    "Monitoramento de lances",
                    "Setup de Retargeting"
                ]
            },
            {
                name: "2.24 TikTok Ads",
                description: "Publicidade na plataforma de vídeos curtos.",
                category: "Marketing - Mídia Paga",
                items: [
                    "Setup no Ads Manager",
                    "Escolha de formato (Spark/In-Feed)",
                    "Criação de criativos nativos (UGC style)",
                    "Instalação de Pixel e eventos",
                    "Otimização para conversão"
                ]
            },
            {
                name: "2.25 YouTube Ads",
                description: "Publicidade em vídeo no YouTube.",
                category: "Marketing - Mídia Paga",
                items: [
                    "Seleção de formato (Bumper/In-stream)",
                    "Produção de vídeos específicos (hooks)",
                    "Segmentação por intenção/canais",
                    "Setup de Remarketing de visualização",
                    "Otimização de CPV e Conversões"
                ]
            },

            // F. EMAIL MARKETING
            {
                name: "2.26 Estratégia de Email",
                description: "Planejamento de campanhas de email.",
                category: "Marketing - Email",
                items: [
                    "Segmentação higienizada de listas",
                    "Definição de fluxos de automação",
                    "Criação do calendário de disparos",
                    "Planejamento de Testes A/B",
                    "Análise de entregabilidade e métricas"
                ]
            },
            {
                name: "2.27 Criação de Emails",
                description: "Produção técnica e criativa de emails.",
                category: "Marketing - Email",
                items: [
                    "Design de template responsivo",
                    "Copywriting de Assunto e Preheader",
                    "Redação do corpo do email",
                    "Otimização de CTAs",
                    "Verificação de compliance (LGPD/Unsubscribe)"
                ]
            },
            {
                name: "2.28 Automação de Email",
                description: "Fluxos automáticos de nutrição.",
                category: "Marketing - Email",
                items: [
                    "Setup na ferramenta (RD/HubSpot/Active)",
                    "Criação dos workflows visuais",
                    "Definição de Lead Scoring",
                    "Configuração de gatilhos e condições",
                    "Integração com CRM de vendas"
                ]
            },

            // G. ANALYTICS
            {
                name: "2.29 Google Analytics 4",
                description: "Configuração e análise de dados web.",
                category: "Marketing - Analytics",
                items: [
                    "Setup de propriedade e data streams",
                    "Configuração de eventos personalizados",
                    "Definição de conversões chaves",
                    "Criação de segmentos de audiência",
                    "Elaboração de relatórios exploratórios",
                    "Linkar com Google Ads"
                ]
            },
            {
                name: "2.30 Google Tag Manager",
                description: "Gestão de tags e pixels.",
                category: "Marketing - Analytics",
                items: [
                    "Organização do container e pastas",
                    "Implementação de tags de marketing",
                    "Configuração de acionadores (Triggers)",
                    "Validação de variáveis e Data Layer",
                    "Debugging e publicação de versões"
                ]
            },
            {
                name: "2.31 Dashboards e Relatórios",
                description: "Visualização consolidada de dados.",
                category: "Marketing - Analytics",
                items: [
                    "Integração de fontes de dados",
                    "Criação de dashboards (Looker/PowerBI)",
                    "Configuração de gráficos de KPI",
                    "Automação de envio de relatórios",
                    "Revisão de consistência de dados"
                ]
            },

            // H. AUTOMAÇÃO
            {
                name: "2.32 Automação n8n/Zapier",
                description: "Integração de processos entre ferramentas.",
                category: "Marketing - Automação",
                items: [
                    "Mapeamento do processo manual",
                    "Criação do workflow na ferramenta",
                    "Configuração de Webhooks/Triggers",
                    "Teste de envio de dados",
                    "Configuração de tratamento de erros",
                    "Documentação da automação"
                ]
            },
            {
                name: "2.33 Integração de Ferramentas",
                description: "Conectividade técnica via API.",
                category: "Marketing - Automação",
                items: [
                    "Setup de credenciais de API",
                    "Fluxos de autenticação (OAuth)",
                    "Sincronização de campos de dados",
                    "Monitoramento de limites de requisição",
                    "Verificação de logs de erro"
                ]
            },
            {
                name: "2.34 AI para Marketing",
                description: "Uso de inteligência artificial em processos.",
                category: "Marketing - Automação",
                items: [
                    "Setup de prompts padrão",
                    "Geração de ideias/conteúdo com IA",
                    "Análise de sentimento automatizada",
                    "Otimização preditiva de campanhas",
                    "Personalização em escala"
                ]
            },

            // I. ESTRATÉGIA
            {
                name: "2.35 Objetivos SMART",
                description: "Definição de metas estratégicas.",
                category: "Marketing - Estratégia",
                items: [
                    "Aplicação do framework SMART",
                    "Alinhamento com objetivos de negócio",
                    "Definição de KPIs por canal",
                    "Pesquisa de benchmarks",
                    "Criação de timeline de metas"
                ]
            },
            {
                name: "2.36 Pesquisa de Mercado",
                description: "Inteligência competitiva.",
                category: "Marketing - Estratégia",
                items: [
                    "Mapeamento de concorrentes diretos/indiretos",
                    "Benchmarking de estratégias digitais",
                    "Identificação de gaps de mercado",
                    "Análise SWOT",
                    "Definição de posicionamento"
                ]
            },
            {
                name: "2.37 Desenvolvimento de Personas",
                description: "Criação de perfis de cliente ideal.",
                category: "Marketing - Estratégia",
                items: [
                    "Análise de base de clientes atuais",
                    "Mapeamento da jornada de compra",
                    "Definição de dores e motivações",
                    "Identificação de canais preferidos",
                    "Documentação visual da persona"
                ]
            },
            {
                name: "2.38 Planejamento de Campanhas",
                description: "Estruturação macro de campanhas.",
                category: "Marketing - Estratégia",
                items: [
                    "Preenchimento do Brief de Campanha",
                    "Definição de conceito criativo",
                    "Alocação de budget por canal",
                    "Cronograma de produção e veiculação",
                    "Plano de mensuração de sucesso"
                ]
            },

            // J. OPERAÇÕES
            {
                name: "2.39 Controle de Qualidade (QA)",
                description: "Garantia de excelência nas entregas.",
                category: "Marketing - Operações",
                items: [
                    "Checklist de revisão de conteúdo",
                    "Aprovações internas (duplo check)",
                    "Testes de link e visualização",
                    "QA de configurações de anúncios",
                    "Revisão ortográfica final"
                ]
            },
            {
                name: "2.40 Gestão de Projetos",
                description: "Organização do fluxo de trabalho.",
                category: "Marketing - Operações",
                items: [
                    "Setup do projeto na ferramenta (ClickUp/Asana)",
                    "Atribuição de responsáveis",
                    "Definição de prazos realistas",
                    "Acompanhamento de progresso diário",
                    "Reuniões de status de equipe"
                ]
            },
            {
                name: "2.41 Gestão de Assets",
                description: "Organização de arquivos digitais.",
                category: "Marketing - Operações",
                items: [
                    "Estruturação de pastas no Drive/Server",
                    "Aplicação de nomenclatura padrão",
                    "Controle de versão de arquivos",
                    "Backup de criativos finais",
                    "Atualização da biblioteca de templates"
                ]
            },
            {
                name: "2.42 Brand Guidelines",
                description: "Manutenção da identidade da marca.",
                category: "Marketing - Operações",
                items: [
                    "Atualização do Brandbook",
                    "Revisão de tom de voz e estilo",
                    "Diretrizes de uso de logo/cores",
                    "Curadoria de banco de imagens",
                    "Divulgação de exemplos de 'Faça/Não Faça'"
                ]
            },

            // K. CAPACITAÇÃO
            {
                name: "2.43 Onboarding de Equipe",
                description: "Integração de novos colaboradores.",
                category: "Marketing - Treinamento",
                items: [
                    "Apresentação da cultura e processos",
                    "Liberação de acessos a ferramentas",
                    "Treinamento técnico específico",
                    "Acompanhamento inicial (Shadowing)",
                    "Avaliação de período de experiência"
                ]
            },
            {
                name: "2.44 Atualização Contínua",
                description: "Educação continuada do time.",
                category: "Marketing - Treinamento",
                items: [
                    "Identificação de novos cursos/certificações",
                    "Agendamento de webinars internos",
                    "Sessões de compartilhamento de aprendizado",
                    "Documentação de novas best practices",
                    "Atualização da Base de Conhecimento"
                ]
            }
        ];

        for (const sop of sops) {
            // Check if exists
            const existingRes = await client.query(
                "SELECT id FROM templates WHERE name = $1 LIMIT 1",
                [sop.name]
            );

            let templateId;
            if (existingRes.rows.length > 0) {
                console.log(`ℹ️  SOP '${sop.name}' already exists. Updating items...`);
                templateId = existingRes.rows[0].id;
                // Optional: Update description/category
                await client.query(
                    "UPDATE templates SET description = $1, category = $2 WHERE id = $3",
                    [sop.description, sop.category, templateId]
                );
                // Clear existing items to re-insert (simple way to sync)
                await client.query("DELETE FROM template_items WHERE template_id = $1", [templateId]);
            } else {
                console.log(`✨ Creating SOP '${sop.name}'...`);
                const insertRes = await client.query(
                    "INSERT INTO templates (name, description, category, is_active) VALUES ($1, $2, $3, true) RETURNING id",
                    [sop.name, sop.description, sop.category]
                );
                templateId = insertRes.rows[0].id;
            }

            // Insert Items
            if (sop.items && sop.items.length > 0) {
                for (let i = 0; i < sop.items.length; i++) {
                    await client.query(
                        "INSERT INTO template_items (template_id, title, description, duration_days, order_index) VALUES ($1, $2, '', 1, $3)",
                        [templateId, sop.items[i], i]
                    );
                }
            }
        }

        console.log('✅ Successfully populated Marketing SOPs!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        process.exit();
    }
}

populateSOPs();
