
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
  HELP_CENTER = 'HELP_CENTER',
  PROJECTS = 'PROJECTS',
  ASSETS = 'ASSETS',
  APPROVALS = 'APPROVALS',
  SERVICE_CATALOG = 'SERVICE_CATALOG',
  PROCESSES = 'PROCESSES',
  MARKET_ANALYSIS = 'MARKET_ANALYSIS'
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

// SOP Template Types
export interface SOPTemplateItem {
  id?: number;
  template_id?: number;
  title: string;
  description: string;
  duration_days: number;
  order_index: number;
}

export interface SOPTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  items?: SOPTemplateItem[];
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

// PROJECTS
export interface Project {
  id: number;
  tenant_id?: number;
  client_id?: number;
  owner_id?: number;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  end_date?: string;
  budget?: number; // Total Budget
  settings?: any;
  created_at?: string;
  updated_at?: string;

  // --- NEW FIELDS (027) ---
  // Objectives
  marketing_objectives?: string; // SMART Goals
  target_audience?: string; // Personas
  value_proposition?: string;
  brand_positioning?: string;

  // Planning
  marketing_channels?: { channel: string; allocation: number }[]; // JSONB
  timeline_activities?: string;
  dependencies?: string;
  key_milestones?: { title: string; date: string; status: string }[]; // JSONB

  // Resources
  team_structure?: { role: string; count: number; skills: string[] }[]; // JSONB
  tools_platforms?: string;
  external_suppliers?: string;
  creative_assets?: string; // High level description of needs

  // Metrics
  kpis?: string;
  goals?: string;
  analysis_tools?: string;
  reporting_frequency?: string;

  // Budget Detailed
  budget_media?: number;
  budget_production?: number;
  budget_contingency?: number;
  budget_breakdown?: Record<string, number>; // JSONB

  // Risks
  risks?: string;
  mitigation_plan?: string;

  // Approvals
  approval_status?: 'pending' | 'approved' | 'rejected' | 'revision';
  creative_brief_link?: string;
  assets_link?: string;

  // Enriched fields
  client_name?: string;
  owner_name?: string;
}

export interface ProjectMember {
  project_id: number;
  user_id: number;
  role: 'member' | 'manager' | 'viewer';
  joined_at?: string;
}

// TASKS
export interface Task {
  id: number;
  tenant_id?: number;
  project_id?: number;
  parent_task_id?: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id?: number;
  reporter_id?: number;
  due_date?: string;
  start_date?: string;
  completed_at?: string;
  estimated_minutes?: number;
  logged_minutes?: number;
  tags?: string[];
  column_order?: number;
  metadata?: any;
  created_at?: string;
  updated_at?: string;

  // --- NEW FIELDS (026 & 028) ---
  workspace?: string;
  channel?: string;
  stage?: string; // Internal pipeline stage
  stage_due_date?: string;
  effort_time?: string; // e.g., "2h", "4h"
  origin?: string;
  squad?: string;
  task_type?: string;
  campaign_plan?: string;
  project_manager_id?: number;

  // Detailed (028)
  reference_code?: string;
  collaborators_ids?: number[];
  approvers_ids?: number[];
  stakeholders_ids?: number[];
  percent_complete?: number;
  checklist?: { id: string; text: string; completed: boolean }[];
  deliverable_format?: string;
  technical_specs?: string;
  brand_guidelines?: string;
  dependency_ids?: number[];
  blockers?: string;
  briefing_link?: string;
  visual_references?: string;
  support_materials?: string;
  final_delivery_link?: string;
  performance_metrics?: Record<string, any>;
  feedback?: string;

  // Enriched
  assignee_name?: string;
  assignee_avatar?: string;
  project_name?: string;
}
