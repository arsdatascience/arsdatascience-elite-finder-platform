import React, { useState } from 'react';
import {
    Book,
    LayoutDashboard,
    Megaphone,
    Plane,
    Headphones,
    MessageSquare,
    Users,
    Share2,
    GitBranch,
    Palette,
    Sparkles,
    ChevronDown,
    Search,
    Briefcase,
    Wallet,
    ShoppingBag
} from 'lucide-react';

interface HelpSection {
    id: string;
    title: string;
    icon: React.ElementType;
    description: string;
    steps: {
        title: string;
        content: string;
    }[];
}

const HELP_SECTIONS: HelpSection[] = [
    {
        id: 'dashboard',
        title: 'Gestão Estratégica (Dashboard)',
        icon: LayoutDashboard,
        description: 'Visão unificada de ROI e desempenho de mídia paga.',
        steps: [
            {
                title: 'Filtros de Plataforma',
                content: 'Use os botões no topo da aba "Gestão Estratégica" para filtrar dados específicos de Google Ads, Meta Ads, YouTube Ads ou LinkedIn Ads.'
            },
            {
                title: 'KPIs Consolidados',
                content: 'Visualize o ROI Total, Custo por Conversão (CPA) e Taxa de Conversão combinados de todas as suas campanhas ativas.'
            },
            {
                title: 'Gráficos de Tendência',
                content: 'Compare visualmente o investimento vs. receita gerada nos últimos 30 dias para identificar eficiência de gastos.'
            },
            {
                title: 'Funil de Vendas',
                content: 'Monitore as taxas de conversão em cada etapa: Impressões -> Cliques -> Leads -> Vendas.'
            }
        ]
    },
    {
        id: 'sales_coaching',
        title: 'Sales Coaching & Teleprompter',
        icon: Headphones,
        description: 'Assistente de IA em tempo real para fechar mais vendas.',
        steps: [
            {
                title: 'Conexão Evolution API',
                content: 'Certifique-se de que sua instância do WhatsApp está conectada. O sistema detecta automaticamente conversas ativas.'
            },
            {
                title: 'Teleprompter Inteligente',
                content: 'Enquanto você conversa, a IA analisa o texto e sugere respostas. O painel agora possui scroll vertical para visualizar análises longas.'
            },
            {
                title: 'Detecção de Contexto',
                content: 'A IA sabe quando você está apenas batendo papo (Informal) ou negociando (Vendas) e adapta as sugestões: Rapport vs Técnicas de Fechamento.'
            },
            {
                title: 'Relatórios PDF',
                content: 'Ao final de uma conversa, clique nos botões de download para baixar um "Relatório de Análise" (resumido) ou "Histórico Completo" em PDF.'
            }
        ]
    },
    {
        id: 'market_analysis',
        title: 'Análise de Mercado (ML)',
        icon: BarChart3,
        description: 'Machine Learning aplicado aos seus dados de negócio.',
        steps: [
            {
                title: 'Aba Dados',
                content: 'Faça upload de arquivos CSV/Excel. A tabela formata automaticamente valores monetários (R$) e numéricos para facilitar a leitura.'
            },
            {
                title: 'Visualização de Dados',
                content: 'Explore distribuições estatísticas, correlações e detecte outliers nos seus datasets importados antes de rodar modelos.'
            },
            {
                title: 'Insights IA',
                content: 'A aba "Insights IA" cruza dados do CRM, Financeiro e Projetos para gerar estratégias de retenção e upsell baseadas no perfil real dos seus clientes.'
            }
        ]
    },
    {
        id: 'campaigns',
        title: 'Campanhas',
        icon: Megaphone,
        description: 'Gerencie seus anúncios em múltiplas plataformas.',
        steps: [
            {
                title: 'Criar Campanha',
                content: 'Use o botão "Nova Campanha" para iniciar. A IA pode ajudar a gerar a estrutura ideal para Google ou Meta Ads.'
            },
            {
                title: 'Otimização Automática',
                content: 'O sistema monitora o desempenho e sugere ajustes de orçamento ou criativos para maximizar o ROI.'
            }
        ]
    },
    {
        id: 'flight_control',
        title: 'Flight Control (CRM)',
        icon: Plane,
        description: 'Controle granular de tráfego e distribuição de leads.',
        steps: [
            {
                title: 'Kanban Drag-and-Drop',
                content: 'Arraste leads entre colunas para atualizar status. A IA pode mover cards automaticamente baseada em gatilhos do WhatsApp.'
            },
            {
                title: 'Quick Actions',
                content: 'No card do lead, use os botões rápidos para Ligar, Enviar WhatsApp ou Agendar Reunião sem abrir telas extras.'
            },
            {
                title: 'Lead Scoring',
                content: 'Identifique rapidamente os leads mais quentes (pontuação alta) e priorize o atendimento.'
            }
        ]
    },
    {
        id: 'chat_ai',
        title: 'Análise de Conversas',
        icon: MessageSquare,
        description: 'Auditoria de qualidade de atendimento com IA.',
        steps: [
            {
                title: 'Upload de Histórico',
                content: 'Cole o texto de uma conversa ou faça upload de um arquivo para análise profunda de sentimento e objeções.'
            },
            {
                title: 'Relatório de Qualidade',
                content: 'Receba um relatório detalhando pontos fortes, fracos e oportunidades de melhoria no atendimento da sua equipe.'
            }
        ]
    },
    {
        id: 'clients',
        title: 'Clientes & Leads',
        icon: Users,
        description: 'Base unificada de contatos.',
        steps: [
            {
                title: 'Cadastro Unificado',
                content: 'Adicione clientes manualmente ou integre com formulários. O sistema unifica duplicatas automaticamente.'
            },
            {
                title: 'Segmentação Inteligente',
                content: 'Use tags e filtros para criar listas de segmentação (ex: "VIP", "Risco de Churn") para ações de marketing.'
            }
        ]
    },
    {
        id: 'social',
        title: 'Social Media',
        icon: Share2,
        description: 'Gestão de redes sociais em um só lugar.',
        steps: [
            {
                title: 'Agendamento Multi-Plataforma',
                content: 'Crie e agende posts para Instagram, LinkedIn e Facebook a partir de uma única interface.'
            },
            {
                title: 'Calendário Visual',
                content: 'Visualize todo o seu planejamento de conteúdo no módulo "Calendário" para garantir consistência.'
            }
        ]
    },
    {
        id: 'creative_studio',
        title: 'Creative Studio',
        icon: Palette,
        description: 'Crie assets visuais e textos persuasivos.',
        steps: [
            {
                title: 'Geração de Copywriting',
                content: 'Use a IA para escrever legendas, e-mails de vendas e roteiros de vídeo focados em conversão.'
            },
            {
                title: 'Editor de Imagens',
                content: 'Crie designs rápidos e profissionais para seus posts sem precisar de softwares externos.'
            },
            {
                title: 'Content Loop',
                content: 'A IA analisa dúvidas frequentes do suporte e sugere temas de conteúdo que resolvem dores reais.'
            }
        ]
    },
    {
        id: 'automation',
        title: 'Automação (n8n)',
        icon: GitBranch,
        description: 'Crie fluxos de trabalho automatizados complexos.',
        steps: [
            {
                title: 'Workflows Visuais',
                content: 'Conecte diferentes apps e serviços (ex: "Novo Lead -> CRM -> WhatsApp -> Email") em uma interface visual.'
            },
            {
                title: 'Templates Prontos',
                content: 'Use modelos pré-configurados para automações comuns de marketing e vendas para ganhar tempo.'
            }
        ]
    },
    {
        id: 'projects',
        title: 'Gestão de Projetos',
        icon: Briefcase,
        description: 'Gerencie escopo, prazos e entregáveis.',
        steps: [
            {
                title: 'Estrutura de Projetos',
                content: 'Organize o trabalho em Projetos > Tarefas > Subtarefas. Defina budget e prazos para cada projeto.'
            },
            {
                title: 'Visão Kanban e Lista',
                content: 'Escolha a visualização que melhor se adapta ao seu fluxo de trabalho.'
            },
            {
                title: 'Gestão de Capacidade',
                content: 'Visualize a carga de trabalho da equipe para evitar gargalos e atrasos.'
            }
        ]
    },
    {
        id: 'financial',
        title: 'Gestão Financeira',
        icon: Wallet,
        description: 'Controle de receitas, despesas e fluxo de caixa.',
        steps: [
            {
                title: 'Fluxo de Caixa',
                content: 'Acompanhe entradas e saídas em tempo real. Categorize transações para relatórios precisos.'
            },
            {
                title: 'Rentabilidade por Cliente',
                content: 'Vincule receitas e despesas a clientes específicos para saber quem traz mais lucro.'
            }
        ]
    },
    {
        id: 'service_catalog',
        title: 'Catálogo de Serviços',
        icon: ShoppingBag,
        description: 'Gestão de produtos e serviços.',
        steps: [
            {
                title: 'Padronização',
                content: 'Cadastre seus pacotes de serviços com preços e escopos definidos para agilizar orçamentos.'
            },
            {
                title: 'Propostas Ágeis',
                content: 'Gere propostas comerciais profissionais usando os itens do seu catálogo em poucos cliques.'
            }
        ]
    },
    {
        id: 'elite_assistant',
        title: 'Elite Assistant',
        icon: Sparkles,
        description: 'Seu consultor de negócios 24/7.',
        steps: [
            {
                title: 'Respostas Baseadas em Dados',
                content: 'Pergunte sobre seus números (ex: "Qual meu faturamento este mês?") e receba respostas precisas.'
            },
            {
                title: 'Pesquisa Web',
                content: 'Ative o acesso à internet para que a IA pesquise tendências de mercado e concorrentes.'
            },
            {
                title: 'Memória Empresarial (RAG)',
                content: 'O assistente aprende com seus documentos e manuais para dar respostas alinhadas à sua cultura.'
            }
        ]
    }
];

