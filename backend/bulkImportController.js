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

// Ordem de importação para respeitar FKs (tabelas pai primeiro)
const TABLE_IMPORT_ORDER = [
    // 1. Tabelas base sem dependências
    'tenants',
    'users',
    'ml_industry_segments',
    'ml_datasets',
    // 2. Tabelas com FK para datasets
    'ml_experiments',
    // 3. Tabelas com FK para experiments
    'ml_predictions',
    'ml_regression_results',
    'ml_classification_results',
    'ml_clustering_results',
    'ml_timeseries_results',
    'ml_sales_analytics',
    'ml_marketing_analytics',
    'ml_customer_analytics',
    'ml_financial_analytics',
    // 4. Tabelas de clientes (CDP)
    'unified_customers',
    'customer_interactions',
    'customer_journeys',
    'conversion_events'
];

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
 * Lista tabelas disponíveis para importação (dinâmico dos bancos)
 */
exports.listTables = async (req, res) => {
    try {
        const tables = [];

        // Query simplificada para buscar tabelas e suas colunas
        const tableQuery = `
            SELECT 
                t.table_name,
                json_agg(json_build_object(
                    'name', c.column_name,
                    'nullable', c.is_nullable,
                    'has_default', c.column_default IS NOT NULL
                ) ORDER BY c.ordinal_position) as column_info
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
            WHERE t.table_schema = 'public' 
            AND t.table_type = 'BASE TABLE'
            AND t.table_name NOT LIKE 'pg_%'
            AND t.table_name NOT LIKE '_prisma%'
            GROUP BY t.table_name
            ORDER BY t.table_name
        `;

        // Função para processar resultado
        const processRows = (rows, dbName) => {
            for (const row of rows) {
                const columnInfo = row.column_info || [];
                const columns = columnInfo.map(c => c.name);
                const requiredColumns = columnInfo
                    .filter(c => c.nullable === 'NO' && !c.has_default)
                    .map(c => c.name);

                tables.push({
                    id: row.table_name,
                    label: formatTableName(row.table_name) + ` (${dbName})`,
                    columns,
                    requiredColumns,
                    database: dbName === 'Crossover' ? 'core' : 'ops'
                });
            }
        };

        // Buscar tabelas do Crossover (core)
        try {
            const coreResult = await pool.query(tableQuery);
            processRows(coreResult.rows, 'Crossover');
        } catch (err) {
            console.error('Error fetching Crossover tables:', err.message);
        }

        // Buscar tabelas do Megalev (ops)
        try {
            const opsResult = await opsPool.query(tableQuery);
            processRows(opsResult.rows, 'Megalev');
        } catch (err) {
            console.error('Error fetching Megalev tables:', err.message);
        }

        // Ordenar por nome
        tables.sort((a, b) => a.id.localeCompare(b.id));

        res.json({
            success: true,
            tables,
            databases: {
                core: 'Crossover (CRM/CDP)',
                ops: 'Megalev (Operations/ML)'
            }
        });
    } catch (error) {
        console.error('Error listing tables:', error);
        res.status(500).json({ success: false, error: 'Failed to list tables: ' + error.message });
    }
};

/**
 * Formata nome da tabela para exibição
 */
