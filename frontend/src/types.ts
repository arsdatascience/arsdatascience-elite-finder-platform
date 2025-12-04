
// Domain Types

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CAMPAIGNS = 'CAMPAIGNS',
  FLIGHT_CONTROL = 'FLIGHT_CONTROL',
  CHAT_AI = 'CHAT_AI',
  CLIENTS = 'CLIENTS',
  SOCIAL = 'SOCIAL',
  AUTOMATION = 'AUTOMATION',
  TRAINING = 'TRAINING',
  AI_AGENT = 'AI_AGENT',
  ELITE_ASSISTANT = 'ELITE_ASSISTANT',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS',
  SOCIAL_CALENDAR = 'SOCIAL_CALENDAR',
  SOCIAL_INTEGRATIONS = 'SOCIAL_INTEGRATIONS',
  AGENT_BUILDER = 'AGENT_BUILDER',
  ADMIN = 'ADMIN',
  HOME = 'HOME',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  AUDIO_ANALYSIS = 'AUDIO_ANALYSIS',
  FINANCIAL_MODULE = 'FINANCIAL_MODULE',
  CREATIVE_STUDIO = 'CREATIVE_STUDIO',
  SALES_COACHING = 'SALES_COACHING',
  HELP_CENTER = 'HELP_CENTER'
}

export enum LeadStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  WAITING = 'waiting',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost'
}

export interface Metric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface Campaign {
  id: string;
  name: string;
  platform: 'google' | 'meta' | 'tiktok';
  status: 'active' | 'paused' | 'learning';
  budget: number;
  spent: number;
  ctr: number;
  roas: number;
  conversions: number;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  productInterest?: string;
  status: LeadStatus;
  value: number;
  lastContact: string;
  tags?: string[];
  assignedTo: string;
  notes?: string;
  clientId?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'client' | 'user';
  text: string;
  timestamp: string;
}

export interface AnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: 'high' | 'medium' | 'low';
  summary: string;
  positivePoints: string[];
  suggestions: string[];
  warnings: string[];
}

// Content Generation Types
export interface ContentRequest {
  type: 'ad' | 'post' | 'reels' | 'stories' | 'carousel' | 'poll' | 'article';
  platform: 'google' | 'meta' | 'instagram' | 'linkedin' | 'blog' | 'site';
  topic: string;
  tone: 'professional' | 'persuasive' | 'urgent' | 'friendly';
  provider?: 'gemini' | 'openai';
  model?: string;
}

export interface ContentResult {
  headlines: string[];
  body: string;
  cta: string;
  hashtags: string[];
  imageIdea: string;
}

export interface WorkflowStep {
  id: string;
  type: 'wait' | 'email' | 'whatsapp' | 'notification' | 'sms' | 'tag' | 'owner' | 'webhook' | 'trigger' | 'condition' | 'crm' | 'slack' | 'ai_generate' | 'trigger_form' | 'trigger_tag' | 'trigger_pipeline' | 'trigger_schedule' | 'trigger_api' | 'trigger_manual';
  value: string;
}

export interface Workflow {
  id: number;
  name: string;
  status: 'active' | 'paused';
  triggers: string;
  steps: number;
  enrolled: number;
  conversion: string;
  stepsList?: WorkflowStep[];
  flowData?: {
    nodes: any[];
    edges: any[];
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: string;
  steps: Omit<WorkflowStep, 'id'>[];
  iconType: 'user-plus' | 'clock' | 'zap' | 'git-branch' | 'message-square' | 'alert-circle' | 'shopping-cart' | 'calendar';
}

// Image Generation Types
export interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  width: number;
  height: number;
  createdAt: string;
  userId?: string;
}

export interface ImageModel {
  id: string;
  name: string;
  description: string;
  speed: 'ultra-fast' | 'fast' | 'medium' | 'slow';
  quality: 'good' | 'great' | 'excellent';
  free: boolean;
}

export interface GenerateImageRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  model?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  num_outputs?: number;
}

export interface GenerateImageResponse {
  success: boolean;
  data: GeneratedImage | GeneratedImage[];
}
