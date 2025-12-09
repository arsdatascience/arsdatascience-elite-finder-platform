-- Migration: Omnichannel Foundation (CDP Phase 1)
-- Created: 2025-12-07
-- Purpose: Implement core omnichannel data structure for unified customer view

-- ============================================
-- 1. UNIFIED CUSTOMERS (Central Customer Hub)
-- ============================================
CREATE TABLE IF NOT EXISTS unified_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER,
  
  -- Link to existing client (optional migration path)
  client_id INTEGER, -- References clients(id) in crossover DB
  
  -- Core Identifiers
  email VARCHAR(255),
  phone VARCHAR(50),
  whatsapp_number VARCHAR(50),
  name VARCHAR(255),
  
  -- Cross-channel IDs (for identity resolution)
  facebook_id VARCHAR(100),
  instagram_id VARCHAR(100),
  google_id VARCHAR(100),
  linkedin_id VARCHAR(100),
  tiktok_id VARCHAR(100),
  
  -- Preferences
  preferred_channel VARCHAR(50) DEFAULT 'whatsapp',
  communication_frequency VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  best_contact_time VARCHAR(50), -- "14:00-18:00"
  language VARCHAR(10) DEFAULT 'pt-BR',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  
  -- Journey State
  current_stage VARCHAR(50) DEFAULT 'awareness', -- awareness, consideration, decision, retention
  last_channel VARCHAR(50),
  last_interaction TIMESTAMP,
  
  -- Metrics (denormalized for performance)
  total_touchpoints INTEGER DEFAULT 0,
  channel_mix JSONB DEFAULT '{}', -- {"email": 40, "whatsapp": 35, "instagram": 25}
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  avg_order_value DECIMAL(12,2) DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  
  -- Segmentation
  tags TEXT[], -- ["vip", "churn_risk", "high_value"]
  segments TEXT[], -- ["black_friday_2024", "reactivation_q4"]
  
  -- Cart Data (for abandoned cart flows)
  cart_items JSONB,
  cart_value DECIMAL(12,2) DEFAULT 0,
  cart_updated_at TIMESTAMP,
  
  -- Timestamps
  first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for unified_customers
