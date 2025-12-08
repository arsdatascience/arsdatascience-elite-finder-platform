/**
 * Bulk Import Controller
 * Permite importação de CSV diretamente para tabelas do sistema ML
 */

const pool = require('./database');
const opsPool = pool.opsPool;
const multer = require('multer');
const csv = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

// Configuração de upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads', 'imports');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `import_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Definição das tabelas suportadas e suas colunas
const SUPPORTED_TABLES = {
    // Core ML Tables
    ml_datasets: {
        label: 'ML Datasets',
        database: 'ops',
        columns: ['id', 'tenant_id', 'name', 'original_filename', 'file_path', 'file_size', 'row_count', 'column_count', 'columns', 'statistics', 'market_area', 'created_by', 'created_at'],
        requiredColumns: ['name'],
        autoGenerate: ['id', 'created_at'],
        useUserTenant: true
    },
    ml_experiments: {
        label: 'ML Experiments',
        database: 'ops',
        columns: ['id', 'tenant_id', 'name', 'dataset_id', 'algorithm', 'task_type', 'status', 'target_column', 'feature_columns', 'hyperparameters', 'preset', 'metrics', 'feature_importance', 'predictions_sample', 'confusion_matrix', 'training_duration', 'error_message', 'model_path', 'is_deployed', 'market_area', 'created_by', 'created_at'],
        requiredColumns: ['name', 'algorithm', 'task_type'],
        autoGenerate: ['id', 'created_at'],
        useUserTenant: true
    },
    ml_predictions: {
        label: 'ML Predictions',
        database: 'ops',
        columns: ['id', 'tenant_id', 'experiment_id', 'input_data', 'predictions', 'confidence', 'created_at'],
        requiredColumns: ['experiment_id'],
        autoGenerate: ['id', 'created_at'],
        useUserTenant: true
    },
    ml_regression_results: {
        label: 'Regression Results',
        database: 'ops',
        columns: ['id', 'experiment_id', 'r2_score', 'rmse', 'mae', 'mape', 'mse', 'adjusted_r2', 'residuals', 'predicted_vs_actual', 'coefficients', 'intercept', 'created_at'],
        requiredColumns: ['experiment_id'],
        autoGenerate: ['id', 'created_at']
    },
    ml_classification_results: {
        label: 'Classification Results',
        database: 'ops',
        columns: ['id', 'experiment_id', 'accuracy', 'precision_score', 'recall', 'f1_score', 'roc_auc', 'confusion_matrix', 'classification_report', 'roc_curve', 'precision_recall_curve', 'class_distribution', 'created_at'],
        requiredColumns: ['experiment_id'],
        autoGenerate: ['id', 'created_at']
    },
    ml_clustering_results: {
        label: 'Clustering Results',
        database: 'ops',
        columns: ['id', 'experiment_id', 'silhouette_score', 'davies_bouldin_index', 'calinski_harabasz_score', 'n_clusters', 'cluster_centers', 'cluster_sizes', 'cluster_labels', 'inertia', 'created_at'],
        requiredColumns: ['experiment_id'],
        autoGenerate: ['id', 'created_at']
    },
    ml_timeseries_results: {
        label: 'Time Series Results',
        database: 'ops',
        columns: ['id', 'experiment_id', 'mape', 'rmse', 'mae', 'forecast_values', 'trend', 'seasonality', 'residuals', 'confidence_intervals', 'forecast_horizon', 'created_at'],
        requiredColumns: ['experiment_id'],
        autoGenerate: ['id', 'created_at']
    },
    // Analytics Tables
    ml_sales_analytics: {
        label: 'Sales Analytics',
        database: 'ops',
        columns: ['id', 'experiment_id', 'period', 'total_sales', 'predicted_sales', 'growth_rate', 'conversion_rate', 'avg_ticket', 'top_products', 'sales_by_region', 'sales_trend', 'seasonality_index', 'created_at'],
        requiredColumns: [],
        autoGenerate: ['id', 'created_at']
    },
    ml_marketing_analytics: {
        label: 'Marketing Analytics',
        database: 'ops',
        columns: ['id', 'experiment_id', 'campaign_name', 'roi', 'cac', 'cpl', 'ctr', 'conversion_rate', 'impressions', 'clicks', 'leads', 'channel_performance', 'audience_segments', 'predicted_roi', 'created_at'],
        requiredColumns: [],
        autoGenerate: ['id', 'created_at']
    },
    ml_customer_analytics: {
        label: 'Customer Analytics',
        database: 'ops',
        columns: ['id', 'experiment_id', 'total_customers', 'new_customers', 'churned_customers', 'churn_rate', 'clv', 'retention_rate', 'nps_score', 'customer_segments', 'rfm_analysis', 'churn_risk_distribution', 'predicted_churn', 'created_at'],
        requiredColumns: [],
        autoGenerate: ['id', 'created_at']
    },
    ml_financial_analytics: {
        label: 'Financial Analytics',
        database: 'ops',
        columns: ['id', 'experiment_id', 'period', 'revenue', 'expenses', 'profit', 'profit_margin', 'cashflow', 'predicted_revenue', 'revenue_trend', 'expense_breakdown', 'financial_forecast', 'created_at'],
        requiredColumns: [],
        autoGenerate: ['id', 'created_at']
    },
    // Omnichannel Tables
    unified_customers: {
        label: 'Unified Customers (CDP)',
        database: 'core',
        columns: ['id', 'tenant_id', 'client_id', 'email', 'phone', 'whatsapp_number', 'name', 'facebook_id', 'instagram_id', 'google_id', 'linkedin_id', 'tiktok_id', 'preferred_channel', 'communication_frequency', 'best_contact_time', 'language', 'timezone', 'current_stage', 'last_channel', 'last_interaction', 'total_touchpoints', 'channel_mix', 'lifetime_value', 'avg_order_value', 'purchase_count', 'tags', 'segments', 'cart_items', 'cart_value', 'cart_updated_at', 'first_seen_at', 'created_at', 'updated_at'],
        requiredColumns: [],
        autoGenerate: ['id', 'created_at', 'updated_at'],
        useUserTenant: true
    },
    customer_interactions: {
        label: 'Customer Interactions',
        database: 'core',
        columns: ['id', 'customer_id', 'tenant_id', 'channel', 'interaction_type', 'campaign_id', 'session_id', 'device_type', 'content_summary', 'metadata', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'referrer', 'created_at'],
        requiredColumns: ['customer_id', 'channel', 'interaction_type'],
        autoGenerate: ['id', 'created_at'],
        useUserTenant: true
    },
    customer_journeys: {
        label: 'Customer Journeys',
        database: 'core',
        columns: ['id', 'customer_id', 'tenant_id', 'journey_type', 'journey_name', 'current_step', 'total_steps', 'status', 'next_action_channel', 'next_action_type', 'next_action_content', 'next_action_at', 'response_rate', 'engagement_score', 'started_at', 'last_step_at', 'completed_at', 'trigger_data', 'metadata', 'created_at', 'updated_at'],
        requiredColumns: ['customer_id', 'journey_type'],
        autoGenerate: ['id', 'created_at', 'updated_at'],
        useUserTenant: true
    },
    conversion_events: {
        label: 'Conversion Events',
        database: 'core',
        columns: ['id', 'customer_id', 'tenant_id', 'conversion_type', 'conversion_value', 'currency', 'conversion_path', 'touchpoints_count', 'first_touch_channel', 'last_touch_channel', 'attribution_last_click', 'attribution_first_click', 'attribution_linear', 'attribution_time_decay', 'order_id', 'product_ids', 'campaign_id', 'converted_at', 'created_at'],
        requiredColumns: ['conversion_type'],
        autoGenerate: ['id', 'created_at'],
        useUserTenant: true
    },
    ml_industry_segments: {
        label: 'Industry Segments',
        database: 'ops',
        columns: ['id', 'code', 'name_pt', 'name_en', 'description', 'icon', 'color', 'typical_metrics', 'typical_algorithms', 'created_at'],
        requiredColumns: ['code', 'name_pt', 'name_en'],
        autoGenerate: ['id', 'created_at']
    }
};

