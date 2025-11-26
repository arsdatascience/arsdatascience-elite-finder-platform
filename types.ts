
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
  SETTINGS = 'SETTINGS'
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

export enum LeadStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING = 'WAITING',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST'
}

export interface Lead {
  id: string;
  name: string;
  source: 'Google Ads' | 'Instagram' | 'Organic';
  productInterest: string;
  status: LeadStatus;
  value: number;
  lastContact: string;
  tags: string[];
  assignedTo: string;
}

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'client';
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
  aiEngine?: 'gemini' | 'openai';
}

export interface ContentResult {
  headlines: string[];
  body: string;
  cta: string;
  hashtags: string[];
  imageIdea: string;
}