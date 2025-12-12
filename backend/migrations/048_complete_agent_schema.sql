
-- ==============================================================================
-- MIGRATION 048: Complete Agent Schema (Fixing missing columns errors)
-- ==============================================================================

-- 1. Fix missing columns in agent_ai_configs
ALTER TABLE agent_ai_configs ADD COLUMN IF NOT EXISTS frequency_penalty NUMERIC(4, 2) DEFAULT 0;
ALTER TABLE agent_ai_configs ADD COLUMN IF NOT EXISTS presence_penalty NUMERIC(4, 2) DEFAULT 0;
ALTER TABLE agent_ai_configs ADD COLUMN IF NOT EXISTS top_k INTEGER;
ALTER TABLE agent_ai_configs ADD COLUMN IF NOT EXISTS max_tokens INTEGER;
ALTER TABLE agent_ai_configs ADD COLUMN IF NOT EXISTS timeout INTEGER DEFAULT 60000;
ALTER TABLE agent_ai_configs ADD COLUMN IF NOT EXISTS retries INTEGER DEFAULT 3;
ALTER TABLE agent_ai_configs ADD COLUMN IF NOT EXISTS stop_sequences TEXT[];
ALTER TABLE agent_ai_configs ADD COLUMN IF NOT EXISTS response_mode VARCHAR(50) DEFAULT 'balanced';
ALTER TABLE agent_ai_configs ADD COLUMN IF NOT EXISTS candidate_count INTEGER DEFAULT 1;
ALTER TABLE agent_ai_configs ADD COLUMN IF NOT EXISTS seed INTEGER;
ALTER TABLE agent_ai_configs ADD COLUMN IF NOT EXISTS json_mode BOOLEAN DEFAULT false;

-- 2. Fix missing columns in agent_vector_configs
ALTER TABLE agent_vector_configs ADD COLUMN IF NOT EXISTS enable_reranking BOOLEAN DEFAULT false;
ALTER TABLE agent_vector_configs ADD COLUMN IF NOT EXISTS chunking_strategy VARCHAR(50) DEFAULT 'paragraph';
ALTER TABLE agent_vector_configs ADD COLUMN IF NOT EXISTS chunk_delimiter VARCHAR(50) DEFAULT '\n\n';
ALTER TABLE agent_vector_configs ADD COLUMN IF NOT EXISTS max_chunk_size INTEGER DEFAULT 2048;
ALTER TABLE agent_vector_configs ADD COLUMN IF NOT EXISTS chunk_overlap INTEGER DEFAULT 100;
ALTER TABLE agent_vector_configs ADD COLUMN IF NOT EXISTS search_mode VARCHAR(50) DEFAULT 'semantic';

-- 3. Ensure script_content exists in agent_prompts (Redundant check but safe)
ALTER TABLE agent_prompts ADD COLUMN IF NOT EXISTS script_content TEXT;
