import axios from 'axios';
import { api as mockApi } from './mockApi';
import { Campaign, Workflow, WorkflowTemplate, Metric } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Garantir que a URL da API termine com /api
if (API_URL && !API_URL.endsWith('/api')) {
    API_URL += '/api';
}

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para adicionar token de autenticação (futuro)
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const apiClient = {
    dashboard: {
        getKPIs: async (clientId: string, platform: string): Promise<Metric[]> => {
            if (USE_MOCK) return mockApi.dashboard.getKPIs(clientId, platform);
            const response = await axiosInstance.get(`/dashboard/kpis?client_id=${clientId}&platform=${platform}`);
            return response.data;
        },
        getChartData: async (clientId: string) => {
            if (USE_MOCK) return mockApi.dashboard.getChartData(clientId);
            const response = await axiosInstance.get(`/dashboard/chart-data?client_id=${clientId}`);
            return response.data;
        },
        getFunnelData: async () => {
            if (USE_MOCK) return mockApi.dashboard.getFunnelData();
            const response = await axiosInstance.get(`/dashboard/funnel-data`);
            return response.data;
        },
        getDeviceData: async () => {
            if (USE_MOCK) return mockApi.dashboard.getDeviceData();
            const response = await axiosInstance.get(`/dashboard/device-data`);
            return response.data;
        }
    },
    automation: {
        getWorkflows: async (): Promise<Workflow[]> => {
            if (USE_MOCK) return mockApi.automation.getWorkflows();
            const response = await axiosInstance.get('/workflows');
            return response.data;
        },
        getTemplates: async (): Promise<WorkflowTemplate[]> => {
            if (USE_MOCK) return mockApi.automation.getTemplates();
            const response = await axiosInstance.get('/workflow-templates');
            return response.data;
        },
        saveWorkflow: async (workflow: Workflow): Promise<Workflow> => {
            if (USE_MOCK) return mockApi.automation.saveWorkflow(workflow);
            const response = await axiosInstance.post('/workflows', workflow);
            return response.data;
        },
        toggleStatus: async (id: number): Promise<Workflow> => {
            if (USE_MOCK) return mockApi.automation.toggleStatus(id);
            const response = await axiosInstance.patch(`/workflows/${id}/toggle`);
            return response.data;
        }
    },
    campaigns: {
        getCampaigns: async (clientId: string): Promise<Campaign[]> => {
            if (USE_MOCK) return mockApi.campaigns.getCampaigns(clientId) as Promise<Campaign[]>;
            const response = await axiosInstance.get(`/campaigns?client_id=${clientId}`);
            return response.data;
        }
    },
    auth: {
        login: async (email: string, password: string) => {
            console.log(`[Auth] Tentando login para ${email}. Modo Mock: ${USE_MOCK}`);

            if (USE_MOCK) {
                // Simulação de login
                if ((email === 'admin@elite.com' || email === 'denismay@arsdatascience.com.br') && password === 'admin') {
                    console.log('[Auth] Login Mock sucesso');
                    return {
                        user: {
                            id: 1,
                            name: email.includes('denis') ? 'Denis May' : 'Admin',
                            email,
                            role: 'admin',
                            avatar_url: 'https://github.com/shadcn.png'
                        },
                        token: 'mock-jwt-token'
                    };
                }
                console.error('[Auth] Login Mock falhou: credenciais inválidas');
                throw new Error('Credenciais inválidas');
            }

            try {
                console.log(`[Auth] Enviando request para ${axiosInstance.getUri()}/auth/login`);
                const response = await axiosInstance.post('/auth/login', { email, password });
                console.log('[Auth] Login Backend sucesso:', response.data);
                return response.data;
            } catch (error: any) {
                console.error('[Auth] Login Backend erro:', error.response?.data || error.message);
                throw error;
            }
        },
        register: async (name: string, email: string, password: string) => {
            if (USE_MOCK) {
                // Simulação de registro
                return {
                    user: { id: Date.now(), name, email, role: 'user', avatar_url: '' },
                    token: 'mock-jwt-token-register'
                };
            }
            const response = await axiosInstance.post('/auth/register', { name, email, password });
            return response.data;
        }
    },
    clients: {
        getClients: async () => {
            if (USE_MOCK) return mockApi.clients.getClients();
            const response = await axiosInstance.get('/clients');
            return response.data;
        },
        createClient: async (client: any) => {
            if (USE_MOCK) return mockApi.clients.createClient(client);
            const response = await axiosInstance.post('/clients', client);
            return response.data;
        },
        updateClient: async (id: number, client: any) => {
            if (USE_MOCK) return mockApi.clients.updateClient(id, client);
            const response = await axiosInstance.put(`/clients/${id}`, client);
            return response.data;
        },
        deleteClient: async (id: number) => {
            if (USE_MOCK) return mockApi.clients.deleteClient(id);
            const response = await axiosInstance.delete(`/clients/${id}`);
            return response.data;
        }
    }
};
