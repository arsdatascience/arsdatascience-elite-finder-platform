-- Create content_batches table
CREATE TABLE IF NOT EXISTS content_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'admin',
    topic TEXT NOT NULL,
    total_days INTEGER NOT NULL,
    platform TEXT NOT NULL,
    tone TEXT NOT NULL,
    status TEXT DEFAULT 'processing', -- processing, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'
);

-- Add batch_id to social_posts if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'batch_id') THEN
        ALTER TABLE social_posts ADD COLUMN batch_id UUID REFERENCES content_batches(id);
    END IF;
END $$;
