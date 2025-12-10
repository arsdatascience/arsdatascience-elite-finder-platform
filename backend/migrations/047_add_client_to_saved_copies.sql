-- 047_add_client_to_saved_copies.sql

ALTER TABLE saved_copies ADD COLUMN IF NOT EXISTS client_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_saved_copies_client_id ON saved_copies(client_id);
