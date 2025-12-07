const { opsPool } = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parse/sync');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'datasets');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV, Excel and JSON files are allowed'));
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * Upload a new dataset
 */
const uploadDataset = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Parse CSV to get column info and row count
        let columns = [];
        let rowCount = 0;
        let preview = [];

        if (file.originalname.endsWith('.csv')) {
            const fileContent = fs.readFileSync(file.path, 'utf8');
            const records = csv.parse(fileContent, { columns: true });
            rowCount = records.length;

            if (records.length > 0) {
                columns = Object.keys(records[0]).map(name => ({
                    name,
                    type: inferColumnType(records.slice(0, 100).map(r => r[name]))
                }));
                preview = records.slice(0, 10);
            }
        }

        // Insert dataset metadata
        const result = await opsPool.query(`
            INSERT INTO ml_datasets (tenant_id, name, original_filename, file_path, file_size, row_count, column_count, columns, statistics)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            tenantId,
            req.body.name || file.originalname.replace(/\.[^/.]+$/, ''),
            file.originalname,
            file.path,
            file.size,
            rowCount,
            columns.length,
            JSON.stringify(columns),
            JSON.stringify({ preview })
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Dataset Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload dataset' });
    }
};

/**
 * Get all datasets for tenant
 */
const getDatasets = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const result = await opsPool.query(
            'SELECT * FROM ml_datasets WHERE tenant_id = $1 ORDER BY created_at DESC',
            [tenantId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get Datasets Error:', error);
        res.status(500).json({ error: 'Failed to fetch datasets' });
    }
};

/**
 * Get analytics results with segment filtering
 */
const getAnalyticsResults = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const { segment, algorithm, analysis_type } = req.query;

        let query = `
            SELECT 
                sa.*,
                seg.code as segment_code,
                seg.name_pt as segment_name,
                seg.color as segment_color,
                seg.icon as segment_icon
            FROM ml_segment_analytics sa
            LEFT JOIN ml_industry_segments seg ON sa.segment_id = seg.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (tenantId) {
            query += ` AND (sa.tenant_id = $${paramIndex} OR sa.tenant_id IS NULL)`;
            params.push(tenantId);
            paramIndex++;
        }

        if (segment) {
            query += ` AND seg.code = $${paramIndex}`;
            params.push(segment);
            paramIndex++;
        }

        if (algorithm) {
            query += ` AND sa.algorithm = $${paramIndex}`;
            params.push(algorithm);
            paramIndex++;
        }

        if (analysis_type) {
            query += ` AND sa.analysis_type = $${paramIndex}`;
            params.push(analysis_type);
            paramIndex++;
        }

        query += ' ORDER BY sa.created_at DESC LIMIT 100';

        const result = await opsPool.query(query, params);

        // Enrich with visualization data based on analysis type
        const enrichedResults = await Promise.all(result.rows.map(async (row) => {
            let vizData = null;

            switch (row.analysis_type) {
                case 'regression':
                    const regViz = await opsPool.query(
                        'SELECT * FROM ml_viz_regression WHERE segment_analytics_id = $1',
                        [row.id]
                    );
                    vizData = regViz.rows[0] || null;
                    break;
                case 'classification':
                    const clfViz = await opsPool.query(
                        'SELECT * FROM ml_viz_classification WHERE segment_analytics_id = $1',
                        [row.id]
                    );
                    vizData = clfViz.rows[0] || null;
                    break;
                case 'clustering':
                    const clusterViz = await opsPool.query(
                        'SELECT * FROM ml_viz_clustering WHERE segment_analytics_id = $1',
                        [row.id]
                    );
                    vizData = clusterViz.rows[0] || null;
                    break;
                case 'timeseries':
                    const tsViz = await opsPool.query(
                        'SELECT * FROM ml_viz_timeseries WHERE segment_analytics_id = $1',
                        [row.id]
                    );
                    vizData = tsViz.rows[0] || null;
                    break;
            }

            return { ...row, visualization: vizData };
        }));

        res.json(enrichedResults);
    } catch (error) {
        console.error('Get Analytics Results Error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics results' });
    }
};

