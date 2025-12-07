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

/**
 * Deploy a trained model to production.
 */
const deployModel = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        // Verify experiment exists and is completed
        const experiment = await opsPool.query(
            'SELECT * FROM model_experiments WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );

        if (experiment.rows.length === 0) {
            return res.status(404).json({ error: 'Experiment not found' });
        }

        if (experiment.rows[0].status !== 'completed') {
            return res.status(400).json({ error: 'Only completed experiments can be deployed' });
        }

        // Mark as deployed
        const result = await opsPool.query(
            `UPDATE model_experiments 
             SET is_deployed = true, deployed_at = NOW() 
             WHERE id = $1 
             RETURNING *`,
            [id]
        );

        res.json({ success: true, model: result.rows[0] });
    } catch (error) {
        console.error('Deploy Error:', error);
        res.status(500).json({ error: 'Failed to deploy model' });
    }
};

/**
 * Run prediction using a deployed model.
 */
const runPrediction = async (req, res) => {
    try {
        const { modelId, data } = req.body;
        const tenantId = req.user.tenantId;

        // Verify model exists and belongs to tenant
        const model = await opsPool.query(
            'SELECT * FROM model_experiments WHERE id = $1 AND tenant_id = $2',
            [modelId, tenantId]
        );

        if (model.rows.length === 0) {
            return res.status(404).json({ error: 'Model not found' });
        }

        const modelData = model.rows[0];

        if (modelData.status !== 'completed') {
            return res.status(400).json({ error: 'Model training not completed' });
        }

        // Try to send to VPS for actual prediction
        try {
            const vpsPayload = {
                model_id: modelId,
                algorithm: modelData.algorithm,
                task_type: modelData.task_type,
                data: data,
                model_path: modelData.model_path
            };

            const vpsResponse = await axios.post(`${ML_SERVICE_URL}/api/predict`, vpsPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ML_API_KEY}`
                },
                timeout: 30000
            });

            // Store prediction in database
            await opsPool.query(
                `INSERT INTO custom_predictions (tenant_id, experiment_id, input_data, predictions, created_at)
                 VALUES ($1, $2, $3, $4, NOW())`,
                [tenantId, modelId, JSON.stringify(data), JSON.stringify(vpsResponse.data.predictions)]
            );

            res.json({
                success: true,
                predictions: vpsResponse.data.predictions,
                model: {
                    name: modelData.name,
                    algorithm: modelData.algorithm,
                    task_type: modelData.task_type
                }
            });
        } catch (vpsError) {
            // If VPS is unavailable, generate mock predictions for demo
            console.warn('VPS unavailable, generating mock predictions:', vpsError.message);

            const isClassification = modelData.task_type === 'classification';
            const mockPredictions = Array.isArray(data)
                ? data.map((_, i) => ({
                    row_id: i + 1,
                    prediction: isClassification
                        ? (Math.random() > 0.5 ? 1 : 0)
                        : Math.round(Math.random() * 10000) / 100,
                    probability: isClassification ? Math.random() * 0.4 + 0.6 : undefined,
                    confidence: Math.random() * 0.2 + 0.8
                }))
                : [{ row_id: 1, prediction: isClassification ? 1 : 42.5, confidence: 0.95 }];

            res.json({
                success: true,
                predictions: mockPredictions,
                model: {
                    name: modelData.name,
                    algorithm: modelData.algorithm,
                    task_type: modelData.task_type
                },
                mock: true
            });
        }
    } catch (error) {
        console.error('Prediction Error:', error);
        res.status(500).json({ error: 'Failed to run prediction' });
    }
};

/**
 * Get prediction history for a model
 */
const getPredictionHistory = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { modelId } = req.query;

        let query = 'SELECT * FROM custom_predictions WHERE tenant_id = $1';
        const params = [tenantId];

        if (modelId) {
            query += ' AND experiment_id = $2';
            params.push(modelId);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const result = await opsPool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Prediction History Error:', error);
        res.status(500).json({ error: 'Failed to fetch prediction history' });
    }
};

module.exports = {
    createExperiment,
    getExperiments,
    getExperimentDetails,
    deployModel,
    runPrediction,
    getPredictionHistory
};
