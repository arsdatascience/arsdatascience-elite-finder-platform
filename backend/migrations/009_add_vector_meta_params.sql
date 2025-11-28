ALTER TABLE agent_vector_configs
ADD COLUMN IF NOT EXISTS search_mode VARCHAR(50) DEFAULT 'semantic',
ADD COLUMN IF NOT EXISTS enable_reranking BOOLEAN DEFAULT false;
