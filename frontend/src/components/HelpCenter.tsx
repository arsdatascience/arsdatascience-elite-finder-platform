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
    Calendar,
    Link,
    Palette,
    Image,
    Mic2,
    DollarSign,
    GitBranch,
    GraduationCap,
    FileText,
    Bot,
    Sparkles,
    Settings,
    ChevronDown,
    ChevronUp,
    Search
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
        title: 'Flight Control',
        icon: Plane,
        description: 'Controle granular de tráfego e distribuição de leads.',
        steps: [
            {
                title: 'Regras de Distribuição',
                content: 'Defina como os leads são distribuídos entre sua equipe de vendas (Round Robin, Performance, etc).'
            },
            {
                title: 'Monitoramento de Status',
                content: 'Veja em tempo real quais campanhas estão ativas, pausadas ou em aprendizado.'
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
        id: 'elite_assistant',
        title: 'Elite Assistant',
        icon: Sparkles,
        description: 'Seu consultor de negócios 24/7.',
        steps: [
            {
                title: 'Tire Dúvidas',
                content: 'Pergunte qualquer coisa sobre marketing digital, estratégias de vendas ou uso da plataforma.'
            },
            {
                title: 'Brainstorming',
                content: 'Peça ideias de campanhas, nomes de produtos ou estratégias de crescimento.'
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
                <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-full mb-4">
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
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
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
                            className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${isExpanded ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg ${isExpanded ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {section.title}
                                        </h3>
                                        <p className="text-sm text-gray-500">{section.description}</p>
                                    </div>
                                </div>
                                <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}>
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
                                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
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
