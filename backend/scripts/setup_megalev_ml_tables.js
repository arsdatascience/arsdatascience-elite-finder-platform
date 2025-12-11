const path = require('path');
// Load .env from backend directory (relative to this script: backend/scripts/ -> backend/.env)
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { opsPool } = require('../database');

async function setupTables() {
    console.log('--- Setting up Megalev ML Tables ---');
    console.log('Target DB:', process.env.DATA_BASE_URL2 ? 'Megalev (DATA_BASE_URL2)' : 'Check opsPool config');

    const client = await opsPool.connect();
    try {
        console.log('✅ Connected to database.');

        // 0. Clean slate (Optional: Remove if you want to preserve data)
        console.log('Dropping existing tables to ensure clean schema...');
        await client.query('DROP TABLE IF EXISTS ml_algorithm_configs CASCADE');
        await client.query('DROP TABLE IF EXISTS ml_sales_analytics CASCADE');
        await client.query('DROP TABLE IF EXISTS ml_marketing_analytics CASCADE');
        await client.query('DROP TABLE IF EXISTS ml_customer_analytics CASCADE');
        await client.query('DROP TABLE IF EXISTS ml_financial_analytics CASCADE');

        // 1. ML Algorithm Configs
        console.log('Creating ml_algorithm_configs...');
        await client.query(`
            CREATE TABLE ml_algorithm_configs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                algorithm VARCHAR(100) UNIQUE NOT NULL,
                task_type VARCHAR(50) NOT NULL,
                display_name VARCHAR(100) NOT NULL,
                description TEXT,
                complexity VARCHAR(20),
                estimated_time VARCHAR(50),
                hyperparameters JSONB,
                suitable_for JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Sales Analytics
        console.log('Creating ml_sales_analytics...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS ml_sales_analytics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                experiment_id UUID,
                period VARCHAR(50),
                total_sales DECIMAL(15,2),
                predicted_sales DECIMAL(15,2),
                growth_rate FLOAT,
                ctr FLOAT,
                conversion_rate FLOAT,
                avg_ticket DECIMAL(10,2),
                top_products JSONB,
                impressions BIGINT,
                sales_by_region JSONB,
                clicks BIGINT,
                sales_trend JSONB,
                leads INTEGER,
                seasonality_index JSONB,
                channel_performance JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Marketing Analytics
        console.log('Creating ml_marketing_analytics...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS ml_marketing_analytics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                experiment_id UUID,
                campaign_name VARCHAR(255),
                roi FLOAT,
                cac DECIMAL(10,2),
                cpl DECIMAL(10,2),
                audience_segments JSONB,
                predicted_roi FLOAT,
                customer_segments JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. Customer Analytics
        console.log('Creating ml_customer_analytics...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS ml_customer_analytics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                experiment_id UUID,
                period VARCHAR(50),
                total_customers INTEGER,
                new_customers INTEGER,
                churned_customers INTEGER,
                churn_rate FLOAT,
                clv DECIMAL(10,2),
                retention_rate FLOAT,
                nps_score FLOAT,
                rfm_analysis JSONB,
                churn_risk_distribution JSONB,
                predicted_churn JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 5. Financial Analytics
        console.log('Creating ml_financial_analytics...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS ml_financial_analytics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                experiment_id UUID,
                revenue DECIMAL(15,2),
                expenses DECIMAL(15,2),
                profit DECIMAL(15,2),
                profit_margin FLOAT,
                cashflow DECIMAL(15,2),
                predicted_revenue DECIMAL(15,2),
                revenue_trend JSONB,
                expense_breakdown JSONB,
                financial_forecast JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 6. Indexes
        console.log('Creating indexes...');
        await client.query(`CREATE INDEX IF NOT EXISTS idx_ml_datasets_tenant ON ml_datasets(tenant_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_ml_experiments_tenant ON ml_experiments(tenant_id);`);
        // Add indexes for new tables
        await client.query(`CREATE INDEX IF NOT EXISTS idx_ml_sales_exp ON ml_sales_analytics(experiment_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_ml_marketing_exp ON ml_marketing_analytics(experiment_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_ml_customer_exp ON ml_customer_analytics(experiment_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_ml_financial_exp ON ml_financial_analytics(experiment_id);`);

        // 7. Seed Algorithm Configs
        console.log('Seeding Algorithm Configs...');
        const algorithms = [
            // REGRESSION
            ['linear_regression', 'regression', 'Linear Regression', 'Modelo linear simples para prever valores contínuos', 'low', '< 1 min', '{}', '["sales", "finance", "pricing"]'],
            ['ridge_regression', 'regression', 'Ridge Regression', 'Regressão com regularização L2 para evitar overfitting', 'low', '< 1 min', '{"alpha": {"min": 0.001, "max": 10, "default": 1}}', '["sales", "finance"]'],
            ['lasso_regression', 'regression', 'Lasso Regression', 'Regressão com regularização L1 e seleção de features', 'low', '< 1 min', '{"alpha": {"min": 0.001, "max": 10, "default": 1}}', '["marketing", "sales"]'],
            ['elasticnet', 'regression', 'ElasticNet', 'Combinação de L1 e L2 para melhor generalização', 'low', '< 1 min', '{"alpha": {"min": 0.001, "max": 10, "default": 1}, "l1_ratio": {"min": 0, "max": 1, "default": 0.5}}', '["finance", "operations"]'],
            ['random_forest_regressor', 'regression', 'Random Forest Regressor', 'Ensemble de árvores para previsões robustas', 'medium', '2-5 min', '{"n_estimators": {"min": 10, "max": 500, "default": 100}, "max_depth": {"min": 3, "max": 30, "default": 10}}', '["sales", "marketing", "finance"]'],
            ['xgboost_regressor', 'regression', 'XGBoost Regressor', 'Gradient boosting de alta performance', 'high', '5-10 min', '{"n_estimators": {"min": 50, "max": 1000, "default": 100}, "max_depth": {"min": 3, "max": 15, "default": 6}, "learning_rate": {"min": 0.01, "max": 0.3, "default": 0.1}}', '["sales", "customers", "finance"]'],
            ['lightgbm_regressor', 'regression', 'LightGBM Regressor', 'Gradient boosting rápido e eficiente', 'high', '3-8 min', '{"n_estimators": {"min": 50, "max": 1000, "default": 100}, "max_depth": {"min": 3, "max": 15, "default": -1}, "learning_rate": {"min": 0.01, "max": 0.3, "default": 0.1}}', '["marketing", "operations"]'],
            ['gradient_boosting_regressor', 'regression', 'Gradient Boosting Regressor', 'Boosting sequencial preciso', 'high', '5-15 min', '{"n_estimators": {"min": 50, "max": 500, "default": 100}, "max_depth": {"min": 3, "max": 10, "default": 3}, "learning_rate": {"min": 0.01, "max": 0.3, "default": 0.1}}', '["finance", "sales"]'],
            // CLASSIFICATION
            ['logistic_regression', 'classification', 'Logistic Regression', 'Classificação probabilística linear', 'low', '< 1 min', '{"C": {"min": 0.001, "max": 100, "default": 1}}', '["customers", "marketing"]'],
            ['decision_tree_classifier', 'classification', 'Decision Tree', 'Árvore de decisão interpretável', 'low', '< 1 min', '{"max_depth": {"min": 3, "max": 30, "default": 10}}', '["customers", "operations"]'],
            ['random_forest_classifier', 'classification', 'Random Forest Classifier', 'Ensemble robusto para classificação', 'medium', '2-5 min', '{"n_estimators": {"min": 10, "max": 500, "default": 100}, "max_depth": {"min": 3, "max": 30, "default": 10}}', '["customers", "marketing", "sales"]'],
            ['xgboost_classifier', 'classification', 'XGBoost Classifier', 'Classificação de alta precisão', 'high', '5-10 min', '{"n_estimators": {"min": 50, "max": 1000, "default": 100}, "max_depth": {"min": 3, "max": 15, "default": 6}, "learning_rate": {"min": 0.01, "max": 0.3, "default": 0.1}}', '["customers", "fraud", "churn"]'],
            ['lightgbm_classifier', 'classification', 'LightGBM Classifier', 'Classificação rápida e eficiente', 'high', '3-8 min', '{"n_estimators": {"min": 50, "max": 1000, "default": 100}, "max_depth": {"min": 3, "max": 15, "default": -1}, "learning_rate": {"min": 0.01, "max": 0.3, "default": 0.1}}', '["marketing", "customers"]'],
            ['naive_bayes', 'classification', 'Naive Bayes', 'Classificador probabilístico simples', 'low', '< 1 min', '{}', '["text", "spam", "sentiment"]'],
            ['svm_classifier', 'classification', 'SVM', 'Support Vector Machine para margens ótimas', 'medium', '2-10 min', '{"C": {"min": 0.1, "max": 100, "default": 1}, "kernel": {"options": ["linear", "rbf", "poly"], "default": "rbf"}}', '["customers", "fraud"]'],
            // CLUSTERING
            ['kmeans', 'clustering', 'K-Means', 'Segmentação por particionamento', 'low', '< 1 min', '{"n_clusters": {"min": 2, "max": 20, "default": 5}}', '["customers", "products", "marketing"]'],
            ['dbscan', 'clustering', 'DBSCAN', 'Clustering baseado em densidade', 'medium', '1-5 min', '{"eps": {"min": 0.1, "max": 10, "default": 0.5}, "min_samples": {"min": 2, "max": 20, "default": 5}}', '["customers", "anomalies"]'],
            ['hierarchical', 'clustering', 'Hierarchical Clustering', 'Clustering hierárquico aglomerativo', 'medium', '2-5 min', '{"n_clusters": {"min": 2, "max": 20, "default": 5}}', '["products", "customers"]'],
            // TIME SERIES
            ['prophet', 'timeseries', 'Prophet', 'Previsão de séries temporais com sazonalidade', 'medium', '2-5 min', '{"seasonality_mode": {"options": ["additive", "multiplicative"], "default": "additive"}}', '["sales", "demand", "traffic"]'],
            ['arima', 'timeseries', 'ARIMA', 'Modelo autoregressivo integrado', 'medium', '1-3 min', '{"p": {"min": 0, "max": 5, "default": 1}, "d": {"min": 0, "max": 2, "default": 1}, "q": {"min": 0, "max": 5, "default": 1}}', '["finance", "sales"]'],
            ['sarima', 'timeseries', 'SARIMA', 'ARIMA sazonal para padrões periódicos', 'high', '3-10 min', '{"p": {"min": 0, "max": 3, "default": 1}, "d": {"min": 0, "max": 2, "default": 1}, "q": {"min": 0, "max": 3, "default": 1}, "seasonal_period": {"min": 4, "max": 52, "default": 12}}', '["sales", "retail"]'],
            ['exponential_smoothing', 'timeseries', 'Exponential Smoothing', 'Suavização para tendências e sazonalidade', 'low', '< 1 min', '{"trend": {"options": ["add", "mul", null], "default": "add"}, "seasonal": {"options": ["add", "mul", null], "default": "add"}}', '["inventory", "demand"]']
        ];

        for (const algo of algorithms) {
            await client.query(`
                INSERT INTO ml_algorithm_configs (algorithm, task_type, display_name, description, complexity, estimated_time, hyperparameters, suitable_for)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (algorithm) DO NOTHING
            `, algo);
        }

        console.log('✅ All tables and data setup successfully!');

    } catch (err) {
        console.error('❌ Setup Error:', err);
    } finally {
        client.release();
        await opsPool.end();
        process.exit();
    }
}

setupTables();