export const HelpCenter: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const filteredSections = HELP_SECTIONS.filter(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.steps.some(step => step.title.toLowerCase().includes(searchTerm.toLowerCase()) || step.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleSection = (id: string) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in pb-20">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 text-primary-600 rounded-full mb-4">
                    <Book size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Manual de Uso Elite Finder</h1>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    Domine todas as ferramentas da plataforma. Navegue pelos módulos abaixo para aprender como extrair o máximo de cada funcionalidade.
                </p>

                <div className="mt-8 relative max-w-xl mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm transition-all"
                        placeholder="Buscar funcionalidade ou dúvida..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {filteredSections.map((section) => {
                    const Icon = section.icon;
                    const isExpanded = expandedSection === section.id;

                    return (
                        <div
                            key={section.id}
                            className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-primary-500 shadow-md ring-1 ring-primary-500' : 'border-gray-200 hover:border-primary-300'}`}
                        >
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${isExpanded ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg ${isExpanded ? 'text-primary-700' : 'text-gray-800'}`}>
                                            {section.title}
                                        </h3>
                                        <p className="text-sm text-gray-500">{section.description}</p>
                                    </div>
                                </div>
                                <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary-600' : 'text-gray-400'}`}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-5 pb-5 pt-0 animate-fade-in">
                                    <div className="h-px bg-gray-100 mb-4"></div>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {section.steps.map((step, index) => (
                                            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </span>
                                                    {step.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 leading-relaxed pl-8">
                                                    {step.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredSections.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p>Nenhum resultado encontrado para "{searchTerm}".</p>
                    </div>
                )}
            </div>
        </div>
    );
};