function formatTableName(tableName) {
    return tableName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Helper: Busca informações de uma tabela do banco de dados
 */
async function getTableInfo(tableName, database) {
    const dbPool = database === 'ops' ? opsPool : pool;

    try {
        const result = await dbPool.query(`
            SELECT 
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_default
            FROM information_schema.columns c
            WHERE c.table_schema = 'public' 
            AND c.table_name = $1
            ORDER BY c.ordinal_position
        `, [tableName]);

        if (result.rows.length === 0) {
            return null;
        }

        const columns = result.rows.map(r => r.column_name);
        const requiredColumns = result.rows
            .filter(r => r.is_nullable === 'NO' && !r.column_default)
            .map(r => r.column_name);

        return { columns, requiredColumns, database };
    } catch (error) {
        console.error(`Error fetching table info for ${tableName}:`, error.message);
        return null;
    }
}

/**
 * GET /api/import/template/:tableName
 * Retorna template CSV para uma tabela
 */
exports.getTemplate = async (req, res) => {
    try {
        const { tableName } = req.params;
        const { database = 'core' } = req.query;

        // Buscar colunas do banco
        const tableInfo = await getTableInfo(tableName, database);

        if (!tableInfo) {
            // Fallback para SUPPORTED_TABLES se existir
            const staticConfig = SUPPORTED_TABLES[tableName];
            if (!staticConfig) {
                return res.status(404).json({ success: false, error: 'Table not found' });
            }
            tableInfo = { columns: staticConfig.columns, requiredColumns: staticConfig.requiredColumns };
        }

        // Gerar header CSV
        const header = tableInfo.columns.join(',');

        // Gerar exemplo de linha
        const exampleRow = tableInfo.columns.map(col => {
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
        const { tableName, database = 'core' } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // Buscar info da tabela dinamicamente
        let tableInfo = await getTableInfo(tableName, database);

        if (!tableInfo) {
            // Fallback para SUPPORTED_TABLES
            const staticConfig = SUPPORTED_TABLES[tableName];
            if (!staticConfig) {
                fs.unlinkSync(file.path);
                return res.status(404).json({ success: false, error: 'Table not found in database' });
            }
            tableInfo = {
                columns: staticConfig.columns,
                requiredColumns: staticConfig.requiredColumns,
                database: staticConfig.database
            };
        }

        // Parse CSV
        const fileContent = fs.readFileSync(file.path, 'utf8');
        const records = csv.parse(fileContent, { columns: true, skip_empty_lines: true });

        // Validar colunas
        const csvColumns = records.length > 0 ? Object.keys(records[0]) : [];
        const missingRequired = (tableInfo.requiredColumns || []).filter(col => !csvColumns.includes(col));

        // Limpar arquivo temporário
        fs.unlinkSync(file.path);

        res.json({
            success: true,
            preview: {
                tableName,
                tableLabel: formatTableName(tableName),
                database: tableInfo.database,
                totalRows: records.length,
                csvColumns,
                tableColumns: tableInfo.columns,
                requiredColumns: tableInfo.requiredColumns || [],
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
        const { database = 'core' } = req.query;
        const tenantId = req.user?.tenantId;

        if (!file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        // Buscar info da tabela dinamicamente
        let tableInfo = await getTableInfo(tableName, database);

        if (!tableInfo) {
            // Fallback para SUPPORTED_TABLES
            const staticConfig = SUPPORTED_TABLES[tableName];
            if (!staticConfig) {
                fs.unlinkSync(file.path);
                return res.status(404).json({ success: false, error: `Table "${tableName}" not found in database` });
            }
            tableInfo = {
                columns: staticConfig.columns,
                requiredColumns: staticConfig.requiredColumns,
                database: staticConfig.database
            };
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
        const dbPool = tableInfo.database === 'ops' ? opsPool : pool;

        // Preparar inserção - usar colunas do CSV que existem na tabela
        const csvColumns = Object.keys(records[0]).filter(col => tableInfo.columns.includes(col));

        // Verificar se tem tenant_id na tabela e adicionar se necessário
        const hasTenantColumn = tableInfo.columns.includes('tenant_id');
        const finalColumns = [...csvColumns];
        if (hasTenantColumn && !csvColumns.includes('tenant_id') && tenantId) {
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
                    if (hasTenantColumn && !csvColumns.includes('tenant_id') && tenantId) {
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
                tableLabel: formatTableName(tableName),
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

/**
 * POST /api/import/batch
 * Importa múltiplos arquivos CSV de uma vez, respeitando ordem de FKs
 */
exports.batchImport = async (req, res) => {
    const files = req.files;

    try {
        const tenantId = req.user?.tenantId;

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded' });
        }

        const results = [];
        const errors = [];

        // Mapear arquivos para tabelas (baseado no nome do arquivo)
        const fileToTable = files.map(file => {
            // Remove extensão e prefixos como "import_timestamp_"
            let tableName = file.originalname
                .replace('.csv', '')
                .replace(/^import_\d+_/, '')
                .toLowerCase();

            // Normalizar nome para nome de tabela válido
            tableName = tableName.replace(/[^a-z0-9_]/g, '_');

            return { file, tableName };
        });

        // Ordenar arquivos pela ordem de dependências
        fileToTable.sort((a, b) => {
            const orderA = TABLE_IMPORT_ORDER.indexOf(a.tableName);
            const orderB = TABLE_IMPORT_ORDER.indexOf(b.tableName);
            // Tabelas não na lista vão para o final
            const posA = orderA === -1 ? 999 : orderA;
            const posB = orderB === -1 ? 999 : orderB;
            return posA - posB;
        });

        console.log('Import order:', fileToTable.map(f => f.tableName));

        // Processar cada arquivo na ordem correta
        for (const { file, tableName } of fileToTable) {
            try {
                // Tentar encontrar tabela em Megalev ou Crossover
                let tableInfo = await getTableInfo(tableName, 'ops');
                let database = 'ops';

                if (!tableInfo) {
                    tableInfo = await getTableInfo(tableName, 'core');
                    database = 'core';
                }

                if (!tableInfo) {
                    // Tentar com SUPPORTED_TABLES
                    const staticConfig = SUPPORTED_TABLES[tableName];
                    if (staticConfig) {
                        tableInfo = {
                            columns: staticConfig.columns,
                            requiredColumns: staticConfig.requiredColumns,
                            database: staticConfig.database
                        };
                        database = staticConfig.database;
                    } else {
                        errors.push({
                            file: file.originalname,
                            tableName,
                            error: 'Table not found in any database'
                        });
                        continue;
                    }
                }

                // Parse CSV
                const fileContent = fs.readFileSync(file.path, 'utf8');
                const records = csv.parse(fileContent, {
                    columns: true,
                    skip_empty_lines: true,
                    relax_column_count: true
                });

                if (records.length === 0) {
                    errors.push({
                        file: file.originalname,
                        tableName,
                        error: 'CSV file is empty'
                    });
                    continue;
                }

                // Determinar qual pool usar
                const dbPool = database === 'ops' ? opsPool : pool;

                // Preparar inserção
                const csvColumns = Object.keys(records[0]).filter(col => tableInfo.columns.includes(col));
                const hasTenantColumn = tableInfo.columns.includes('tenant_id');
                const finalColumns = [...csvColumns];
                if (hasTenantColumn && !csvColumns.includes('tenant_id') && tenantId) {
                    finalColumns.push('tenant_id');
                }

                let inserted = 0;
                let rowErrors = [];

                // Inserir em batches
                for (let i = 0; i < records.length; i += 100) {
                    const batch = records.slice(i, i + 100);

                    for (const record of batch) {
                        try {
                            const values = csvColumns.map(col => {
                                let val = record[col];
                                if (val === '' || val === undefined) return null;
                                if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                                    try {
                                        val = val.replace(/""/g, '"');
                                        JSON.parse(val);
                                        return val;
                                    } catch (e) {
                                        return null;
                                    }
                                }
                                return val;
                            });

                            if (hasTenantColumn && !csvColumns.includes('tenant_id') && tenantId) {
                                values.push(tenantId);
                            }

                            const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
                            const query = `INSERT INTO ${tableName} (${finalColumns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

                            await dbPool.query(query, values);
                            inserted++;
                        } catch (rowError) {
                            rowErrors.push({
                                row: i + batch.indexOf(record) + 1,
                                error: rowError.message
                            });
                        }
                    }
                }

                results.push({
                    file: file.originalname,
                    tableName,
                    database,
                    totalRows: records.length,
                    inserted,
                    failed: rowErrors.length,
                    errors: rowErrors.slice(0, 5)
                });

            } catch (fileError) {
                errors.push({
                    file: file.originalname,
                    tableName,
                    error: fileError.message
                });
            }
        }

        // Limpar arquivos temporários
        for (const file of files) {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        res.json({
            success: true,
            totalFiles: files.length,
            processedFiles: results.length,
            failedFiles: errors.length,
            importOrder: fileToTable.map(f => f.tableName),
            results,
            errors
        });

    } catch (error) {
        console.error('Batch import error:', error);
        // Limpar arquivos em caso de erro
        if (files) {
            for (const file of files) {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }
        res.status(500).json({
            success: false,
            error: 'Batch import failed: ' + error.message
        });
    }
};

// Export multer upload middleware
exports.upload = upload;
