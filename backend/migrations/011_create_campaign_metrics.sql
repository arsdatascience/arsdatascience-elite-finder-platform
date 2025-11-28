CREATE TABLE IF NOT EXISTS campaign_daily_metrics (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    spend DECIMAL(10, 2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    UNIQUE(campaign_id, date)
);

CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_daily_metrics(campaign_id);
