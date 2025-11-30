import axios from 'axios';
import { api as mockApi } from './mockApi';
import { Campaign, Workflow, WorkflowTemplate, Metric } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
let API_URL = import.meta.env.VITE_API_URL || 'https://elite-finder.up.railway.app/api';

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
    users: {
        getTeamMembers: async () => {
            if (USE_MOCK) return [];
            const response = await axiosInstance.get('/team');
            return response.data;
        },
        createTeamMember: async (member: any) => {
            if (USE_MOCK) return member;
            const response = await axiosInstance.post('/team', member);
            return response.data;
        },
        updateTeamMember: async (id: number, member: any) => {
            if (USE_MOCK) return member;
            const response = await axiosInstance.put(`/team/${id}`, member);
            return response.data;
        },
        deleteTeamMember: async (id: number) => {
            if (USE_MOCK) return { success: true };
            const response = await axiosInstance.delete(`/team/${id}`);
            return response.data;
        }
    },

    dashboard: {
        getKPIs: async (clientId: string, platform: string, startDate?: string, endDate?: string): Promise<Metric[]> => {
            if (USE_MOCK) return mockApi.dashboard.getKPIs(clientId, platform);
            const response = await axiosInstance.get(`/dashboard/kpis?client=${clientId}&platform=${platform}&startDate=${startDate || ''}&endDate=${endDate || ''}`);
            return response.data;
        },
        getChartData: async (clientId: string, startDate?: string, endDate?: string) => {
            if (USE_MOCK) return mockApi.dashboard.getChartData(clientId);
            const response = await axiosInstance.get(`/dashboard/chart-data?client=${clientId}&startDate=${startDate || ''}&endDate=${endDate || ''}`);
            return response.data;
        },
        getFunnelData: async (clientId: string, startDate?: string, endDate?: string) => {
            if (USE_MOCK) return mockApi.dashboard.getFunnelData();
            const response = await axiosInstance.get(`/dashboard/funnel-data?client=${clientId}&startDate=${startDate || ''}&endDate=${endDate || ''}`);
            return response.data;
        },
        getDeviceData: async (clientId: string, startDate?: string, endDate?: string) => {
            if (USE_MOCK) return mockApi.dashboard.getDeviceData();
            const response = await axiosInstance.get(`/dashboard/device-data?client=${clientId}&startDate=${startDate || ''}&endDate=${endDate || ''}`);
            return response.data;
        },
        getConversionSources: async (clientId: string, startDate?: string, endDate?: string) => {
            if (USE_MOCK) return [
                { label: 'Google Ads', val: 45, color: 'bg-blue-500' },
                { label: 'Meta Ads', val: 32, color: 'bg-purple-500' },
                { label: 'Busca Orgânica', val: 15, color: 'bg-green-500' },
                { label: 'Direto/Indicação', val: 8, color: 'bg-yellow-500' }
            ];
            const response = await axiosInstance.get(`/dashboard/conversion-sources?client=${clientId}&startDate=${startDate || ''}&endDate=${endDate || ''}`);
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
        },
        forgotPassword: async (email: string) => {
            if (USE_MOCK) return { success: true, message: 'Mock: Instruções enviadas.' };
            const response = await axiosInstance.post('/auth/forgot-password', { email });
            return response.data;
        },
        resetPassword: async (token: string, newPassword: string) => {
            if (USE_MOCK) return { success: true, message: 'Mock: Senha alterada.' };
            const response = await axiosInstance.post('/auth/reset-password', { token, newPassword });
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
    },
    social: {
        getPosts: async (clientId?: string) => {
            if (USE_MOCK) return [];
            const url = clientId && clientId !== 'all' ? `/social/posts?client=${clientId}` : '/social/posts';
            const response = await axiosInstance.get(url);
            return response.data;
        },
        createPost: async (post: any) => {
            if (USE_MOCK) return post;
            const response = await axiosInstance.post('/social/posts', post);
            return response.data;
        },
        updatePost: async (id: string, data: any) => {
            if (USE_MOCK) return { ...data, id };
            const response = await axiosInstance.put(`/social/posts/${id}`, data);
            return response.data;
        },
        deletePost: async (id: string) => {
            if (USE_MOCK) return { success: true };
            const response = await axiosInstance.delete(`/social/posts/${id}`);
            return response.data;
        }
    },
    imageGeneration: {
        generate: async (data: any) => {
            if (USE_MOCK) throw new Error('Mock not implemented for Image Gen');
            const response = await axiosInstance.post('/images/generate', data);
            return response.data;
        },
        list: async (limit = 20, page = 1) => {
            if (USE_MOCK) return { images: [], total: 0 };
            const response = await axiosInstance.get('/images', { params: { limit, page } });
            return response.data;
        },
        delete: async (id: string) => {
            if (USE_MOCK) return;
            await axiosInstance.delete(`/images/${id}`);
        },
        getModels: async () => {
            if (USE_MOCK) return [];
            const response = await axiosInstance.get('/images/models');
            return response.data;
        },
        edit: async (data: any) => {
            if (USE_MOCK) throw new Error('Mock not implemented');
            const response = await axiosInstance.post('/images/edit', data);
            return response.data;
        },
        createVariations: async (id: string, count: number = 4) => {
            if (USE_MOCK) throw new Error('Mock not implemented');
            const response = await axiosInstance.post(`/images/${id}/variations`, { count });
            return response.data; // Retorna { success: true, data: GeneratedImage[] }
        },
        upscale: async (data: { imageUrl: string, scale: number }) => {
            if (USE_MOCK) throw new Error('Mock not implemented');
            const response = await axiosInstance.post('/images/upscale', data);
            return response.data;
        },
        removeBackground: async (imageUrl: string) => {
            if (USE_MOCK) throw new Error('Mock not implemented');
            const response = await axiosInstance.post('/images/remove-background', { imageUrl });
            return response.data;
        },
        getRecentPrompts: async () => {
            if (USE_MOCK) return [];
            const response = await axiosInstance.get('/images/prompts');
            return response.data;
        },
        getAnalytics: async (model?: string) => {
            if (USE_MOCK) return { success: true, data: { totalImages: 0, imagesByModel: [], activity: [], totalCredits: 0, recentImages: [] } };
            const response = await axiosInstance.get('/images/analytics', { params: { model } });
            return response.data;
        },
        translate: async (text: string, targetLang: 'pt' | 'en') => {
            if (USE_MOCK) return { translatedText: text };
            const response = await axiosInstance.post('/images/translate', { text, targetLang });
            return response.data;
        }
    }
};
