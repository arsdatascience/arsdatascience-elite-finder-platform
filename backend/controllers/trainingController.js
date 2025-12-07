const { opsPool } = require('../database');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://arsanalytics.aiiam.com.br';
const ML_API_KEY = process.env.ML_API_KEY || 'ArsDataScience2025SecureKey!';

/**
 * Create a new training experiment.
 * Sends the configuration to the VPS for remote processing.
 */
const createExperiment = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { datasetId, name, algorithm, taskType, targetColumn, featureColumns, hyperparameters } = req.body;

        // Verify dataset ownership
        const dataset = await opsPool.query(
            'SELECT * FROM datasets WHERE id = $1 AND tenant_id = $2',
            [datasetId, tenantId]
        );
        if (dataset.rows.length === 0) return res.status(404).json({ error: 'Dataset not found' });

        // Create Experiment Record (status: pending)
        const experiment = await opsPool.query(
            `INSERT INTO model_experiments (tenant_id, dataset_id, name, algorithm, task_type, target_column, feature_columns, hyperparameters, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            RETURNING *`,
            [tenantId, datasetId, name, algorithm, taskType, targetColumn, JSON.stringify(featureColumns), JSON.stringify(hyperparameters)]
        );

        const experimentId = experiment.rows[0].id;

        // Send training request to VPS (async, fire and forget style, or await if VPS is synchronous)
        // The actual endpoint on the VPS may vary. Using a generic one for now.
        try {
            await opsPool.query('UPDATE model_experiments SET status = $1, started_at = NOW() WHERE id = $2', ['training', experimentId]);

            const vpsPayload = {
                experiment_id: experimentId,
                dataset_url: dataset.rows[0].file_path, // VPS needs access to this URL
                target_column: targetColumn,
                feature_columns: featureColumns,
                algorithm: algorithm,
                task_type: taskType,
                hyperparameters: hyperparameters
            };

            const vpsResponse = await axios.post(`${ML_SERVICE_URL}/api/train`, vpsPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ML_API_KEY}`
                },
                timeout: 120000 // 2 minute timeout for long training jobs (VPS should respond with job ID)
            });

            // If VPS returns results synchronously (simpler setup)
            if (vpsResponse.data && vpsResponse.data.metrics) {
                await opsPool.query(
                    `UPDATE model_experiments 
                    SET status = 'completed', completed_at = NOW(), metrics = $1, feature_importance = $2 
                    WHERE id = $3`,
                    [vpsResponse.data.metrics, vpsResponse.data.feature_importance || {}, experimentId]
                );
            } else if (vpsResponse.data && vpsResponse.data.job_id) {
                // VPS returns a job ID for async processing
                await opsPool.query(
                    `UPDATE model_experiments SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{vps_job_id}', $1::jsonb) WHERE id = $2`,
                    [JSON.stringify(vpsResponse.data.job_id), experimentId]
                );
            }
            console.log(`Experiment ${experimentId} submitted to VPS.`);
        } catch (vpsError) {
            console.error('VPS Training Error:', vpsError.response?.data || vpsError.message);
            await opsPool.query('UPDATE model_experiments SET status = \'failed\', error_message = $1 WHERE id = $2',
                [vpsError.response?.data?.error || vpsError.message, experimentId]);
        }

        res.status(201).json(experiment.rows[0]);
    } catch (error) {
        console.error('Experiment Creation Error:', error);
        res.status(500).json({ error: 'Failed to create experiment' });
    }
};

const getExperiments = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const result = await opsPool.query(
            'SELECT * FROM model_experiments WHERE tenant_id = $1 ORDER BY created_at DESC',
            [tenantId]
        );
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: 'Fetch error' });
    }
};

const getExperimentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await opsPool.query('SELECT * FROM model_experiments WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Fetch error' });
    }
};

module.exports = {
    createExperiment,
    getExperiments,
    getExperimentDetails
};
