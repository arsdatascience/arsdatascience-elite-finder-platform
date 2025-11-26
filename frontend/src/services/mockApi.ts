import { KPIS, COMPARATIVE_FUNNEL_DATA, DEVICE_DATA } from '../constants';
import { Metric, Workflow, WorkflowTemplate } from '../types';

// Dados Mockados
const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'new_lead_nurture',
        name: 'Nutrição de Novo Lead',
        description: 'Sequência automática para engajar novos leads',
        category: 'Vendas',
        trigger: 'Novo Lead Criado',
        iconType: 'user-plus',
        steps: [
            { type: 'wait', value: '5 minutos' },
            { type: 'email', value: 'Email de Boas-vindas' },
            { type: 'wait', value: '1 dia' },
            { type: 'whatsapp', value: 'Olá! Posso ajudar?' }
        ]
    },
    {
        id: 'cart_recovery',
        name: 'Recuperação de Carrinho',
        description: 'Reengaje clientes que abandonaram o checkout',
        category: 'E-commerce',
        trigger: 'Carrinho Abandonado',
        iconType: 'shopping-cart',
        steps: [
            { type: 'wait', value: '1 hora' },
            { type: 'email', value: 'Você esqueceu algo no carrinho!' },
            { type: 'wait', value: '24 horas' },
            { type: 'whatsapp', value: 'Oferta especial para finalizar sua compra 🎁' }
        ]
    },
    {
        id: 'post_sale_feedback',
        name: 'Feedback Pós-Venda',
        description: 'Solicite avaliação após a entrega do produto',
        category: 'Suporte',
        trigger: 'Pedido Entregue',
        iconType: 'message-square',
        steps: [
            { type: 'wait', value: '3 dias' },
            { type: 'email', value: 'Como foi sua experiência?' },
            { type: 'ai_generate', value: 'Analisar sentimento da resposta' },
            { type: 'crm', value: 'Atualizar score do cliente' }
        ]
    },
    {
        id: 'appointment_reminder',
        name: 'Lembrete de Agendamento',
        description: 'Reduza no-shows com lembretes automáticos',
        category: 'Serviços',
        trigger: 'Agendamento Criado',
        iconType: 'calendar',
        steps: [
            { type: 'wait', value: '24 horas antes' },
            { type: 'whatsapp', value: 'Lembrete: Seu agendamento é amanhã!' },
            { type: 'sms', value: 'Confirme sua presença respondendo SIM' }
        ]
    },
    {
        id: 'internal_alert_high_value',
        name: 'Alerta de Lead VIP',
        description: 'Notifique a equipe sobre leads de alto valor',
        category: 'Interno',
        trigger: 'Lead Score > 80',
        iconType: 'alert-circle',
        steps: [
            { type: 'slack', value: 'Novo Lead VIP detectado!' },
            { type: 'owner', value: 'Atribuir ao Gerente de Vendas' },
            { type: 'email', value: 'Prioridade: Contato Imediato' }
        ]
    }
];

