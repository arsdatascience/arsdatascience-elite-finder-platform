-- ==============================================================================
-- MIGRATION 052: Expand Agent Schema for "Especialista" Template
-- ==============================================================================

-- 1. EXPAND AGENT PROMPTS
ALTER TABLE agent_prompts
ADD COLUMN IF NOT EXISTS extra_context TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS communication_tone VARCHAR(100),
ADD COLUMN IF NOT EXISTS priorities TEXT,
ADD COLUMN IF NOT EXISTS restrictions TEXT,
ADD COLUMN IF NOT EXISTS usage_examples TEXT;

-- 2. EXPAND AGENT VECTOR CONFIGS
ALTER TABLE agent_vector_configs
ADD COLUMN IF NOT EXISTS search_mode VARCHAR(50) DEFAULT 'hibrido', -- semantica, palavra_chave, hibrido
ADD COLUMN IF NOT EXISTS doc_limit INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS enable_reranking BOOLEAN DEFAULT true, -- already added logic in UI, now schema
ADD COLUMN IF NOT EXISTS relevance_weight DECIMAL(3,2) DEFAULT 0.70,
ADD COLUMN IF NOT EXISTS use_cache BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS aggregation_method VARCHAR(50) DEFAULT 'concatenacao';

-- 3. EXPAND CHATBOTS (Identity/Tools)
ALTER TABLE chatbots
ADD COLUMN IF NOT EXISTS specialty_area VARCHAR(255),
ADD COLUMN IF NOT EXISTS specific_tools TEXT[], -- Array of strings
ADD COLUMN IF NOT EXISTS specialization_filters TEXT[]; -- Array of strings
