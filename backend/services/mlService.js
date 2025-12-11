/**
 * ML Service - VPS Communication Wrapper
 * Handles all communication with the external ML Service
 */

const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_API_KEY = process.env.ML_API_KEY || '';

class MLService {
    constructor() {
        this.client = axios.create({
            baseURL: ML_SERVICE_URL,
            timeout: 120000, // 2 minutes for ML operations
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ML_API_KEY
            }
        });
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return { status: 'healthy', ...response.data };
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    /**
     * Sales Forecast - Predict future sales
     */
    async salesForecast(data, horizon = 30) {
        return this._callML('/api/forecast/sales', {
            data,
            horizon,
            models: ['xgboost', 'lightgbm', 'prophet']
        });
    }

    /**
     * Churn Prediction - Predict customer churn probability
     */
    async churnPrediction(customerData) {
        return this._callML('/api/predict/churn', {
            data: customerData,
            models: ['lightgbm', 'random_forest']
        });
    }

    /**
     * Trend Analysis - Analyze growth/decline trends
     */
    async trendAnalysis(timeSeriesData, metric) {
        return this._callML('/api/analysis/trends', {
            data: timeSeriesData,
            metric,
            models: ['random_forest', 'linear_regression']
        });
    }

    /**
     * Customer Segmentation - Cluster customers
     */
    async customerSegmentation(customerFeatures, nClusters = 5) {
        return this._callML('/api/cluster/customers', {
            data: customerFeatures,
            n_clusters: nClusters,
            models: ['kmeans', 'dbscan']
        });
    }

    /**
     * Anomaly Detection - Detect anomalies in metrics
     */
    async anomalyDetection(metricsData) {
        return this._callML('/api/detect/anomalies', {
            data: metricsData,
            models: ['isolation_forest']
        });
    }

    /**
     * Time Series Prophet - Facebook Prophet forecast
     */
    async prophetForecast(timeSeriesData, periods = 30) {
        return this._callML('/api/forecast/prophet', {
            data: timeSeriesData,
            periods,
            include_components: true
        });
    }

    /**
     * Marketing ROI Analysis
     */
    async marketingROI(spendData, revenueData) {
        return this._callML('/api/analysis/marketing-roi', {
            spend: spendData,
            revenue: revenueData
        });
    }

    /**
     * Budget Optimization
     */
    async budgetOptimization(historicalData, totalBudget) {
        return this._callML('/api/optimize/budget', {
            data: historicalData,
            total_budget: totalBudget
        });
    }

    /**
     * Instagram Performance Analysis
     */
    async instagramAnalysis(instagramMetrics) {
        return this._callML('/api/analysis/instagram', {
            data: instagramMetrics
        });
    }

    /**
     * TikTok Performance Analysis
     */
    async tiktokAnalysis(tiktokMetrics) {
        return this._callML('/api/analysis/tiktok', {
            data: tiktokMetrics
        });
    }

    /**
     * Cashflow Forecast
     */
    async cashflowForecast(financialData, days = 90) {
        return this._callML('/api/forecast/cashflow', {
            data: financialData,
            horizon: days
        });
    }

    /**
     * LTV Prediction
     */
    async ltvPrediction(customerData) {
        return this._callML('/api/predict/ltv', {
            data: customerData
        });
    }

    /**
     * RFM Analysis
     */
    async rfmAnalysis(transactionData) {
        return this._callML('/api/analysis/rfm', {
            data: transactionData
        });
    }

    /**
     * Funnel Optimization
     */
    async funnelOptimization(funnelData) {
        return this._callML('/api/analysis/funnel', {
            data: funnelData
        });
    }

    /**
     * Train Custom Model
     */
    async trainModel(taskType, algorithm, data, targetColumn, featureColumns, hyperparameters = {}) {
        return this._callML('/api/train', {
            task_type: taskType,
            algorithm,
            data,
            target_column: targetColumn,
            feature_columns: featureColumns,
            hyperparameters
        });
    }

    /**
     * Run Prediction with trained model
     */
    async predict(modelId, inputData) {
        return this._callML('/api/predict', {
            model_id: modelId,
            data: inputData
        });
    }

    /**
     * Internal method to call ML service with error handling
     */
    async _callML(endpoint, payload) {
        try {
            console.log(`[ML Service] Calling ${endpoint}`);
            const response = await this.client.post(endpoint, payload);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error(`[ML Service] Error calling ${endpoint}:`, error.message);

            // If ML service is down, return mock data for development
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                console.log('[ML Service] Service unavailable, returning mock data');
                return this._getMockResponse(endpoint, payload);
            }

            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    /**
     * Mock responses for development when ML service is unavailable
     */
    _getMockResponse(endpoint, payload) {
        const mockResponses = {
            '/api/forecast/sales': {
                success: true,
                data: {
                    forecast: this._generateMockForecast(payload.horizon || 30),
                    metrics: { rmse: 1250.5, mae: 980.2, mape: 0.08 },
                    model_used: 'xgboost'
                }
            },
            '/api/predict/churn': {
                success: true,
                data: {
                    predictions: payload.data?.map((_, i) => ({
                        id: i,
                        churn_probability: Math.random() * 0.5,
                        risk_level: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
                    })) || [],
                    model_used: 'lightgbm'
                }
            },
            '/api/analysis/trends': {
                success: true,
                data: {
                    trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
                    growth_rate: (Math.random() * 20 - 5).toFixed(2),
                    confidence: 0.85 + Math.random() * 0.1
                }
            },
            '/api/cluster/customers': {
                success: true,
                data: {
                    clusters: [
                        { id: 0, name: 'VIP', size: 150, avg_ltv: 5000 },
                        { id: 1, name: 'Regular', size: 500, avg_ltv: 1200 },
                        { id: 2, name: 'Occasional', size: 300, avg_ltv: 400 },
                        { id: 3, name: 'At Risk', size: 100, avg_ltv: 200 },
                        { id: 4, name: 'New', size: 200, avg_ltv: 150 }
                    ],
                    silhouette_score: 0.72
                }
            },
            '/api/detect/anomalies': {
                success: true,
                data: {
                    anomalies: [
                        { date: '2024-11-25', metric: 'revenue', value: 15000, expected: 5000, severity: 'high' },
                        { date: '2024-11-29', metric: 'orders', value: 10, expected: 50, severity: 'medium' }
                    ],
                    total_anomalies: 2
                }
            },
            '/api/forecast/prophet': {
                success: true,
                data: {
                    forecast: this._generateMockForecast(payload.periods || 30),
                    trend: 'increasing',
                    seasonality: { weekly: true, yearly: true },
                    components: { trend: [], weekly: [], yearly: [] }
                }
            }
        };

        return mockResponses[endpoint] || {
            success: true,
            data: { message: 'Mock response', endpoint }
        };
    }

    _generateMockForecast(days) {
        const forecast = [];
        const today = new Date();
        let baseValue = 5000 + Math.random() * 2000;

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);

            // Add some variance and trend
            const trend = i * 10;
            const seasonality = Math.sin(i * 0.3) * 500;
            const noise = (Math.random() - 0.5) * 300;

            forecast.push({
                date: date.toISOString().split('T')[0],
                predicted: Math.round(baseValue + trend + seasonality + noise),
                lower_bound: Math.round(baseValue + trend + seasonality - 500),
                upper_bound: Math.round(baseValue + trend + seasonality + 500)
            });
        }

        return forecast;
    }
}

module.exports = new MLService();
