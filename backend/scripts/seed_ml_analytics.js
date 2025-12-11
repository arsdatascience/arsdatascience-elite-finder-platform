/**
 * ML Analytics Seed Script
 * Generates synthetic data for all 22 algorithms across 6 industry segments
 * 
 * Run: node scripts/seed_ml_analytics.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { opsPool } = require('../database');

// Helper: Generate random float
const randFloat = (min, max, decimals = 4) =>
    parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Helper: Generate random int
const randInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: Generate time series data
const generateTimeSeries = (periods, baseValue, trend = 0.02, noise = 0.1) => {
    const data = [];
    let value = baseValue;
    for (let i = 0; i < periods; i++) {
        value = value * (1 + trend) + (Math.random() - 0.5) * 2 * noise * baseValue;
        data.push({
            period: i + 1,
            date: new Date(Date.now() - (periods - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: parseFloat(value.toFixed(2))
        });
    }
    return data;
};

// Helper: Generate scatter data
const generateScatterData = (n, slope, intercept, noise = 0.2) => {
    const points = [];
    for (let i = 0; i < n; i++) {
        const x = Math.random() * 100;
        const y = slope * x + intercept + (Math.random() - 0.5) * 2 * noise * 50;
        points.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
    }
    return points;
};

// Helper: Generate confusion matrix
const generateConfusionMatrix = (classes) => {
    const n = classes.length;
    const matrix = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        let remaining = randInt(50, 150);
        for (let j = 0; j < n; j++) {
            if (i === j) {
                const val = randInt(70, 95);
                row.push(val);
            } else {
                const val = randInt(2, 15);
                row.push(val);
            }
        }
        matrix.push(row);
    }
    return { labels: classes, matrix };
};

// Helper: Generate cluster data
const generateClusterData = (nClusters, pointsPerCluster = 50) => {
    const clusters = [];
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    for (let c = 0; c < nClusters; c++) {
        const centerX = Math.random() * 80 + 10;
        const centerY = Math.random() * 80 + 10;

        for (let i = 0; i < pointsPerCluster; i++) {
            clusters.push({
                x: centerX + (Math.random() - 0.5) * 30,
                y: centerY + (Math.random() - 0.5) * 30,
                cluster: c,
                color: colors[c % colors.length]
            });
        }
    }

    return clusters;
};

// Segment-specific metrics
const SEGMENT_METRICS = {
    ecommerce: {
        primary: ['GMV', 'Conversion Rate', 'AOV', 'CAC'],
        values: () => ({ gmv: randFloat(100000, 5000000), conversion: randFloat(1.5, 4.5), aov: randFloat(80, 350), cac: randFloat(15, 80) })
    },
    retail: {
        primary: ['Ticket Médio', 'Vendas/m²', 'Giro Estoque'],
        values: () => ({ ticket: randFloat(45, 180), salesPerM2: randFloat(800, 3500), inventory_turn: randFloat(4, 12) })
    },
    technology: {
        primary: ['MRR', 'Churn', 'ARPU', 'NPS'],
        values: () => ({ mrr: randFloat(50000, 500000), churn: randFloat(1, 8), arpu: randFloat(50, 200), nps: randInt(30, 80) })
    },
    agriculture: {
        primary: ['Produtividade/ha', 'Custo/ha', 'Yield'],
        values: () => ({ productivity: randFloat(50, 120), cost_ha: randFloat(2000, 8000), yield: randFloat(70, 95) })
    },
    automotive: {
        primary: ['Vendas Unid.', 'Ticket Médio', 'Financiamento %'],
        values: () => ({ units: randInt(30, 200), ticket: randFloat(45000, 180000), financing: randFloat(45, 85) })
    },
    aesthetics: {
        primary: ['Recorrência', 'LTV', 'Cancelamentos'],
        values: () => ({ recurrence: randFloat(2.5, 6), ltv: randFloat(1500, 8000), cancellations: randFloat(5, 20) })
    }
};

// Algorithms by type
const ALGORITHMS = {
    regression: [
        'linear_regression', 'ridge_regression', 'lasso_regression', 'elasticnet',
        'random_forest_regressor', 'xgboost_regressor', 'lightgbm_regressor', 'gradient_boosting_regressor'
    ],
    classification: [
        'logistic_regression', 'decision_tree_classifier', 'random_forest_classifier',
        'xgboost_classifier', 'lightgbm_classifier', 'naive_bayes', 'svm_classifier'
    ],
    clustering: ['kmeans', 'dbscan', 'hierarchical'],
    timeseries: ['prophet', 'arima', 'sarima', 'exponential_smoothing']
};

async function seedAnalytics() {
    console.log('🚀 Starting ML Analytics Seed...\n');

    try {
        // Get all segments
        const segmentsResult = await opsPool.query('SELECT * FROM ml_industry_segments');
        const segments = segmentsResult.rows;

        if (segments.length === 0) {
            console.log('❌ No segments found. Run migration 035 first.');
            return;
        }

        console.log(`📊 Found ${segments.length} industry segments\n`);

        for (const segment of segments) {
            console.log(`\n🏭 Processing segment: ${segment.name_pt} (${segment.code})`);
            const metrics = SEGMENT_METRICS[segment.code];

            // === REGRESSION ===
            for (const algo of ALGORITHMS.regression) {
                const r2 = randFloat(0.75, 0.95);
                const rmse = randFloat(5, 50);
                const mae = randFloat(3, 30);

                // Insert segment analytics
                const analyticsResult = await opsPool.query(`
                    INSERT INTO ml_segment_analytics 
                    (segment_id, analysis_type, algorithm, primary_metric_name, primary_metric_value, secondary_metrics, sample_size, chart_data)
                    VALUES ($1, 'regression', $2, 'R²', $3, $4, $5, $6)
                    RETURNING id
                `, [
                    segment.id,
                    algo,
                    r2,
                    JSON.stringify({ rmse, mae, mape: randFloat(5, 20) }),
                    randInt(1000, 50000),
                    JSON.stringify(generateTimeSeries(30, 100, 0.01, 0.15))
                ]);

                // Insert visualization data
                await opsPool.query(`
                    INSERT INTO ml_viz_regression 
                    (segment_analytics_id, scatter_data, residual_plot, coefficient_chart, r2, rmse, mae)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    analyticsResult.rows[0].id,
                    JSON.stringify(generateScatterData(100, 0.8, 10, 0.15)),
                    JSON.stringify(generateScatterData(100, 0, 0, 0.3)),
                    JSON.stringify(metrics.primary.map(name => ({ feature: name, coefficient: randFloat(-2, 2) }))),
                    r2, rmse, mae
                ]);
            }
            console.log(`  ✅ Regression: ${ALGORITHMS.regression.length} algorithms`);

            // === CLASSIFICATION ===
            const classes = ['Positivo', 'Negativo'];
            for (const algo of ALGORITHMS.classification) {
                const accuracy = randFloat(0.78, 0.96);
                const precision = randFloat(0.75, 0.94);
                const recall = randFloat(0.72, 0.92);
                const f1 = 2 * (precision * recall) / (precision + recall);
                const auc = randFloat(0.80, 0.98);

                const analyticsResult = await opsPool.query(`
                    INSERT INTO ml_segment_analytics 
                    (segment_id, analysis_type, algorithm, primary_metric_name, primary_metric_value, secondary_metrics, sample_size)
                    VALUES ($1, 'classification', $2, 'Accuracy', $3, $4, $5)
                    RETURNING id
                `, [
                    segment.id,
                    algo,
                    accuracy,
                    JSON.stringify({ precision, recall, f1, auc }),
                    randInt(2000, 100000)
                ]);

                // ROC curve data
                const rocCurve = [];
                for (let t = 0; t <= 1; t += 0.05) {
                    rocCurve.push({
                        fpr: t,
                        tpr: Math.min(1, t * auc * 1.2 + Math.random() * 0.1)
                    });
                }

                await opsPool.query(`
                    INSERT INTO ml_viz_classification 
                    (segment_analytics_id, confusion_matrix, roc_curve, class_distribution, accuracy, precision_score, recall, f1, auc)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    analyticsResult.rows[0].id,
                    JSON.stringify(generateConfusionMatrix(classes)),
                    JSON.stringify(rocCurve),
                    JSON.stringify(classes.map(c => ({ class: c, count: randInt(500, 5000) }))),
                    accuracy, precision, recall, f1, auc
                ]);
            }
            console.log(`  ✅ Classification: ${ALGORITHMS.classification.length} algorithms`);

            // === CLUSTERING ===
            for (const algo of ALGORITHMS.clustering) {
                const nClusters = randInt(3, 6);
                const silhouette = randFloat(0.45, 0.85);
                const inertia = randFloat(500, 5000);

                const analyticsResult = await opsPool.query(`
                    INSERT INTO ml_segment_analytics 
                    (segment_id, analysis_type, algorithm, primary_metric_name, primary_metric_value, secondary_metrics, sample_size)
                    VALUES ($1, 'clustering', $2, 'Silhouette Score', $3, $4, $5)
                    RETURNING id
                `, [
                    segment.id,
                    algo,
                    silhouette,
                    JSON.stringify({ n_clusters: nClusters, inertia, davies_bouldin: randFloat(0.5, 1.5) }),
                    randInt(5000, 80000)
                ]);

                await opsPool.query(`
                    INSERT INTO ml_viz_clustering 
                    (segment_analytics_id, cluster_scatter, cluster_sizes, n_clusters, silhouette_score, inertia)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    analyticsResult.rows[0].id,
                    JSON.stringify(generateClusterData(nClusters, 50)),
                    JSON.stringify(Array.from({ length: nClusters }, (_, i) => ({ cluster: i, size: randInt(500, 3000), label: `Cluster ${i + 1}` }))),
                    nClusters, silhouette, inertia
                ]);
            }
            console.log(`  ✅ Clustering: ${ALGORITHMS.clustering.length} algorithms`);

            // === TIME SERIES ===
            for (const algo of ALGORITHMS.timeseries) {
                const mape = randFloat(3, 15);
                const rmse = randFloat(50, 500);
                const forecastHorizon = randInt(7, 30);

                const historical = generateTimeSeries(60, 1000, 0.015, 0.1);
                const forecast = generateTimeSeries(forecastHorizon, historical[historical.length - 1].value, 0.02, 0.08);

                const analyticsResult = await opsPool.query(`
                    INSERT INTO ml_segment_analytics 
                    (segment_id, analysis_type, algorithm, primary_metric_name, primary_metric_value, secondary_metrics, sample_size)
                    VALUES ($1, 'timeseries', $2, 'MAPE', $3, $4, $5)
                    RETURNING id
                `, [
                    segment.id,
                    algo,
                    mape,
                    JSON.stringify({ rmse, mae: rmse * 0.7, forecast_horizon: forecastHorizon }),
                    historical.length
                ]);

                await opsPool.query(`
                    INSERT INTO ml_viz_timeseries 
                    (segment_analytics_id, historical_data, forecast_data, mape, rmse, forecast_horizon)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    analyticsResult.rows[0].id,
                    JSON.stringify(historical),
                    JSON.stringify(forecast.map(f => ({
                        ...f,
                        lower: f.value * 0.9,
                        upper: f.value * 1.1
                    }))),
                    mape, rmse, forecastHorizon
                ]);
            }
            console.log(`  ✅ Time Series: ${ALGORITHMS.timeseries.length} algorithms`);
        }

        // Summary
        const totalAnalytics = await opsPool.query('SELECT COUNT(*) FROM ml_segment_analytics');
        console.log(`\n\n✅ Seed Complete!`);
        console.log(`📊 Total analytics records: ${totalAnalytics.rows[0].count}`);
        console.log(`🏭 Segments: ${segments.length}`);
        console.log(`🤖 Algorithms per segment: ${Object.values(ALGORITHMS).flat().length}`);

    } catch (error) {
        console.error('❌ Seed Error:', error);
        throw error;
    } finally {
        await opsPool.end();
    }
}

// Run
seedAnalytics()
    .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
