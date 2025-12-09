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

// Camadas de importação com dependências
const IMPORT_LAYERS = {
    1: {
        name: 'Base (sem dependências)',
        tables: ['tenants', 'users', 'ml_industry_segments', 'ml_prophet_holidays', 'ml_datasets', 'unified_customers'],
        dependsOn: []
    },
    2: {
        name: 'Experimentos (depende de datasets)',
        tables: ['ml_experiments', 'ml_algorithm_configs'],
        dependsOn: ['ml_datasets']
    },
    3: {
        name: 'Resultados ML (depende de experiments)',
        tables: ['ml_predictions', 'ml_regression_results', 'ml_classification_results', 'ml_clustering_results', 'ml_timeseries_results', 'ml_sales_analytics', 'ml_marketing_analytics', 'ml_customer_analytics', 'ml_financial_analytics', 'ml_segment_analytics'],
        dependsOn: ['ml_experiments']
    },
    4: {
        name: 'Visualizações (depende de results)',
        tables: ['ml_viz_regression', 'ml_viz_classification', 'ml_viz_clustering', 'ml_viz_timeseries', 'ml_algorithm_config_history'],
        dependsOn: ['ml_regression_results', 'ml_classification_results', 'ml_clustering_results', 'ml_timeseries_results']
    },
    5: {
        name: 'Jornada do Cliente (depende de customers)',
        tables: ['customer_interactions', 'customer_journeys', 'identity_graph', 'journey_step_templates'],
        dependsOn: ['unified_customers']
    },
    6: {
        name: 'Conversões (depende de interactions)',
        tables: ['conversion_events'],
        dependsOn: ['customer_interactions']
    }
};

// Ordem flat para compatibilidade
const TABLE_IMPORT_ORDER = Object.values(IMPORT_LAYERS).flatMap(layer => layer.tables);

/**
 * ETL Normalization Functions
 */