CREATE INDEX IF NOT EXISTS idx_unified_customers_tenant ON unified_customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_unified_customers_email ON unified_customers(email);
CREATE INDEX IF NOT EXISTS idx_unified_customers_phone ON unified_customers(phone);
CREATE INDEX IF NOT EXISTS idx_unified_customers_whatsapp ON unified_customers(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_unified_customers_client ON unified_customers(client_id);
CREATE INDEX IF NOT EXISTS idx_unified_customers_stage ON unified_customers(current_stage);

-- ============================================
-- 2. IDENTITY GRAPH (Cross-Channel Matching)
-- ============================================
CREATE TABLE IF NOT EXISTS identity_graph (
  id SERIAL PRIMARY KEY,
  customer_id UUID REFERENCES unified_customers(id) ON DELETE CASCADE,
  
  identifier_type VARCHAR(50) NOT NULL, -- email, phone, facebook_id, cookie_id, device_id
  identifier_value VARCHAR(255) NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 1.00, -- 0.00 to 1.00
  source_channel VARCHAR(50), -- website, whatsapp, instagram, meta_ads
  
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(identifier_type, identifier_value)
);

-- Indexes for identity_graph
CREATE INDEX IF NOT EXISTS idx_identity_graph_customer ON identity_graph(customer_id);
CREATE INDEX IF NOT EXISTS idx_identity_graph_value ON identity_graph(identifier_value);
CREATE INDEX IF NOT EXISTS idx_identity_graph_type ON identity_graph(identifier_type);

-- ============================================
-- 3. CUSTOMER INTERACTIONS (Event Log)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_interactions (
  id SERIAL PRIMARY KEY,
  customer_id UUID REFERENCES unified_customers(id) ON DELETE CASCADE,
  tenant_id INTEGER,
  
  -- Event Details
  channel VARCHAR(50) NOT NULL, -- email, whatsapp, instagram, website, store, phone
  interaction_type VARCHAR(50) NOT NULL, -- view, click, message_sent, message_received, purchase, visit, call
  
  -- Context
  campaign_id INTEGER, -- Link to campaigns if applicable
  session_id VARCHAR(100),
  device_type VARCHAR(50), -- mobile, desktop, tablet
  
  -- Content
  content_summary TEXT, -- Brief description of interaction
  metadata JSONB, -- Flexible data storage
  
  -- Attribution
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  referrer VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for interactions
CREATE INDEX IF NOT EXISTS idx_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_tenant ON customer_interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interactions_channel ON customer_interactions(channel);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON customer_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON customer_interactions(created_at DESC);

-- ============================================
-- 4. CUSTOMER JOURNEYS (Automation Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_journeys (
  id SERIAL PRIMARY KEY,
  customer_id UUID REFERENCES unified_customers(id) ON DELETE CASCADE,
  tenant_id INTEGER,
  
  -- Journey Definition
  journey_type VARCHAR(100) NOT NULL, -- abandoned_cart, onboarding, reactivation, upsell, nurturing
  journey_name VARCHAR(255),
  
  -- State
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, failed, cancelled
  
  -- Next Action
  next_action_channel VARCHAR(50),
  next_action_type VARCHAR(50),
  next_action_content TEXT,
  next_action_at TIMESTAMP,
  
  -- Metrics
  response_rate DECIMAL(5,2) DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_step_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Flexible Data
  trigger_data JSONB, -- What triggered this journey
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for journeys
CREATE INDEX IF NOT EXISTS idx_journeys_customer ON customer_journeys(customer_id);
CREATE INDEX IF NOT EXISTS idx_journeys_tenant ON customer_journeys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journeys_type ON customer_journeys(journey_type);
CREATE INDEX IF NOT EXISTS idx_journeys_status ON customer_journeys(status);
CREATE INDEX IF NOT EXISTS idx_journeys_next_action ON customer_journeys(next_action_at) WHERE status = 'active';

-- ============================================
-- 5. CONVERSION EVENTS (Attribution Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS conversion_events (
  id SERIAL PRIMARY KEY,
  customer_id UUID REFERENCES unified_customers(id) ON DELETE CASCADE,
  tenant_id INTEGER,
  
  -- Conversion Details
  conversion_type VARCHAR(50) NOT NULL, -- purchase, signup, lead, appointment, download
  conversion_value DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'BRL',
  
  -- Attribution
  conversion_path JSONB, -- ["Instagram Ad", "Website", "WhatsApp", "Purchase"]
  touchpoints_count INTEGER DEFAULT 0,
  first_touch_channel VARCHAR(50),
  last_touch_channel VARCHAR(50),
  
  -- Attribution Model Results (pre-calculated)
  attribution_last_click JSONB, -- {"whatsapp": 100}
  attribution_first_click JSONB, -- {"instagram": 100}
  attribution_linear JSONB, -- {"instagram": 33, "website": 33, "whatsapp": 34}
  attribution_time_decay JSONB, -- {"instagram": 10, "website": 30, "whatsapp": 60}
  
  -- Context
  order_id VARCHAR(100),
  product_ids JSONB,
  campaign_id INTEGER,
  
  -- Timestamps
  converted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for conversions
CREATE INDEX IF NOT EXISTS idx_conversions_customer ON conversion_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversions_tenant ON conversion_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversions_type ON conversion_events(conversion_type);
CREATE INDEX IF NOT EXISTS idx_conversions_date ON conversion_events(converted_at DESC);

-- ============================================
-- 6. JOURNEY STEP TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS journey_step_templates (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  
  journey_type VARCHAR(100) NOT NULL,
  step_order INTEGER NOT NULL,
  
  channel VARCHAR(50) NOT NULL,
  delay_minutes INTEGER DEFAULT 0, -- Wait time before executing
  
  action_type VARCHAR(50), -- send_email, send_whatsapp, add_tag, update_stage
  action_template TEXT, -- Template ID or content
  
  -- Conditions
  condition_type VARCHAR(50), -- if_not_opened, if_not_converted, if_clicked
  condition_value VARCHAR(255),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journey_templates_type ON journey_step_templates(journey_type);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE unified_customers IS 'Central hub for omnichannel customer data (CDP core)';
COMMENT ON TABLE identity_graph IS 'Probabilistic matching for cross-channel identity resolution';
COMMENT ON TABLE customer_interactions IS 'Event log for all customer touchpoints';
COMMENT ON TABLE customer_journeys IS 'Active automation sequences per customer';
COMMENT ON TABLE conversion_events IS 'Attribution tracking for conversions';
COMMENT ON TABLE journey_step_templates IS 'Reusable journey automation templates';