let INITIAL_WORKFLOWS: Workflow[] = [
    {
        id: 1,
        name: 'Nutrição de Novo Lead',
        status: 'active',
        triggers: 'Novo Lead Criado',
        steps: 4,
        enrolled: 124,
        conversion: '12%',
        flowData: {
            nodes: [
                { id: '1', type: 'custom', position: { x: 250, y: 0 }, data: { type: 'trigger', value: 'Novo Lead Criado' } },
                { id: '2', type: 'custom', position: { x: 250, y: 100 }, data: { type: 'wait', value: '5 minutos' } },
                { id: '3', type: 'custom', position: { x: 250, y: 200 }, data: { type: 'email', value: 'Email de Boas-vindas' } },
                { id: '4', type: 'custom', position: { x: 250, y: 300 }, data: { type: 'whatsapp', value: 'Olá! Posso ajudar?' } }
            ],
            edges: [
                { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
                { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
                { id: 'e3-4', source: '3', target: '4', type: 'smoothstep' }
            ]
        }
    }
];

// Simula um delay de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_CHART_DATA = [
    { name: 'Seg', revenue: 20000, spend: 12000, google: 8000, meta: 4000 },
    { name: 'Ter', revenue: 15000, spend: 7000, google: 4000, meta: 3000 },
    { name: 'Qua', revenue: 10000, spend: 49000, google: 30000, meta: 19000 },
    { name: 'Qui', revenue: 13900, spend: 19500, google: 10000, meta: 9500 },
    { name: 'Sex', revenue: 9450, spend: 24000, google: 12000, meta: 12000 },
    { name: 'Sab', revenue: 11950, spend: 19000, google: 10000, meta: 9000 },
    { name: 'Dom', revenue: 17450, spend: 21500, google: 11500, meta: 10000 },
];

export const api = {
    dashboard: {
        getKPIs: async (clientId: string, platform: string) => {
            await delay(800);
            let baseKPIs = [...KPIS];

            if (clientId === '1') { // TechCorp
                baseKPIs = [
                    { label: 'Faturamento Total', value: 'R$ 450.000,00', change: 5.2, trend: 'up' },
                    { label: 'Investimento Ads', value: 'R$ 80.000,00', change: 1.1, trend: 'up' },
                    { label: 'ROAS', value: '5.6x', change: 4.1, trend: 'up' },
                    { label: 'CPA Médio', value: 'R$ 120,00', change: -2.0, trend: 'down' },
                ];
            } else if (clientId === '2') { // Padaria
                baseKPIs = [
                    { label: 'Faturamento Total', value: 'R$ 25.000,00', change: -1.5, trend: 'down' },
                    { label: 'Investimento Ads', value: 'R$ 5.000,00', change: 0.0, trend: 'neutral' },
                    { label: 'ROAS', value: '5.0x', change: -2.1, trend: 'down' },
                    { label: 'CPA Médio', value: 'R$ 15,00', change: 5.2, trend: 'up' },
                ];
            }

            if (platform === 'google') {
                return [
                    { ...baseKPIs[0], value: 'R$ ' + (parseFloat(baseKPIs[0].value.replace(/[^\d,]/g, '').replace(',', '.')) * 0.6).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
                    { ...baseKPIs[1], value: 'R$ ' + (parseFloat(baseKPIs[1].value.replace(/[^\d,]/g, '').replace(',', '.')) * 0.55).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
                    { ...baseKPIs[2], value: '6.1x' },
                    { ...baseKPIs[3], value: 'R$ 85,00' },
                ] as Metric[];
            } else if (platform === 'meta') {
                return [
                    { ...baseKPIs[0], value: 'R$ ' + (parseFloat(baseKPIs[0].value.replace(/[^\d,]/g, '').replace(',', '.')) * 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
                    { ...baseKPIs[1], value: 'R$ ' + (parseFloat(baseKPIs[1].value.replace(/[^\d,]/g, '').replace(',', '.')) * 0.45).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) },
                    { ...baseKPIs[2], value: '4.2x' },
                    { ...baseKPIs[3], value: 'R$ 45,00' },
                ] as Metric[];
            }

            return baseKPIs;
        },
        getChartData: async (clientId: string) => {
            await delay(1000);
            let processedData = DEFAULT_CHART_DATA.map(d => ({
                ...d,
                google_spend: d.google,
                meta_spend: d.meta,
                total_spend: d.spend,
                google_revenue: d.revenue * 0.6,
                meta_revenue: d.revenue * 0.4,
                total_revenue: d.revenue
            }));

            if (clientId === '1') {
                processedData = processedData.map(d => ({
                    ...d,
                    total_revenue: d.total_revenue * 1.2,
                    google_spend: d.google_spend * 1.1,
                    meta_spend: d.meta_spend * 1.1,
                    google_revenue: d.google_revenue * 1.2,
                    meta_revenue: d.meta_revenue * 1.2
                }));
            } else if (clientId === '2') {
                processedData = processedData.map(d => ({
                    ...d,
                    total_revenue: d.total_revenue * 0.1,
                    google_spend: d.google_spend * 0.1,
                    meta_spend: d.meta_spend * 0.1,
                    google_revenue: d.google_revenue * 0.1,
                    meta_revenue: d.meta_revenue * 0.1
                }));
            }
            return processedData;
        },
        getFunnelData: async () => {
            await delay(1200);
            return COMPARATIVE_FUNNEL_DATA;
        },
        getDeviceData: async () => {
            await delay(1000);
            return DEVICE_DATA;
        }
    },
    automation: {
        getWorkflows: async () => {
            await delay(800);
            return INITIAL_WORKFLOWS;
        },
        getTemplates: async () => {
            await delay(500);
            return WORKFLOW_TEMPLATES;
        },
        saveWorkflow: async (workflow: Workflow) => {
            await delay(1000);
            const index = INITIAL_WORKFLOWS.findIndex(w => w.id === workflow.id);
            if (index >= 0) {
                INITIAL_WORKFLOWS[index] = workflow;
            } else {
                INITIAL_WORKFLOWS = [workflow, ...INITIAL_WORKFLOWS];
            }
            return workflow;
        },
        toggleStatus: async (id: number) => {
            await delay(500);
            const index = INITIAL_WORKFLOWS.findIndex(w => w.id === id);
            if (index >= 0) {
                const newStatus = INITIAL_WORKFLOWS[index].status === 'active' ? 'paused' : 'active';
                INITIAL_WORKFLOWS[index] = { ...INITIAL_WORKFLOWS[index], status: newStatus as 'active' | 'paused' };
                return INITIAL_WORKFLOWS[index];
            }
            throw new Error('Workflow not found');
        }
    },
    campaigns: {
        getCampaigns: async (clientId: string) => {
            await delay(800);
            switch (clientId) {
                case '1': // TechCorp (B2B / Enterprise)
                    return [
                        { id: '101', name: 'SaaS Enterprise - Search Brand', platform: 'google', status: 'active', budget: 45000, spent: 12500, ctr: 5.2, roas: 4.8, conversions: 120 },
                        { id: '102', name: 'Lead Gen - LinkedIn/Meta', platform: 'meta', status: 'active', budget: 30000, spent: 15000, ctr: 1.1, roas: 3.2, conversions: 45 },
                        { id: '103', name: 'Competidores - Search', platform: 'google', status: 'active', budget: 15000, spent: 8000, ctr: 2.5, roas: 2.1, conversions: 18 },
                        { id: '104', name: 'Webinar Q3 - Remarketing', platform: 'meta', status: 'paused', budget: 5000, spent: 4800, ctr: 0.9, roas: 1.5, conversions: 12 },
                        { id: '105', name: 'Youtube - Awareness', platform: 'google', status: 'learning', budget: 20000, spent: 2000, ctr: 0.5, roas: 1.1, conversions: 5 },
                        { id: '106', name: 'Display - Retargeting', platform: 'google', status: 'active', budget: 8000, spent: 3000, ctr: 0.8, roas: 3.5, conversions: 30 },
                    ];
                case '2': // Padaria (Local / B2C)
                    return [
                        { id: '201', name: 'Promoção Café da Manhã - Raio 2km', platform: 'meta', status: 'active', budget: 800, spent: 250, ctr: 4.8, roas: 8.5, conversions: 150 },
                        { id: '202', name: 'Delivery iFood - Search', platform: 'google', status: 'active', budget: 1200, spent: 600, ctr: 6.2, roas: 5.1, conversions: 80 },
                        { id: '203', name: 'Instagram Reels - Pães Artesanais', platform: 'meta', status: 'learning', budget: 500, spent: 100, ctr: 2.1, roas: 1.2, conversions: 5 },
                    ];
                case '3': // Consultoria (Serviços)
                    return [
                        { id: '301', name: 'Consultoria Financeira - Search', platform: 'google', status: 'active', budget: 5000, spent: 2500, ctr: 3.1, roas: 4.2, conversions: 25 },
                        { id: '302', name: 'Ebook Grátis - Leads', platform: 'meta', status: 'active', budget: 3000, spent: 2800, ctr: 1.5, roas: 2.8, conversions: 110 },
                        { id: '303', name: 'Vídeo Depoimentos', platform: 'meta', status: 'paused', budget: 1500, spent: 200, ctr: 0.8, roas: 1.0, conversions: 2 },
                        { id: '304', name: 'Agendamento - Google Maps', platform: 'google', status: 'active', budget: 1000, spent: 400, ctr: 4.5, roas: 6.5, conversions: 15 },
                    ];
                default: // Visão Global (Mistura)
                    return [
                        { id: '001', name: 'Campanha Institucional Global', platform: 'google', status: 'active', budget: 100000, spent: 45000, ctr: 2.0, roas: 3.0, conversions: 500 }
                    ];
            }
        }
    }
};