const ETL = {
    // Normaliza valor string (trim, remove caracteres invisíveis)
    normalizeString: (value) => {
        if (value === null || value === undefined || value === '') return null;
        return String(value).trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
    },

    // Converte para número (int ou float)
    normalizeNumber: (value) => {
        if (value === null || value === undefined || value === '') return null;
        const cleaned = String(value).replace(/[^\d.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
    },

    // Converte para boolean
    normalizeBoolean: (value) => {
        if (value === null || value === undefined || value === '') return null;
        const lower = String(value).toLowerCase().trim();
        if (['true', '1', 'yes', 'sim', 't', 's'].includes(lower)) return true;
        if (['false', '0', 'no', 'não', 'nao', 'f', 'n'].includes(lower)) return false;
        return null;
    },

    // Converte para data ISO
    normalizeDate: (value) => {
        if (value === null || value === undefined || value === '') return null;
        // Tentar vários formatos
        const str = String(value).trim();

        // ISO format
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str;

        // DD/MM/YYYY ou DD-MM-YYYY
        const brMatch = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
        if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;

        // MM/DD/YYYY
        const usMatch = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
        if (usMatch) return `${usMatch[3]}-${usMatch[1]}-${usMatch[2]}`;

        return str;
    },

    // Normaliza JSON (parse se for string)
    normalizeJSON: (value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'object') return value;
        try {
            return JSON.parse(value);
        } catch (e) {
            // Se não for JSON válido, retorna como array de string
            return value.includes(',') ? value.split(',').map(s => s.trim()) : value;
        }
    },

    // Normaliza arrays do formato Python ['item'] para PostgreSQL {"item"}
    normalizeArray: (value) => {
        if (value === null || value === undefined || value === '') return null;
        if (Array.isArray(value)) {
            // Already an array, convert to PostgreSQL format
            return `{${value.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',')}}`;
        }

        const str = String(value).trim();

        // Check if it's Python-style array: ['item1', 'item2']
        if (str.startsWith('[') && str.endsWith(']')) {
            try {
                // Replace single quotes with double quotes for JSON parsing
                const jsonStr = str.replace(/'/g, '"');
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed)) {
                    // Convert to PostgreSQL array format: {"item1","item2"}
                    return `{${parsed.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',')}}`;
                }
            } catch (e) {
                // If parsing fails, try manual extraction
                const content = str.slice(1, -1); // Remove [ and ]
                const items = content.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
                return `{${items.map(v => `"${v}"`).join(',')}}`;
            }
        }

        // Already PostgreSQL format
        if (str.startsWith('{') && str.endsWith('}')) {
            return str;
        }

        // Single value, wrap in array
        return `{"${str}"}`;
    },

    // Normaliza UUID (remove espaços, valida formato)
    normalizeUUID: (value) => {
        if (value === null || value === undefined || value === '') return null;
        const cleaned = String(value).trim().toLowerCase();
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(cleaned)) {
            return cleaned;
        }
        return null;
    },

    // Aplica normalização baseada no tipo da coluna
    normalizeValue: (value, columnType) => {
        if (!columnType) return ETL.normalizeString(value);

        const type = columnType.toLowerCase();

        if (type.includes('int') || type.includes('serial')) {
            const num = ETL.normalizeNumber(value);
            return num !== null ? Math.floor(num) : null;
        }
        if (type.includes('numeric') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
            return ETL.normalizeNumber(value);
        }
        if (type.includes('bool')) {
            return ETL.normalizeBoolean(value);
        }
        if (type.includes('date') || type.includes('timestamp')) {
            return ETL.normalizeDate(value);
        }
        if (type.includes('json')) {
            return ETL.normalizeJSON(value);
        }
        if (type.includes('uuid')) {
            return ETL.normalizeUUID(value);
        }
        // Handle PostgreSQL array types (TEXT[], VARCHAR[], etc.)
        if (type.includes('[]') || type.includes('array')) {
            return ETL.normalizeArray(value);
        }

        return ETL.normalizeString(value);
    },

    // Normaliza nome de coluna (lowercase, underscores)
    normalizeColumnName: (name) => {
        return String(name)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
    },

    // Normaliza um registro inteiro baseado no schema
    normalizeRecord: (record, columnTypes) => {
        const normalized = {};
        const transformations = [];

        for (const [key, value] of Object.entries(record)) {
            const normalizedKey = ETL.normalizeColumnName(key);
            const columnType = columnTypes[normalizedKey] || 'text';
            const normalizedValue = ETL.normalizeValue(value, columnType);

            normalized[normalizedKey] = normalizedValue;

            // Registra transformação se houve mudança
            if (value !== normalizedValue || key !== normalizedKey) {
                transformations.push({
                    column: normalizedKey,
                    original: value,
                    normalized: normalizedValue,
                    type: columnType
                });
            }
        }

        return { normalized, transformations };
    }
};

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

        // Validar colunas - normalizar nomes (trim e lowercase para comparação)
        const csvColumns = records.length > 0
            ? Object.keys(records[0]).map(col => col.trim())
            : [];

        // Debug: log column comparison
        console.log('CSV columns:', csvColumns);
        console.log('Required columns:', tableInfo.requiredColumns);

        const missingRequired = (tableInfo.requiredColumns || []).filter(col => {
            const found = csvColumns.some(csvCol =>
                csvCol.toLowerCase() === col.toLowerCase()
            );
            if (!found) {
                console.log(`Missing required column: ${col}`);
            }
            return !found;
        });

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

        // Colunas que devem ser auto-geradas pelo banco (não importar do CSV)
        const autoGeneratedCols = ['id', 'tenant_id', 'created_at', 'updated_at'];

        // Criar mapeamento de colunas: { normalizedName: originalKey }
        // Isso permite usar nomes normalizados na query mas acessar record com chave original
        const columnMapping = {};
        Object.keys(records[0]).forEach(originalKey => {
            const normalized = originalKey.trim().toLowerCase();
            // Só incluir se existir na tabela e não for auto-gerada
            if (tableInfo.columns.includes(normalized) && !autoGeneratedCols.includes(normalized)) {
                columnMapping[normalized] = originalKey;
            }
        });

        const csvColumns = Object.keys(columnMapping); // Array de nomes normalizados

        // Verificar se há colunas válidas para importar
        if (csvColumns.length === 0) {
            fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                error: 'Nenhuma coluna válida encontrada no CSV. Verifique se os nomes das colunas correspondem à tabela.',
                tableColumns: tableInfo.columns.slice(0, 10), // Mostrar primeiras 10 colunas
                csvColumnsFound: Object.keys(records[0]).slice(0, 10)
            });
        }

        // Verificar se tem tenant_id na tabela e adicionar se necessário
        const hasTenantColumn = tableInfo.columns.includes('tenant_id');
        const finalColumns = [...csvColumns];
        if (hasTenantColumn && tenantId) {
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
                    // Preparar valores usando columnMapping para acessar chaves originais do CSV
                    const values = csvColumns.map(col => {
                        const originalKey = columnMapping[col];
                        let val = record[originalKey];

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
 * Importa múltiplos arquivos CSV por camadas, com normalização ETL
 */
exports.batchImport = async (req, res) => {
    const files = req.files;
    const { normalize = 'true' } = req.body; // Normalizar dados por padrão
    const shouldNormalize = normalize === 'true' || normalize === true;

    try {
        const tenantId = req.user?.tenantId;

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded' });
        }

        console.log(`[BatchImport] Starting with ${files.length} files, normalize=${shouldNormalize}`);

        // Mapear arquivos para tabelas
        const fileToTable = files.map(file => {
            let tableName = file.originalname
                .replace('.csv', '')
                .replace(/^import_\d+_/, '')
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_');
            return { file, tableName };
        });

        // Determinar camada de cada arquivo
        const filesByLayer = {};
        for (const { file, tableName } of fileToTable) {
            const layerNum = Object.entries(IMPORT_LAYERS).find(
                ([, layer]) => layer.tables.includes(tableName)
            )?.[0] || '99';

            if (!filesByLayer[layerNum]) filesByLayer[layerNum] = [];
            filesByLayer[layerNum].push({ file, tableName });
        }

        // Ordenar layers numericamente
        const sortedLayerNums = Object.keys(filesByLayer).sort((a, b) => parseInt(a) - parseInt(b));

        const layerResults = [];
        const allErrors = [];
        let totalTransformations = 0;

        // Processar por camada
        for (const layerNum of sortedLayerNums) {
            const layerFiles = filesByLayer[layerNum];
            const layerInfo = IMPORT_LAYERS[layerNum] || { name: 'Outras tabelas' };

            console.log(`[BatchImport] Processing layer ${layerNum}: ${layerInfo.name} (${layerFiles.length} files)`);

            const layerResult = {
                layer: parseInt(layerNum),
                layerName: layerInfo.name,
                files: [],
                totalInserted: 0,
                totalFailed: 0,
                transformationsApplied: 0
            };

            for (const { file, tableName } of layerFiles) {
                try {
                    // Buscar info da tabela com tipos de coluna
                    let tableInfo = await getTableInfoWithTypes(tableName, 'ops');
                    let database = 'ops';

                    if (!tableInfo) {
                        tableInfo = await getTableInfoWithTypes(tableName, 'core');
                        database = 'core';
                    }

                    if (!tableInfo) {
                        const staticConfig = SUPPORTED_TABLES[tableName];
                        if (staticConfig) {
                            tableInfo = {
                                columns: staticConfig.columns,
                                columnTypes: {},
                                requiredColumns: staticConfig.requiredColumns,
                                database: staticConfig.database
                            };
                            database = staticConfig.database;
                        } else {
                            allErrors.push({
                                file: file.originalname,
                                tableName,
                                layer: layerNum,
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
                        relax_column_count: true,
                        trim: true
                    });

                    if (records.length === 0) {
                        allErrors.push({
                            file: file.originalname,
                            tableName,
                            layer: layerNum,
                            error: 'CSV file is empty'
                        });
                        continue;
                    }

                    // Determinar pool
                    const dbPool = database === 'ops' ? opsPool : pool;

                    // Normalizar nomes de colunas do CSV. Permitir IDs explícitos se fornecidos.
                    const csvColumns = Object.keys(records[0])
                        .map(col => ETL.normalizeColumnName(col))
                        .filter(col => tableInfo.columns.includes(col));

                    const hasTenantColumn = tableInfo.columns.includes('tenant_id');
                    const finalColumns = [...csvColumns];
                    if (hasTenantColumn && !csvColumns.includes('tenant_id') && tenantId) {
                        finalColumns.push('tenant_id');
                    }

                    let inserted = 0;
                    let rowErrors = [];
                    let transformCount = 0;

                    // Inserir em batches de 100
                    for (let i = 0; i < records.length; i += 100) {
                        const batch = records.slice(i, i + 100);

                        for (const record of batch) {
                            try {
                                let processedRecord = record;
                                let recordTransformations = [];

                                // Aplicar normalização ETL se habilitado
                                if (shouldNormalize) {
                                    const { normalized, transformations } = ETL.normalizeRecord(record, tableInfo.columnTypes);
                                    processedRecord = normalized;
                                    recordTransformations = transformations;
                                    transformCount += transformations.length;
                                }

                                const values = csvColumns.map(col => {
                                    const normalizedCol = shouldNormalize ? col : ETL.normalizeColumnName(col);
                                    let val = processedRecord[normalizedCol];

                                    // Tratamento especial para JSON
                                    if (val !== null && typeof val === 'object') {
                                        return JSON.stringify(val);
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
                                    error: rowError.message.substring(0, 100)
                                });
                            }
                        }
                    }

                    layerResult.files.push({
                        file: file.originalname,
                        tableName,
                        database,
                        totalRows: records.length,
                        inserted,
                        failed: rowErrors.length,
                        transformations: transformCount,
                        errors: rowErrors.slice(0, 3)
                    });

                    layerResult.totalInserted += inserted;
                    layerResult.totalFailed += rowErrors.length;
                    layerResult.transformationsApplied += transformCount;
                    totalTransformations += transformCount;

                } catch (fileError) {
                    allErrors.push({
                        file: file.originalname,
                        tableName,
                        layer: layerNum,
                        error: fileError.message
                    });
                }
            }

            if (layerResult.files.length > 0) {
                layerResults.push(layerResult);
            }
        }

        // Limpar arquivos temporários
        for (const file of files) {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        // Calcular totais
        const totalInserted = layerResults.reduce((sum, l) => sum + l.totalInserted, 0);
        const totalFailed = layerResults.reduce((sum, l) => sum + l.totalFailed, 0);

        res.json({
            success: true,
            normalize: shouldNormalize,
            summary: {
                totalFiles: files.length,
                processedFiles: layerResults.reduce((sum, l) => sum + l.files.length, 0),
                failedFiles: allErrors.length,
                totalInserted,
                totalFailed,
                totalTransformations
            },
            layerResults,
            errors: allErrors
        });

    } catch (error) {
        console.error('Batch import error:', error);
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

/**
 * Helper: Busca informações de uma tabela incluindo tipos de coluna
 */
async function getTableInfoWithTypes(tableName, database) {
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
        const columnTypes = {};
        result.rows.forEach(r => {
            columnTypes[r.column_name] = r.data_type;
        });
        const requiredColumns = result.rows
            .filter(r => r.is_nullable === 'NO' && !r.column_default)
            .map(r => r.column_name);

        // Colunas auto-geradas (com default) - devem ser ignoradas no CSV
        const autoGeneratedColumns = result.rows
            .filter(r => r.column_default && (
                r.column_default.includes('uuid') ||
                r.column_default.includes('nextval') ||
                r.column_default.includes('now()') ||
                r.column_default.includes('CURRENT_TIMESTAMP') ||
                r.column_name === 'id' ||
                r.column_name === 'created_at' ||
                r.column_name === 'updated_at'
            ))
            .map(r => r.column_name);

        return { columns, columnTypes, requiredColumns, autoGeneratedColumns, database };
    } catch (error) {
        console.error(`Error fetching table info for ${tableName}:`, error.message);
        return null;
    }
}

// Export multer upload middleware
exports.upload = upload;
