-- Migration: ML Algorithm Configurations
-- Stores user configurations for ML algorithms with all hyperparameters

-- Main configurations table
CREATE TABLE IF NOT EXISTS ml_algorithm_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- No FK, tenants lives in Core DB
    algorithm_id VARCHAR(100) NOT NULL,
    algorithm_name VARCHAR(200) NOT NULL,
    algorithm_category VARCHAR(50) NOT NULL, -- 'regression', 'classification', 'clustering', 'time_series'
    config JSONB NOT NULL DEFAULT '{}',
    preset_name VARCHAR(50), -- 'fast', 'balanced', 'accurate', 'custom'
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID -- No FK, users lives in Core DB
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_ml_configs_tenant ON ml_algorithm_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ml_configs_algorithm ON ml_algorithm_configs(algorithm_id);
CREATE INDEX IF NOT EXISTS idx_ml_configs_category ON ml_algorithm_configs(algorithm_category);
CREATE INDEX IF NOT EXISTS idx_ml_configs_active ON ml_algorithm_configs(is_active) WHERE is_active = true;

-- Unique constraint: one default config per algorithm per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_ml_configs_default 
ON ml_algorithm_configs(tenant_id, algorithm_id) 
WHERE is_default = true;

-- Brazilian holidays for Prophet
CREATE TABLE IF NOT EXISTS ml_prophet_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- No FK, tenants lives in Core DB
    holiday_name VARCHAR(100) NOT NULL,
    holiday_date DATE NOT NULL,
    lower_window INT DEFAULT 0, -- days before
    upper_window INT DEFAULT 0, -- days after
    is_recurring BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default Brazilian holidays
INSERT INTO ml_prophet_holidays (tenant_id, holiday_name, holiday_date, lower_window, upper_window, is_recurring) VALUES
(NULL, 'Ano Novo', '2024-01-01', 0, 0, true),
(NULL, 'Carnaval', '2024-02-13', -3, 1, true),
(NULL, 'Sexta-Feira Santa', '2024-03-29', -1, 0, true),
(NULL, 'Páscoa', '2024-03-31', -7, 0, true),
(NULL, 'Tiradentes', '2024-04-21', 0, 0, true),
(NULL, 'Dia do Trabalho', '2024-05-01', 0, 0, true),
(NULL, 'Dia das Mães', '2024-05-12', -7, 0, true),
(NULL, 'Dia dos Namorados', '2024-06-12', -7, 0, true),
(NULL, 'Dia dos Pais', '2024-08-11', -7, 0, true),
(NULL, 'Independência', '2024-09-07', 0, 0, true),
(NULL, 'Nossa Senhora Aparecida', '2024-10-12', 0, 0, true),
(NULL, 'Dia das Crianças', '2024-10-12', -7, 0, true),
(NULL, 'Finados', '2024-11-02', 0, 0, true),
(NULL, 'Proclamação da República', '2024-11-15', 0, 0, true),
(NULL, 'Black Friday', '2024-11-29', -7, 0, true),
(NULL, 'Natal', '2024-12-25', -10, 0, true),
(NULL, 'Reveillon', '2024-12-31', -3, 0, true)
ON CONFLICT DO NOTHING;

-- Config history for auditing
CREATE TABLE IF NOT EXISTS ml_algorithm_config_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID, -- FK removed for initial creation (table may not exist yet)
    previous_config JSONB,
    new_config JSONB,
    changed_by UUID, -- No FK, users lives in Core DB
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_ml_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS trigger_ml_config_updated ON ml_algorithm_configs;
CREATE TRIGGER trigger_ml_config_updated
    BEFORE UPDATE ON ml_algorithm_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_config_timestamp();

-- Comments
COMMENT ON TABLE ml_algorithm_configs IS 'Stores ML algorithm configurations with hyperparameters';
COMMENT ON TABLE ml_prophet_holidays IS 'Brazilian holidays for Prophet time series model';
COMMENT ON COLUMN ml_algorithm_configs.config IS 'JSON with all hyperparameters for the algorithm';
COMMENT ON COLUMN ml_algorithm_configs.preset_name IS 'Preset used: fast, balanced, accurate, or custom';
