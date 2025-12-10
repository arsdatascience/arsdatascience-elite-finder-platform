-- 046_add_client_association.sql

-- Add client_id to generated_images
ALTER TABLE generated_images ADD COLUMN IF NOT EXISTS client_id INTEGER;

-- Add client_id to chatbots (Agent Builder)
ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS client_id INTEGER;

-- Create audio_analyses if it doesn't exist (it was missing from migrations)
CREATE TABLE IF NOT EXISTS audio_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    summary TEXT,
    global_sentiment JSONB,
    speakers JSONB,
    segments JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add client_id to audio_analyses
ALTER TABLE audio_analyses ADD COLUMN IF NOT EXISTS client_id INTEGER;

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_generated_images_client_id ON generated_images(client_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_client_id ON chatbots(client_id);
CREATE INDEX IF NOT EXISTS idx_audio_analyses_client_id ON audio_analyses(client_id);
