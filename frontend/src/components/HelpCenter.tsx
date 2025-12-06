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
        title: 'Dashboard',
        icon: LayoutDashboard,
        description: 'Visão geral do desempenho do seu negócio.',
        steps: [
            {
                title: 'KPIs Principais',
                content: 'Acompanhe métricas vitais como ROI, CTR, CPC e Conversões em tempo real. Os cards superiores mostram o resumo consolidado.'
            },
            {
                title: 'Gráficos de Desempenho',
                content: 'Visualize a evolução das suas campanhas ao longo do tempo. Você pode filtrar por período (Hoje, 7 dias, 30 dias).'
            },
            {
                title: 'Funil de Vendas',
                content: 'Entenda onde você está perdendo clientes. O funil mostra a jornada desde a impressão até a venda.'
            }
        ]
    },
    {
        id: 'sales_coaching',
        title: 'Sales Coaching',
        icon: Headphones,
        description: 'Seu assistente de vendas em tempo real via WhatsApp.',
        steps: [
            {
                title: 'Conectando o WhatsApp',
                content: 'Clique no ícone de engrenagem, selecione "Evolution API", insira a URL da API, Nome da Instância e API Key. Salve para conectar.'
            },
            {
                title: 'Teleprompter IA',
                content: 'Enquanto você conversa com o cliente, a IA analisa o sentimento e sugere respostas estratégicas no painel à direita.'
            },
            {
                title: 'Gestão de Sessões',
                content: 'Alterne entre diferentes conversas na barra lateral esquerda. O histórico é salvo automaticamente.'
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
                title: 'Otimização',
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
                title: 'Smart Lead Mover (Novo)',
                content: 'A IA monitora o WhatsApp. Se o cliente disser "Quero fechar", o card move automaticamente para "Negociação" no Kanban.'
            },
            {
                title: 'Lead Scoring Automático',
                content: 'Cada lead ganha pontos (0-100) baseado em dados (email, empresa) e interações. Leads quentes sobem no ranking.'
            },
            {
                title: 'Follow-up Omnichannel',
                content: 'Se um lead novo não for atendido em 24h, o sistema envia um "Oi" automático no WhatsApp para reativá-lo.'
            }
        ]
    },
    {
        id: 'chat_ai',
        title: 'Análise IA',
        icon: MessageSquare,
        description: 'Analise conversas passadas para extrair insights.',
        steps: [
            {
                title: 'Upload de Conversas',
                content: 'Cole o texto de uma conversa ou faça upload de um arquivo para análise profunda.'
            },
            {
                title: 'Relatório de Qualidade',
                content: 'Receba um relatório detalhando pontos fortes, fracos e oportunidades de melhoria no atendimento.'
            }
        ]
    },
    {
        id: 'clients',
        title: 'Clientes & Leads',
        icon: Users,
        description: 'CRM completo para gestão de relacionamento.',
        steps: [
            {
                title: 'Cadastro',
                content: 'Adicione clientes manualmente ou integre com formulários para captura automática.'
            },
            {
                title: 'Segmentação',
                content: 'Use tags e filtros para organizar sua base de contatos e criar campanhas direcionadas.'
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
                title: 'Agendamento',
                content: 'Crie e agende posts para Instagram, LinkedIn e Facebook.'
            },
            {
                title: 'Calendário Visual',
                content: 'Visualize seu planejamento de conteúdo no módulo "Calendário".'
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
                title: 'Content Loop (Novo)',
                content: 'A IA lê as dúvidas do suporte e gera ideias de posts que resolvem dores reais dos clientes.'
            },
            {
                title: 'Geração de Copy',
                content: 'Use a IA para escrever legendas, e-mails e roteiros de vídeo.'
            },
            {
                title: 'Editor de Imagens',
                content: 'Crie designs rápidos para seus posts sem sair da plataforma.'
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
                title: 'Workflows',
                content: 'Conecte diferentes apps e serviços. Ex: "Quando chegar lead no Facebook, enviar WhatsApp e adicionar no CRM".'
            },
            {
                title: 'Templates',
                content: 'Use modelos prontos para automações comuns de marketing e vendas.'
            }
        ]
    },
    {
        id: 'projects',
        title: 'Gestão de Projetos',
        icon: Briefcase,
        description: 'Gerencie projetos, tarefas e prazos.',
        steps: [
            {
                title: 'Novo Projeto',
                content: 'Clique em "Novo Projeto" no Project Center. Defina cliente, orçamento e prazos. O status inicial pode ser "Planejamento".'
            },
            {
                title: 'Quadro Kanban',
                content: 'Gerencie tarefas arrastando cards entre colunas (Backlog -> Em Andamento -> Concluído). O progresso atualiza a barra do projeto.'
            },
            {
                title: 'Carga de Trabalho',
                content: 'Visualize quantas tarefas cada membro da equipe possui para evitar sobrecarga.'
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
                title: 'Transações',
                content: 'Registre entradas e saídas. Vincule a clientes e projetos para relatórios de rentabilidade.'
            },
            {
                title: 'Dashboard Financeiro',
                content: 'Acompanhe o fluxo de caixa, lucro líquido e despesas por categoria em tempo real.'
            }
        ]
    },
    {
        id: 'service_catalog',
        title: 'Catálogo de Serviços',
        icon: ShoppingBag,
        description: 'Gestão de produtos e serviços oferecidos (Em Implementação).',
        steps: [
            {
                title: 'Definição de Produtos',
                content: 'Cadastre seus pacotes de serviços (ex: "Gestão de Mídias Social Starter") com preços e escopo padrão.'
            },
            {
                title: 'Propostas Rápidas',
                content: 'Use os serviços cadastrados para gerar propostas comerciais padronizadas em segundos.'
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
                title: 'Financial Advisor (Novo)',
                content: 'Pergunte "Qual meu saldo?" ou "Como está o ROI?" e ele responderá com dados reais do financeiro.'
            },
            {
                title: 'Acesso à Internet (Novo)',
                content: 'Ative o botão "Acesso à Internet" para que a IA pesquise tendências e notícias atuais na web.'
            },
            {
                title: 'Memória RAG',
                content: 'O assistente lê seus manuais e documentos internos para dar respostas técnicas precisas.'
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