/**
 * Get available industry segments
 */
const getSegments = async (req, res) => {
    try {
        const result = await opsPool.query(
            'SELECT * FROM ml_industry_segments ORDER BY name_pt'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get Segments Error:', error);
        res.status(500).json({ error: 'Failed to fetch segments' });
    }
};

/**
 * Get segment-specific data with aggregated analytics
 */
const getSegmentData = async (req, res) => {
    try {
        const { code } = req.params;

        // Get segment info
        const segmentResult = await opsPool.query(
            'SELECT * FROM ml_industry_segments WHERE code = $1',
            [code]
        );

        if (segmentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Segment not found' });
        }

        const segment = segmentResult.rows[0];

        // Get analytics for this segment
        const analyticsResult = await opsPool.query(`
            SELECT 
                sa.*,
                CASE 
                    WHEN sa.analysis_type = 'regression' THEN (
                        SELECT row_to_json(vr) FROM ml_viz_regression vr WHERE vr.segment_analytics_id = sa.id
                    )
                    WHEN sa.analysis_type = 'classification' THEN (
                        SELECT row_to_json(vc) FROM ml_viz_classification vc WHERE vc.segment_analytics_id = sa.id
                    )
                    WHEN sa.analysis_type = 'clustering' THEN (
                        SELECT row_to_json(vcl) FROM ml_viz_clustering vcl WHERE vcl.segment_analytics_id = sa.id
                    )
                    WHEN sa.analysis_type = 'timeseries' THEN (
                        SELECT row_to_json(vt) FROM ml_viz_timeseries vt WHERE vt.segment_analytics_id = sa.id
                    )
                END as visualization
            FROM ml_segment_analytics sa
            WHERE sa.segment_id = $1
            ORDER BY sa.created_at DESC
        `, [segment.id]);

        // Group by analysis type
        const grouped = {
            regression: [],
            classification: [],
            clustering: [],
            timeseries: []
        };

        analyticsResult.rows.forEach(row => {
            if (grouped[row.analysis_type]) {
                grouped[row.analysis_type].push(row);
            }
        });

        res.json({
            segment,
            analytics: grouped,
            summary: {
                total_analyses: analyticsResult.rows.length,
                regression_count: grouped.regression.length,
                classification_count: grouped.classification.length,
                clustering_count: grouped.clustering.length,
                timeseries_count: grouped.timeseries.length
            }
        });
    } catch (error) {
        console.error('Get Segment Data Error:', error);
        res.status(500).json({ error: 'Failed to fetch segment data' });
    }
};

/**
 * Get algorithm configurations
 */
const getAlgorithms = async (req, res) => {
    try {
        const { task_type } = req.query;

        let query = 'SELECT * FROM ml_algorithm_configs';
        const params = [];

        if (task_type) {
            query += ' WHERE task_type = $1';
            params.push(task_type);
        }

        query += ' ORDER BY task_type, display_name';

        const result = await opsPool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get Algorithms Error:', error);
        res.status(500).json({ error: 'Failed to fetch algorithms' });
    }
};

// Helper function to infer column type from values
function inferColumnType(values) {
    const nonNullValues = values.filter(v => v !== null && v !== '' && v !== undefined);
    if (nonNullValues.length === 0) return 'unknown';

    const sample = nonNullValues.slice(0, 50);

    // Check if all values are numbers
    if (sample.every(v => !isNaN(Number(v)))) {
        // Check if integers
        if (sample.every(v => Number.isInteger(Number(v)))) {
            return 'integer';
        }
        return 'float';
    }

    // Check if dates
    if (sample.every(v => !isNaN(Date.parse(v)))) {
        return 'date';
    }

    // Check if boolean
    const boolValues = ['true', 'false', '0', '1', 'yes', 'no'];
    if (sample.every(v => boolValues.includes(String(v).toLowerCase()))) {
        return 'boolean';
    }

    return 'string';
}

module.exports = {
    upload,
    uploadDataset,
    getDatasets,
    getAnalyticsResults,
    getSegments,
    getSegmentData,
    getAlgorithms
};
