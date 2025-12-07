-- ML Datasets Table
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INTEGER, -- Maps to Agency (Core DB)
    client_id UUID, -- Optional link to specific client (Core DB)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- csv, xlsx, json, parquet
    file_size INTEGER,
    file_path TEXT NOT NULL, -- S3 or local path
    row_count INTEGER,
    column_count INTEGER,
    columns JSONB, -- Metadata of columns (names, types)
    preview JSONB, -- First 100 rows for preview
    status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, processing, validated, error
    error_message TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML Experiments Table
CREATE TABLE IF NOT EXISTS model_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INTEGER, -- Ref Core DB
    dataset_id UUID REFERENCES datasets(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    algorithm VARCHAR(100) NOT NULL, -- xgboost, linear_regression, etc
    task_type VARCHAR(50) NOT NULL, -- regression, classification, clustering
    
    -- Model Configuration
    target_column VARCHAR(255),
    feature_columns JSONB, -- Array of strings
    test_size FLOAT DEFAULT 0.2,
    random_state INTEGER,
    
    -- Hyperparameters
    hyperparameters JSONB,
    
    -- Training Results
    status VARCHAR(50) DEFAULT 'pending', -- pending, training, completed, failed
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    training_time_ms FLOAT,
    error_message TEXT,
    
    -- Review Metrics
    metrics JSONB, -- R2, RMSE, Accuracy, F1, etc
    feature_importance JSONB,
    confusion_matrix JSONB,
    
    -- Artifacts
    model_path TEXT, -- Path to .pkl file
    model_size INTEGER,
    
    -- Deployment
    is_deployed BOOLEAN DEFAULT FALSE,
    deployed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom Predictions History
CREATE TABLE IF NOT EXISTS custom_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES model_experiments(id),
    input_data JSONB,
    prediction JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_datasets_tenant ON datasets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_experiments_tenant ON model_experiments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_experiments_dataset ON model_experiments(dataset_id);