/**
 * GET /api/import/tables
 * Lista tabelas disponíveis para importação
 */
exports.listTables = async (req, res) => {
    try {
        const tables = Object.entries(SUPPORTED_TABLES).map(([key, config]) => ({
            id: key,
            label: config.label,
            columns: config.columns,
            requiredColumns: config.requiredColumns,
            database: config.database
        }));

        res.json({
            success: true,
            tables
        });
    } catch (error) {
        console.error('Error listing tables:', error);
        res.status(500).json({ success: false, error: 'Failed to list tables' });
    }
};

/**
 * GET /api/import/template/:tableName
 * Retorna template CSV para uma tabela
 */
exports.getTemplate = async (req, res) => {
    try {
        const { tableName } = req.params;
        const tableConfig = SUPPORTED_TABLES[tableName];

        if (!tableConfig) {
            return res.status(404).json({ success: false, error: 'Table not found' });
        }

        // Gerar header CSV
        const header = tableConfig.columns.join(',');

        // Gerar exemplo de linha
        const exampleRow = tableConfig.columns.map(col => {
            if (col.includes('id') && col !== 'id') return 'uuid-reference';
            if (col === 'id') return '(auto-generated)';
            if (col.includes('_at')) return '2024-01-01 00:00:00';
            if (col.includes('tenant')) return '(from-user)';
            if (col.includes('email')) return 'example@email.com';
            if (col.includes('phone')) return '+5511999999999';
            if (col.includes('name')) return 'Example Name';
            if (col.includes('rate') || col.includes('score')) return '0.75';
            if (col.includes('count') || col.includes('size')) return '100';
            if (col.includes('value') || col.includes('revenue')) return '1000.00';
            return 'example_value';
        }).join(',');

        const csvContent = `${header}\n${exampleRow}`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${tableName}_template.csv`);
        res.send(csvContent);
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ success: false, error: 'Failed to generate template' });
    }
};

/**
 * POST /api/import/preview
 * Preview de dados antes de importar
 */
exports.previewData = async (req, res) => {
    try {
        const { tableName } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const tableConfig = SUPPORTED_TABLES[tableName];
        if (!tableConfig) {
            fs.unlinkSync(file.path);
            return res.status(404).json({ success: false, error: 'Table not found' });
        }

        // Parse CSV
        const fileContent = fs.readFileSync(file.path, 'utf8');
        const records = csv.parse(fileContent, { columns: true, skip_empty_lines: true });

        // Validar colunas
        const csvColumns = records.length > 0 ? Object.keys(records[0]) : [];
        const missingRequired = tableConfig.requiredColumns.filter(col => !csvColumns.includes(col));

        // Limpar arquivo temporário
        fs.unlinkSync(file.path);

        res.json({
            success: true,
            preview: {
                tableName,
                tableLabel: tableConfig.label,
                totalRows: records.length,
                csvColumns,
                tableColumns: tableConfig.columns,
                requiredColumns: tableConfig.requiredColumns,
                missingRequired,
                sampleData: records.slice(0, 10),
                isValid: missingRequired.length === 0
            }
        });
    } catch (error) {
        console.error('Error previewing data:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: 'Failed to preview data' });
    }
};

/**
 * POST /api/import/:tableName
 * Importa dados CSV para a tabela
 */
exports.importData = async (req, res) => {
    const file = req.file;

    try {
        const { tableName } = req.params;
        const tenantId = req.user?.tenantId;

        if (!file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const tableConfig = SUPPORTED_TABLES[tableName];
        if (!tableConfig) {
            fs.unlinkSync(file.path);
            return res.status(404).json({ success: false, error: `Table "${tableName}" not supported` });
        }

        // Parse CSV
        const fileContent = fs.readFileSync(file.path, 'utf8');
        const records = csv.parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true
        });

        if (records.length === 0) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ success: false, error: 'CSV file is empty' });
        }

        // Determinar qual pool usar
        const dbPool = tableConfig.database === 'ops' ? opsPool : pool;

        // Preparar inserção
        const csvColumns = Object.keys(records[0]).filter(col => tableConfig.columns.includes(col));

        // Adicionar tenant_id se necessário
        const finalColumns = [...csvColumns];
        if (tableConfig.useUserTenant && !csvColumns.includes('tenant_id') && tenantId) {
            finalColumns.push('tenant_id');
        }

        let inserted = 0;
        let errors = [];

        // Inserir em batches
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);

            for (const record of batch) {
                try {
                    // Preparar valores
                    const values = csvColumns.map(col => {
                        let val = record[col];

                        // Tratar valores vazios
                        if (val === '' || val === undefined) return null;

                        // Tratar JSONB (campos que começam com { ou [)
                        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                            try {
                                // Desescape aspas duplas do CSV
                                val = val.replace(/""/g, '"');
                                JSON.parse(val); // Validar que é JSON válido
                                return val;
                            } catch (e) {
                                return null;
                            }
                        }

                        return val;
                    });

                    // Adicionar tenant_id se necessário
                    if (tableConfig.useUserTenant && !csvColumns.includes('tenant_id') && tenantId) {
                        values.push(tenantId);
                    }

                    // Construir query
                    const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
                    const query = `INSERT INTO ${tableName} (${finalColumns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

                    await dbPool.query(query, values);
                    inserted++;
                } catch (rowError) {
                    errors.push({
                        row: i + batch.indexOf(record) + 1,
                        error: rowError.message
                    });
                }
            }
        }

        // Limpar arquivo
        fs.unlinkSync(file.path);

        res.json({
            success: true,
            result: {
                tableName,
                tableLabel: tableConfig.label,
                totalRows: records.length,
                inserted,
                failed: errors.length,
                errors: errors.slice(0, 10) // Mostrar apenas primeiros 10 erros
            }
        });

    } catch (error) {
        console.error('Import error:', error);
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        res.status(500).json({
            success: false,
            error: 'Import failed: ' + error.message
        });
    }
};

// Export multer upload middleware
exports.upload = upload;
