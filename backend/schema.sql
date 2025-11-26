-- ============================================
-- ELITE FINDER - COMPLETE DATABASE SCHEMA
-- ============================================
-- This schema replaces all mock data with real database tables

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE, -- Admin, User, Guest, Editor, Viewer
  description TEXT
);

INSERT INTO roles (name, description) VALUES
  ('Admin', 'Possui controle total sobre o sistema.'),
  ('User', 'Acesso limitado às funcionalidades relevantes.'),
  ('Guest', 'Acesso mínimo ou apenas de leitura.'),
  ('Editor', 'Pode criar, modificar e publicar conteúdo.'),
  ('Viewer', 'Acesso de leitura a áreas específicas.')
ON CONFLICT (name) DO NOTHING;

-- Modify users to include role_id
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role_id') THEN
    ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id) DEFAULT 2;
  END IF;
END $$;


-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- 'premium', 'standard', 'basic'
  email VARCHAR(255),
  phone VARCHAR(50),
  city VARCHAR(100),
  company_size VARCHAR(50),
  industry VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CAMPAIGNS (Google Ads, Meta Ads)
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50), -- 'google', 'meta', 'linkedin'
  status VARCHAR(50), -- 'active', 'paused', 'learning', 'ended'
  budget DECIMAL(10,2),
  spent DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(5,2), -- Click-through rate
  roas DECIMAL(5,2), -- Return on ad spend
  conversions INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- LEADS
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  source VARCHAR(100), -- 'Google Ads', 'Instagram', 'Organic', etc.
  product_interest VARCHAR(255),
  value DECIMAL(10,2),
  status VARCHAR(50), -- 'new', 'in_progress', 'waiting', 'closed_won', 'closed_lost'
  assigned_to VARCHAR(100),
  tags TEXT[], -- Array of tags
  last_contact TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CHAT MESSAGES (WhatsApp Analysis)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  sender VARCHAR(50), -- 'client', 'agent'
  message TEXT NOT NULL,
  sentiment VARCHAR(50), -- 'positive', 'neutral', 'negative'
  intent VARCHAR(100), -- 'question', 'objection', 'interest', etc.
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SOCIAL MEDIA POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS social_posts (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  platform VARCHAR(50), -- 'instagram', 'facebook', 'linkedin', 'twitter'
  content TEXT NOT NULL,
  media_url TEXT,
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  status VARCHAR(50), -- 'draft', 'scheduled', 'published', 'failed'
  engagement_likes INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SOCIAL ACCOUNTS (MULTI-ACCOUNT SOCIAL MANAGEMENT)
-- ============================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,               -- 'instagram', 'facebook', 'linkedin', 'twitter'
  external_account_id VARCHAR(255) NOT NULL,   -- ID from the social platform
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  connected BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- AD ACCOUNTS (MULTI-ACCOUNT AD MANAGEMENT)
-- ============================================
CREATE TABLE IF NOT EXISTS ad_accounts (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,               -- 'google', 'meta'
  external_account_id VARCHAR(255) NOT NULL,   -- ID from the ad platform
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  connected BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- AUTOMATION WORKFLOWS
-- ============================================
CREATE TABLE IF NOT EXISTS automation_workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50), -- 'active', 'paused'
  trigger_type VARCHAR(100), -- 'Novo Lead Criado', 'Status: Aguardando > 24h', etc.
  enrolled_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_workflow_steps (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES automation_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type VARCHAR(50), -- 'wait', 'email', 'whatsapp', 'sms', 'tag', 'owner', 'webhook', 'notification'
  step_value TEXT, -- Configuration for the step
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TRAINING MODULES
-- ============================================
CREATE TABLE IF NOT EXISTS training_modules (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'Fundamentos', 'Avançado', 'Especialização'
  duration_minutes INTEGER,
  difficulty VARCHAR(50), -- 'Iniciante', 'Intermediário', 'Avançado'
  video_url TEXT,
  thumbnail_url TEXT,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES training_modules(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- ============================================
-- KPIs (Key Performance Indicators)
-- ============================================
CREATE TABLE IF NOT EXISTS kpis (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  metric_name VARCHAR(100), -- 'revenue', 'ad_spend', 'roas', 'cpa'
  metric_value VARCHAR(50),
  change_percent DECIMAL(5,2),
  trend VARCHAR(10), -- 'up', 'down', 'stable'
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- DEVICE STATISTICS
-- ============================================
CREATE TABLE IF NOT EXISTS device_stats (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
  percentage DECIMAL(5,2),
  conversions INTEGER,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CHAT LOGS (AI Assistant Conversations)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sender VARCHAR(100), -- 'user', 'assistant'
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SETTINGS - API KEYS
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  service_name VARCHAR(100) NOT NULL, -- 'gemini', 'openai', 'custom'
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SETTINGS - INTEGRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(100) NOT NULL, -- 'google_ads', 'meta_ads', 'whatsapp'
  status VARCHAR(50) DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
  access_token TEXT,
  refresh_token TEXT,
  last_sync TIMESTAMP,
  config JSONB, -- Platform-specific configuration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SETTINGS - TEAM MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(100), -- 'Admin', 'Vendedor', 'Editor', 'Viewer'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending'
  invited_by INTEGER REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SETTINGS - BILLING & INVOICES
-- ============================================
CREATE TABLE IF NOT EXISTS billing_invoices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BRL',
  status VARCHAR(50) DEFAULT 'paid', -- 'paid', 'pending', 'failed', 'refunded'
  billing_date DATE NOT NULL,
  due_date DATE,
  payment_method VARCHAR(100), -- 'credit_card', 'boleto', 'pix'
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SETTINGS - USER PROFILES (Extended)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(50),
  company VARCHAR(255),
  job_title VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  language VARCHAR(10) DEFAULT 'pt-BR',
  notification_preferences JSONB, -- Email, SMS, Push preferences
  subscription_plan VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CHAT AI - CONVERSATION SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  platform VARCHAR(50), -- 'whatsapp', 'instagram', 'facebook', 'email'
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' -- 'active', 'closed', 'archived'
);

-- ============================================
-- CHAT AI - CONVERSATION ANALYSIS
-- ============================================
CREATE TABLE IF NOT EXISTS chat_analysis (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  sentiment VARCHAR(50), -- 'positive', 'neutral', 'negative'
  intent VARCHAR(100), -- 'purchase_intent', 'support', 'complaint', 'inquiry'
  key_topics TEXT[], -- Array of detected topics
  objections TEXT[], -- Array of detected objections
  buying_signals TEXT[], -- Array of detected buying signals
  recommended_actions TEXT[], -- AI-suggested next steps
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  analysis_summary TEXT,
  analyzed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_leads_client ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_chat_messages_lead ON chat_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_client ON social_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON automation_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_user ON training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_kpis_client ON kpis(client_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_user ON billing_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_lead ON conversation_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_chat_analysis_session ON chat_analysis(session_id);

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert default user
INSERT INTO users (name, email, password_hash, role_id, avatar_url) VALUES
('Denis May', 'denis@elitefinderapp.com', '$2a$10$dummyhashforexample', 1, 'https://i.pravatar.cc/40?u=denis')
ON CONFLICT (email) DO NOTHING;


-- Insert sample clients
INSERT INTO clients (name, type, email, phone, city) VALUES
('TechCorp Soluções Ltda', 'premium', 'contato@techcorp.com', '(11) 98765-4321', 'São Paulo'),
('Padaria do João', 'standard', 'joao@padaria.com', '(21) 91234-5678', 'Rio de Janeiro'),
('Ana Maria Silva (Consultoria)', 'basic', 'ana@consultoria.com', '(47) 99876-5432', 'Florianópolis')
ON CONFLICT DO NOTHING;

-- Insert sample campaigns (only if clients table has data)
INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions, impressions, clicks)
SELECT 
    client_id::INTEGER,
    name::VARCHAR(255),
    platform::VARCHAR(50),
    status::VARCHAR(50),
    budget::DECIMAL(10,2),
    spent::DECIMAL(10,2),
    ctr::DECIMAL(5,2),
    roas::DECIMAL(5,2),
    conversions::INTEGER,
    impressions::INTEGER,
    clicks::INTEGER
FROM (VALUES
    (1, 'Promoção Verão - Pesquisa', 'google', 'active', 25000, 10500, 4.2, 6.1, 85, 85000, 3570),
    (1, 'Remarketing - Feed', 'meta', 'active', 15000, 6000, 1.8, 4.5, 42, 92000, 1656),
    (1, 'Brand Awareness - Reels', 'meta', 'learning', 7500, 2000, 0.9, 1.2, 5, 50000, 450),
    (2, 'Concorrentes - Pesquisa', 'google', 'paused', 10000, 9500, 3.5, 2.1, 22, 40000, 1400),
    (3, 'Youtube - Discovery', 'google', 'learning', 5000, 1200, 0.8, 1.5, 8, 30000, 240)
) AS v(client_id, name, platform, status, budget, spent, ctr, roas, conversions, impressions, clicks)
WHERE NOT EXISTS (SELECT 1 FROM campaigns LIMIT 1);

-- Insert sample leads
INSERT INTO leads (client_id, name, email, source, product_interest, value, status, assigned_to, tags, last_contact)
SELECT 
    client_id::INTEGER,
    name::VARCHAR(255),
    email::VARCHAR(255),
    source::VARCHAR(100),
    product_interest::VARCHAR(255),
    value::DECIMAL(10,2),
    status::VARCHAR(50),
    assigned_to::VARCHAR(100),
    tags::TEXT[],
    last_contact::TIMESTAMP
FROM (VALUES
    (1, 'Alice Ferreira', 'alice@email.com', 'Google Ads', 'Plano Premium', 6000, 'new', 'Sarah', ARRAY['Quente', 'Urgente'], NOW() - INTERVAL '10 minutes'),
    (1, 'Roberto Silva', 'roberto@email.com', 'Instagram', 'Kit Inicial', 2250, 'in_progress', 'Mike', ARRAY['Follow-up'], NOW() - INTERVAL '2 hours'),
    (2, 'Carlos Dias', 'carlos@email.com', 'Organic', 'Enterprise', 25000, 'waiting', 'Sarah', ARRAY['Decisor'], NOW() - INTERVAL '1 day'),
    (1, 'Diana Prata', 'diana@email.com', 'Google Ads', 'Plano Premium', 6000, 'closed_won', 'Mike', ARRAY['Onboarding'], NOW() - INTERVAL '3 days'),
    (3, 'Evandro Souza', 'evandro@email.com', 'Instagram', 'Kit Inicial', 2250, 'new', 'Sarah', '{}', NOW() - INTERVAL '5 minutes')
) AS v(client_id, name, email, source, product_interest, value, status, assigned_to, tags, last_contact)
WHERE NOT EXISTS (SELECT 1 FROM leads LIMIT 1);

-- Insert sample social posts
INSERT INTO social_posts (client_id, content, platform, status, scheduled_at, engagement_likes, engagement_comments)
SELECT 
    client_id::INTEGER,
    content::TEXT,
    platform::VARCHAR(50),
    status::VARCHAR(50),
    scheduled_at::TIMESTAMP,
    engagement_likes::INTEGER,
    engagement_comments::INTEGER
FROM (VALUES
    (1, 'Lançamento da coleção de verão! 🌞 #verao #moda', 'instagram', 'published', NOW() - INTERVAL '4 days', 245, 12),
    (1, '5 Dicas para melhorar seu ROAS agora. Link na bio.', 'linkedin', 'scheduled', NOW() + INTERVAL '2 days', 0, 0),
    (2, 'Bastidores do nosso escritório.', 'instagram', 'draft', NULL, 0, 0)
) AS v(client_id, content, platform, status, scheduled_at, engagement_likes, engagement_comments)
WHERE NOT EXISTS (SELECT 1 FROM social_posts LIMIT 1);


-- Insert sample automation workflows
INSERT INTO automation_workflows (name, status, trigger_type, enrolled_count, conversion_rate)
SELECT * FROM (VALUES
('Nutrição de Novo Lead', 'active', 'Novo Lead Criado', 124, 12.0),
('Follow-up Sem Resposta', 'active', 'Status: Aguardando > 24h', 45, 8.0),
('Campanha de Reengajamento', 'paused', 'Inativo > 30 dias', 890, 2.0)
) AS v(name, status, trigger_type, enrolled_count, conversion_rate)
WHERE NOT EXISTS (SELECT 1 FROM automation_workflows LIMIT 1);

-- Insert sample training modules
INSERT INTO training_modules (title, description, category, duration_minutes, difficulty, order_index)
SELECT * FROM (VALUES
('Fundamentos de Google Ads', 'Aprenda os conceitos básicos de campanhas no Google', 'Fundamentos', 45, 'Iniciante', 1),
('Meta Ads Avançado', 'Estratégias avançadas para Facebook e Instagram', 'Avançado', 60, 'Avançado', 2),
('Automação de Marketing', 'Como criar fluxos de automação eficientes', 'Especialização', 90, 'Intermediário', 3)
) AS v(title, description, category, duration_minutes, difficulty, order_index)
WHERE NOT EXISTS (SELECT 1 FROM training_modules LIMIT 1);

-- Insert sample KPIs
INSERT INTO kpis (client_id, metric_name, metric_value, change_percent, trend, period_start, period_end)
SELECT 
    client_id::INTEGER,
    metric_name::VARCHAR(100),
    metric_value::VARCHAR(50),
    change_percent::DECIMAL(5,2),
    trend::VARCHAR(10),
    period_start::DATE,
    period_end::DATE
FROM (VALUES
    (NULL, 'revenue', 'R$ 711.500,00', 12.5, 'up', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE),
    (NULL, 'ad_spend', 'R$ 122.500,00', -2.4, 'down', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE),
    (NULL, 'roas', '5.8x', 8.1, 'up', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE),
    (NULL, 'cpa', 'R$ 92,00', -5.2, 'down', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE)
) AS v(client_id, metric_name, metric_value, change_percent, trend, period_start, period_end)
WHERE NOT EXISTS (SELECT 1 FROM kpis LIMIT 1);

-- Insert sample user profile
INSERT INTO user_profiles (user_id, phone, company, job_title, subscription_plan, subscription_status)
SELECT * FROM (VALUES
(1, '(11) 98765-4321', 'ARS Data Science', 'CEO & Founder', 'pro', 'active')
) AS v(user_id, phone, company, job_title, subscription_plan, subscription_status)
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = 1);

-- Insert sample team members
INSERT INTO team_members (user_id, name, email, role, status)
SELECT * FROM (VALUES
(1, 'Denis May', 'denismay@arsdatascience.com.br', 'Admin', 'active'),
(1, 'Sarah Sales', 'sarah@elite.com', 'Vendedor', 'active'),
(1, 'Mike Marketing', 'mike@elite.com', 'Editor', 'inactive')
) AS v(user_id, name, email, role, status)
WHERE NOT EXISTS (SELECT 1 FROM team_members LIMIT 1);

-- Insert sample integrations
INSERT INTO integrations (user_id, platform, status, last_sync)
SELECT * FROM (VALUES
(1, 'google_ads', 'connected', NOW() - INTERVAL '10 minutes'),
(1, 'meta_ads', 'connected', NOW() - INTERVAL '1 hour'),
(1, 'whatsapp', 'disconnected', NULL)
) AS v(user_id, platform, status, last_sync)
WHERE NOT EXISTS (SELECT 1 FROM integrations LIMIT 1);

-- Insert sample billing invoices
INSERT INTO billing_invoices (user_id, invoice_number, amount, status, billing_date, payment_method)
SELECT 
    user_id::INTEGER,
    invoice_number::VARCHAR(100),
    amount::DECIMAL(10,2),
    status::VARCHAR(50),
    billing_date::DATE,
    payment_method::VARCHAR(100)
FROM (VALUES
    (1, 'INV-2025-11', 497.00, 'paid', '2025-11-01', 'credit_card'),
    (1, 'INV-2025-10', 497.00, 'paid', '2025-10-01', 'credit_card'),
    (1, 'INV-2025-09', 497.00, 'paid', '2025-09-01', 'credit_card')
) AS v(user_id, invoice_number, amount, status, billing_date, payment_method)
ON CONFLICT (invoice_number) DO NOTHING;

-- Insert sample conversation session
INSERT INTO conversation_sessions (lead_id, user_id, platform, message_count, status)
SELECT * FROM (VALUES
(1, 1, 'whatsapp', 5, 'active')
) AS v(lead_id, user_id, platform, message_count, status)
WHERE NOT EXISTS (SELECT 1 FROM conversation_sessions LIMIT 1);

-- Insert sample chat messages for the session
INSERT INTO chat_messages (lead_id, sender, message, sentiment, intent)
SELECT * FROM (VALUES
(1, 'client', 'Olá, vi o anúncio da solução Enterprise. Quanto custa?', 'neutral', 'inquiry'),
(1, 'agent', 'Olá! Obrigado pelo contato. Nossas soluções Enterprise são personalizadas. Poderia me falar um pouco sobre o tamanho da sua equipe?', 'positive', 'question'),
(1, 'client', 'Temos cerca de 50 pessoas. Mas honestamente, estou olhando o Concorrente X e eles cobram R$ 250/usuário.', 'neutral', 'objection'),
(1, 'agent', 'Entendo que o preço é importante. O Concorrente X tem uma ferramenta básica boa, mas nossa plataforma inclui a suíte de automação IA que geralmente economiza 20 horas semanais da equipe. Economizar esse tempo seria valioso para você?', 'positive', 'value_proposition'),
(1, 'client', 'Isso soa interessante na verdade. Integra com Salesforce?', 'positive', 'interest')
) AS v(lead_id, sender, message, sentiment, intent)
WHERE NOT EXISTS (SELECT 1 FROM chat_messages LIMIT 1);

-- Insert sample chat analysis
INSERT INTO chat_analysis (session_id, sentiment, intent, key_topics, objections, buying_signals, recommended_actions, confidence_score, analysis_summary)
SELECT * FROM (VALUES
(1, 'positive', 'purchase_intent', 
 ARRAY['pricing', 'team_size', 'integrations', 'automation'], 
 ARRAY['price_comparison'], 
 ARRAY['interest_in_features', 'integration_question'],
 ARRAY['Enviar proposta personalizada', 'Agendar demo do Salesforce', 'Destacar ROI da automação'],
 0.85,
 'Cliente demonstra interesse genuíno. Objeção de preço foi contornada com valor. Próximo passo: demo técnica.')
) AS v(session_id, sentiment, intent, key_topics, objections, buying_signals, recommended_actions, confidence_score, analysis_summary)
WHERE NOT EXISTS (SELECT 1 FROM chat_analysis LIMIT 1);

