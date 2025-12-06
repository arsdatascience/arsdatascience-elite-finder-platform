import axios from 'axios';
import { Campaign, Workflow, WorkflowTemplate, Metric, Lead } from '../types';

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
            const response = await axiosInstance.get('/team');
            return response.data;
        },
        createTeamMember: async (member: any) => {
            const response = await axiosInstance.post('/team', member);
            return response.data;
        },
        updateTeamMember: async (id: number, member: any) => {
            const response = await axiosInstance.put(`/team/${id}`, member);
            return response.data;
        },
        deleteTeamMember: async (id: number) => {
            const response = await axiosInstance.delete(`/team/${id}`);
            return response.data;
        }
    },

    dashboard: {
        getKPIs: async (clientId: string, platform: string, startDate?: string, endDate?: string): Promise<Metric[]> => {
            const response = await axiosInstance.get(`/dashboard/kpis?client=${clientId}&platform=${platform}&startDate=${startDate || ''}&endDate=${endDate || ''}`);
            return response.data;
        },
        getChartData: async (clientId: string, startDate?: string, endDate?: string) => {
            const response = await axiosInstance.get(`/dashboard/chart-data?client=${clientId}&startDate=${startDate || ''}&endDate=${endDate || ''}`);
            return response.data;
        },
        getFunnelData: async (clientId: string, startDate?: string, endDate?: string) => {
            const response = await axiosInstance.get(`/dashboard/funnel-data?client=${clientId}&startDate=${startDate || ''}&endDate=${endDate || ''}`);
            return response.data;
        },
        getDeviceData: async (clientId: string, startDate?: string, endDate?: string) => {
            const response = await axiosInstance.get(`/dashboard/device-data?client=${clientId}&startDate=${startDate || ''}&endDate=${endDate || ''}`);
            return response.data;
        },
        getConversionSources: async (clientId: string, startDate?: string, endDate?: string) => {
            const response = await axiosInstance.get(`/dashboard/conversion-sources?client=${clientId}&startDate=${startDate || ''}&endDate=${endDate || ''}`);
            return response.data;
        },
        getDashboardInsights: async (kpis: any[], selectedClient: string, platform: string, dateRange: any) => {
            const response = await axiosInstance.post('/ai/dashboard-insights', { kpis, selectedClient, platform, dateRange });
            return response.data;
        }
    },
    automation: {
        getWorkflows: async (): Promise<Workflow[]> => {
            const response = await axiosInstance.get('/workflows');
            return response.data;
        },
        getTemplates: async (): Promise<WorkflowTemplate[]> => {
            const response = await axiosInstance.get('/workflow-templates');
            return response.data;
        },
        saveWorkflow: async (workflow: Workflow): Promise<Workflow> => {
            const response = await axiosInstance.post('/workflows', workflow);
            return response.data;
        },
        toggleStatus: async (id: number): Promise<Workflow> => {
            const response = await axiosInstance.patch(`/workflows/${id}/toggle`);
            return response.data;
        }
    },
    campaigns: {
        getCampaigns: async (clientId: string): Promise<Campaign[]> => {
            const response = await axiosInstance.get(`/campaigns?client_id=${clientId}`);
            return response.data;
        },
        getCampaignAnalytics: async (clientId: string, startDate?: string, endDate?: string, platforms?: string) => {
            const queryParams = new URLSearchParams();
            if (clientId) queryParams.append('clientId', clientId);
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            if (platforms) queryParams.append('platforms', platforms);

            const response = await axiosInstance.get(`/campaigns/analytics?${queryParams.toString()}`);
            return response.data;
        },
        exportPdf: async (clientId?: string) => {
            const url = clientId && clientId !== 'all' ? `/export/campaigns/pdf?client_id=${clientId}` : '/export/campaigns/pdf';
            const response = await axiosInstance.get(url, { responseType: 'blob' });
            return response.data;
        },
        exportExcel: async (clientId?: string) => {
            const url = clientId && clientId !== 'all' ? `/export/campaigns/excel?client_id=${clientId}` : '/export/campaigns/excel';
            const response = await axiosInstance.get(url, { responseType: 'blob' });
            return response.data;
        }
    },
    auth: {
        login: async (email: string, password: string) => {
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
            const response = await axiosInstance.post('/auth/register', { name, email, password });
            return response.data;
        },
        forgotPassword: async (email: string) => {
            const response = await axiosInstance.post('/auth/forgot-password', { email });
            return response.data;
        },
        resetPassword: async (token: string, newPassword: string) => {
            const response = await axiosInstance.post('/auth/reset-password', { token, newPassword });
            return response.data;
        }
    },

    clients: {
        getClients: async () => {
            const response = await axiosInstance.get('/clients');
            return response.data;
        },
        createClient: async (client: any) => {
            const response = await axiosInstance.post('/clients', client);
            return response.data;
        },
        updateClient: async (id: number, client: any) => {
            const response = await axiosInstance.put(`/clients/${id}`, client);
            return response.data;
        },
        deleteClient: async (id: number) => {
            const response = await axiosInstance.delete(`/clients/${id}`);
            return response.data;
        },
        exportExcel: async () => {
            const response = await axiosInstance.get('/export/clients/excel', { responseType: 'blob' });
            return response.data;
        }
    },
    leads: {
        getLeads: async (clientId?: string): Promise<Lead[]> => {
            const url = clientId && clientId !== 'all' ? `/leads?client_id=${clientId}` : '/leads';
            const response = await axiosInstance.get(url);
            return response.data;
        },
        createLead: async (lead: any) => {
            const response = await axiosInstance.post('/leads', lead);
            return response.data;
        },
        updateLead: async (id: string, lead: any) => {
            const response = await axiosInstance.put(`/leads/${id}`, lead);
            return response.data;
        },
        updateLeadStatus: async (id: string, status: string) => {
            const response = await axiosInstance.patch(`/leads/${id}/status`, { status });
            return response.data;
        },
        exportPdf: async (clientId?: string) => {
            const url = clientId && clientId !== 'all' ? `/export/leads/pdf?client_id=${clientId}` : '/export/leads/pdf';
            const response = await axiosInstance.get(url, { responseType: 'blob' });
            return response.data;
        },
        exportExcel: async (clientId?: string) => {
            const url = clientId && clientId !== 'all' ? `/export/leads/excel?client_id=${clientId}` : '/export/leads/excel';
            const response = await axiosInstance.get(url, { responseType: 'blob' });
            return response.data;
        }
    },
    social: {
        getPosts: async (clientId?: string) => {
            const url = clientId && clientId !== 'all' ? `/social/posts?client=${clientId}` : '/social/posts';
            const response = await axiosInstance.get(url);
            return response.data;
        },
        createPost: async (post: any) => {
            const response = await axiosInstance.post('/social/posts', post);
            return response.data;
        },
        updatePost: async (id: string, data: any) => {
            const response = await axiosInstance.put(`/social/posts/${id}`, data);
            return response.data;
        },
        deletePost: async (id: string) => {
            const response = await axiosInstance.delete(`/social/posts/${id}`);
            return response.data;
        },
        getHolidays: async () => {
            const response = await axiosInstance.get('/social/holidays');
            return response.data;
        }
    },
    ai: {
        generateMarketingContent: async (data: any) => {
            const response = await axiosInstance.post('/ai/generate', data);
            return response.data;
        }
    },
    promptTemplates: {
        create: async (data: any) => {
            const response = await axiosInstance.post('/templates', data);
            return response.data;
        },
        list: async () => {
            const response = await axiosInstance.get('/templates');
            return response.data;
        },
        delete: async (id: number) => {
            await axiosInstance.delete(`/templates/${id}`);
        }
    },
    // --- PROJECTS ---
    projects: {
        list: async (params?: any) => {
            const response = await axiosInstance.get('/projects', { params });
            return response.data;
        },
        create: async (data: any) => {
            const response = await axiosInstance.post('/projects', data);
            return response.data;
        },
        get: async (id: number) => {
            const response = await axiosInstance.get(`/projects/${id}`);
            return response.data;
        },
        update: async (id: number, data: any) => {
            const response = await axiosInstance.put(`/projects/${id}`, data);
            return response.data;
        },
        delete: async (id: number) => {
            const response = await axiosInstance.delete(`/projects/${id}`);
            return response.data;
        }
    },

    // --- TASKS ---
    tasks: {
        list: async (params?: any) => {
            const response = await axiosInstance.get('/tasks', { params });
            return response.data;
        },
        create: async (data: any) => {
            const response = await axiosInstance.post('/tasks', data);
            return response.data;
        },
        update: async (id: number, data: any) => {
            const response = await axiosInstance.put(`/tasks/${id}`, data);
            return response.data;
        },
        delete: async (id: number) => {
            const response = await axiosInstance.delete(`/tasks/${id}`);
            return response.data;
        },
        reorder: async (tasks: any[]) => {
            const response = await axiosInstance.post('/tasks/reorder', { tasks });
            return response.data;
        }
    },

    imageGeneration: {
        generate: async (data: any) => {
            const response = await axiosInstance.post('/images/generate', data);
            return response.data;
        },
        list: async (limit = 20, page = 1) => {
            const response = await axiosInstance.get('/images', { params: { limit, page } });
            return response.data;
        },
        delete: async (id: string) => {
            await axiosInstance.delete(`/images/${id}`);
        },
        getModels: async () => {
            const response = await axiosInstance.get('/images/models');
            return response.data;
        },
        edit: async (data: any) => {
            const response = await axiosInstance.post('/images/edit', data);
            return response.data;
        },
        createVariations: async (id: string, count: number = 4) => {
            const response = await axiosInstance.post(`/images/${id}/variations`, { count });
            return response.data; // Retorna { success: true, data: GeneratedImage[] }
        },
        upscale: async (data: { imageUrl: string, scale: number }) => {
            const response = await axiosInstance.post('/images/upscale', data);
            return response.data;
        },
        removeBackground: async (imageUrl: string) => {
            const response = await axiosInstance.post('/images/remove-background', { imageUrl });
            return response.data;
        },
        getRecentPrompts: async () => {
            const response = await axiosInstance.get('/images/prompts');
            return response.data;
        },
        getAnalytics: async (model?: string) => {
            const response = await axiosInstance.get('/images/analytics', { params: { model } });
            return response.data;
        },
        translate: async (text: string, targetLang: 'pt' | 'en') => {
            const response = await axiosInstance.post('/images/translate', { text, targetLang });
            return response.data;
        }
    },

    // --- ASSETS (Digital Library) ---
    assets: {
        list: async (params?: { folder_id?: number | null, search?: string }) => {
            const response = await axiosInstance.get('/assets', { params });
            return response.data;
        },
        listFolders: async (params?: { parent_id?: number | null, client_id?: number, project_id?: number }) => {
            const response = await axiosInstance.get('/folders', { params });
            return response.data;
        },
        createFolder: async (data: { name: string, parent_id?: number | null, client_id?: number, project_id?: number, color?: string }) => {
            const response = await axiosInstance.post('/folders', data);
            return response.data;
        },
        deleteFolder: async (id: number) => {
            const response = await axiosInstance.delete(`/folders/${id}`);
            return response.data;
        },
        upload: async (formData: FormData) => {
            const response = await axiosInstance.post('/assets', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        },
        deleteAsset: async (id: number) => {
            const response = await axiosInstance.delete(`/assets/${id}`);
            return response.data;
        }
    },

    // --- APPROVALS ---
    approvals: {
        list: async (type: 'pending' | 'history' | 'sent' = 'pending') => {
            const response = await axiosInstance.get('/approvals', { params: { type } });
            return response.data;
        },
        create: async (data: { title: string, notes?: string, asset_id?: number, social_post_id?: number }) => {
            const response = await axiosInstance.post('/approvals', data);
            return response.data;
        },
        review: async (id: number, status: 'approved' | 'rejected' | 'changes_requested', comments?: string) => {
            const response = await axiosInstance.put(`/approvals/${id}/review`, { status, comments });
            return response.data;
        },
        // Public methods
        getPublicData: async (token: string) => {
            const response = await axiosInstance.get(`/public/approvals/${token}`);
            return response.data;
        },
        publicReview: async (token: string, status: string, comments?: string) => {
            const response = await axiosInstance.post(`/public/approvals/${token}/review`, { status, comments });
            return response.data;
        }
    }
    ,

    // --- SERVICE CATALOG ---
    services: {
        list: async () => {
            const response = await axiosInstance.get('/services');
            return response.data;
        },
        create: async (data: any) => {
            const response = await axiosInstance.post('/services', data);
            return response.data;
        },
        update: async (id: number, data: any) => {
            const response = await axiosInstance.put(`/services/${id}`, data);
            return response.data;
        },
        delete: async (id: number) => {
            const response = await axiosInstance.delete(`/services/${id}`);
            return response.data;
        }
    },

    // --- SOP TEMPLATES ---
    templates: {
        list: async () => {
            const response = await axiosInstance.get('/templates');
            return response.data;
        },
        create: async (data: any) => {
            const response = await axiosInstance.post('/templates', data);
            return response.data;
        },
        get: async (id: number) => {
            const response = await axiosInstance.get(`/templates/${id}`);
            return response.data;
        },
        update: async (id: number, data: any) => {
            const response = await axiosInstance.put(`/templates/${id}`, data);
            return response.data;
        },
        delete: async (id: number) => {
            const response = await axiosInstance.delete(`/templates/${id}`);
            return response.data;
        },
        applyToProject: async (projectId: number, templateId: number) => {
            const response = await axiosInstance.post(`/projects/${projectId}/apply-template`, { templateId });
            return response.data;
        }
    }
};
