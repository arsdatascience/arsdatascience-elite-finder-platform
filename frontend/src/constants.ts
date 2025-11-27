// Navigation and data constants
import { Campaign, Lead, LeadStatus, Metric, ChatMessage } from './types';
import { Home, LayoutDashboard, Megaphone, Plane, MessageSquare, Settings, Share2, GitBranch, BookOpen, Sparkles, Users, FileText, Bot, Calendar } from 'lucide-react';

export const NAV_ITEMS = [
  // Home
  { id: 'HOME', label: 'Início', icon: Home },
  // Existing items
  { id: 'DASHBOARD', label: 'Dashboard Executivo', icon: LayoutDashboard },
  { id: 'CAMPAIGNS', label: 'Campanhas de Ads', icon: Megaphone },
  { id: 'FLIGHT_CONTROL', label: 'Controle de Voo', icon: Plane },
  { id: 'CLIENTS', label: 'Clientes e Cadastro', icon: Users },
  { id: 'CHAT_AI', label: 'Análise de Chat IA', icon: MessageSquare },
  { id: 'SOCIAL', label: 'Redes Sociais', icon: Share2 },
  { id: 'AUTOMATION', label: 'Automação', icon: GitBranch },
  { id: 'REPORTS', label: 'Relatórios', icon: FileText },
  { id: 'TRAINING', label: 'Academia de Treino', icon: BookOpen },
  { id: 'AI_AGENT', label: 'Estúdio Criativo IA', icon: Sparkles },
  { id: 'ELITE_ASSISTANT', label: 'Assistente Elite', icon: Bot },
  { id: 'AGENT_BUILDER', label: 'Agente Builder', icon: Bot },
  { id: 'SETTINGS', label: 'Configurações', icon: Settings },
  // New items
  { id: 'SOCIAL_CALENDAR', label: 'Calendário Social', icon: Calendar },
  { id: 'SOCIAL_INTEGRATIONS', label: 'Integrações Sociais', icon: Share2 },
];

export const CLIENTS_LIST = [
  { id: 'all', name: 'Todos os Clientes (Visão Global)' },
  { id: '1', name: 'TechCorp Soluções Ltda' },
  { id: '2', name: 'Padaria do João' },
  { id: '3', name: 'Ana Maria Silva (Consultoria)' },
];

export const KPIS: Metric[] = [
  { label: 'Faturamento Total', value: 'R$ 711.500,00', change: 12.5, trend: 'up' },
  { label: 'Investimento Ads', value: 'R$ 122.500,00', change: -2.4, trend: 'down' },
  { label: 'ROAS', value: '5.8x', change: 8.1, trend: 'up' },
  { label: 'CPA Médio', value: 'R$ 92,00', change: -5.2, trend: 'down' },
];

export const CAMPAIGNS_DATA: Campaign[] = [
  { id: '1', name: 'Promoção Verão - Pesquisa', platform: 'google', status: 'active', budget: 25000, spent: 10500, ctr: 4.2, roas: 6.1, conversions: 85 },
  { id: '2', name: 'Remarketing - Feed', platform: 'meta', status: 'active', budget: 15000, spent: 6000, ctr: 1.8, roas: 4.5, conversions: 42 },
  { id: '3', name: 'Brand Awareness - Reels', platform: 'meta', status: 'learning', budget: 7500, spent: 2000, ctr: 0.9, roas: 1.2, conversions: 5 },
  { id: '4', name: 'Concorrentes - Pesquisa', platform: 'google', status: 'paused', budget: 10000, spent: 9500, ctr: 3.5, roas: 2.1, conversions: 22 },
  { id: '5', name: 'Youtube - Discovery', platform: 'google', status: 'learning', budget: 5000, spent: 1200, ctr: 0.8, roas: 1.5, conversions: 8 },
  { id: '6', name: 'Stories - Lançamento', platform: 'meta', status: 'active', budget: 12000, spent: 8500, ctr: 2.1, roas: 3.8, conversions: 65 },
];

export const LEADS_DATA: Lead[] = [
  { id: 'L1', name: 'Alice Ferreira', source: 'Google Ads', productInterest: 'Plano Premium', status: LeadStatus.NEW, value: 6000, lastContact: '10m atrás', tags: ['Quente', 'Urgente'], assignedTo: 'Sarah' },
  { id: 'L2', name: 'Roberto Silva', source: 'Instagram', productInterest: 'Kit Inicial', status: LeadStatus.IN_PROGRESS, value: 2250, lastContact: '2h atrás', tags: ['Follow-up'], assignedTo: 'Mike' },
  { id: 'L3', name: 'Carlos Dias', source: 'Organic', productInterest: 'Enterprise', status: LeadStatus.WAITING, value: 25000, lastContact: '1d atrás', tags: ['Decisor'], assignedTo: 'Sarah' },
  { id: 'L4', name: 'Diana Prata', source: 'Google Ads', productInterest: 'Plano Premium', status: LeadStatus.CLOSED_WON, value: 6000, lastContact: '3d atrás', tags: ['Onboarding'], assignedTo: 'Mike' },
  { id: 'L5', name: 'Evandro Souza', source: 'Instagram', productInterest: 'Kit Inicial', status: LeadStatus.NEW, value: 2250, lastContact: '5m atrás', tags: [], assignedTo: 'Sarah' },
];

export const MOCK_CHAT: ChatMessage[] = [
  { id: '1', sender: 'client', text: 'Olá, vi o anúncio da solução Enterprise. Quanto custa?', timestamp: '10:00' },
  { id: '2', sender: 'agent', text: 'Olá! Obrigado pelo contato. Nossas soluções Enterprise são personalizadas. Poderia me falar um pouco sobre o tamanho da sua equipe?', timestamp: '10:02' },
  { id: '3', sender: 'client', text: 'Temos cerca de 50 pessoas. Mas honestamente, estou olhando o Concorrente X e eles cobram R$ 250/usuário.', timestamp: '10:05' },
  { id: '4', sender: 'agent', text: 'Entendo que o preço é importante. O Concorrente X tem uma ferramenta básica boa, mas nossa plataforma inclui a suíte de automação IA que geralmente economiza 20 horas semanais da equipe. Economizar esse tempo seria valioso para você?', timestamp: '10:07' },
  { id: '5', sender: 'client', text: 'Isso soa interessante na verdade. Integra com Salesforce?', timestamp: '10:08' },
];

export const COMPARATIVE_FUNNEL_DATA = [
  { stage: 'Impressões', google: 85000, meta: 92000 },
  { stage: 'Cliques', google: 4200, meta: 3100 },
  { stage: 'Leads', google: 380, meta: 210 },
  { stage: 'Vendas', google: 85, meta: 42 },
];

export const DEVICE_DATA = [
  { name: 'Mobile', value: 65, color: '#f43f5e' },
  { name: 'Desktop', value: 30, color: '#3b82f6' },
  { name: 'Tablet', value: 5, color: '#10b981' },
];
