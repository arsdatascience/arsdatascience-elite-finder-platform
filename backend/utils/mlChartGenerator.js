/**
 * ML Chart Generator Utility
 * Generates chart configurations and data for ML analysis visualizations
 */

/**
 * Color palettes for different chart types
 */
const chartColors = {
    primary: {
        main: '#3B82F6', // blue-500
        light: 'rgba(59, 130, 246, 0.2)',
        gradient: ['#3B82F6', '#60A5FA']
    },
    success: {
        main: '#10B981', // emerald-500
        light: 'rgba(16, 185, 129, 0.2)',
        gradient: ['#10B981', '#34D399']
    },
    warning: {
        main: '#F59E0B', // amber-500
        light: 'rgba(245, 158, 11, 0.2)',
        gradient: ['#F59E0B', '#FCD34D']
    },
    danger: {
        main: '#EF4444', // red-500
        light: 'rgba(239, 68, 68, 0.2)',
        gradient: ['#EF4444', '#F87171']
    },
    purple: {
        main: '#8B5CF6', // violet-500
        light: 'rgba(139, 92, 246, 0.2)',
        gradient: ['#8B5CF6', '#A78BFA']
    },
    pink: {
        main: '#EC4899', // pink-500
        light: 'rgba(236, 72, 153, 0.2)',
        gradient: ['#EC4899', '#F472B6']
    }
};

/**
 * Generate line chart config for time series data
 */
function generateLineChart(data, options = {}) {
    const {
        title = 'Trend Analysis',
        xLabel = 'Date',
        yLabel = 'Value',
        colorScheme = 'primary',
        showArea = true
    } = options;

    const colors = chartColors[colorScheme] || chartColors.primary;

    return {
        type: 'line',
        data: {
            labels: data.map(d => formatDate(d.date)),
            datasets: [{
                label: title,
                data: data.map(d => d.value),
                borderColor: colors.main,
                backgroundColor: showArea ? colors.light : 'transparent',
                fill: showArea,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: colors.main
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: title }
            },
            scales: {
                x: { title: { display: true, text: xLabel } },
                y: { title: { display: true, text: yLabel }, beginAtZero: true }
            }
        }
    };
}

/**
 * Generate bar chart config for comparison data
 */
function generateBarChart(data, options = {}) {
    const {
        title = 'Comparison',
        xLabel = 'Category',
        yLabel = 'Value',
        colorScheme = 'primary',
        horizontal = false
    } = options;

    const colors = chartColors[colorScheme] || chartColors.primary;

    return {
        type: horizontal ? 'bar' : 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                label: title,
                data: data.map(d => d.value),
                backgroundColor: colors.main,
                borderColor: colors.main,
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            indexAxis: horizontal ? 'y' : 'x',
            plugins: {
                legend: { display: false },
                title: { display: true, text: title }
            },
            scales: {
                x: { title: { display: true, text: horizontal ? yLabel : xLabel } },
                y: { title: { display: true, text: horizontal ? xLabel : yLabel }, beginAtZero: true }
            }
        }
    };
}

/**
 * Generate pie/doughnut chart for distribution data
 */
function generatePieChart(data, options = {}) {
    const {
        title = 'Distribution',
        type = 'doughnut',
        showPercentages = true
    } = options;

    const colors = [
        chartColors.primary.main,
        chartColors.success.main,
        chartColors.warning.main,
        chartColors.danger.main,
        chartColors.purple.main,
        chartColors.pink.main
    ];

    return {
        type,
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                data: data.map(d => d.value),
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                title: { display: true, text: title },
                tooltip: {
                    callbacks: {
                        label: showPercentages ? (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((ctx.raw / total) * 100).toFixed(1);
                            return `${ctx.label}: ${ctx.raw} (${percentage}%)`;
                        } : undefined
                    }
                }
            }
        }
    };
}

/**
 * Generate multi-line chart for comparing multiple metrics
 */
function generateMultiLineChart(datasets, labels, options = {}) {
    const {
        title = 'Multi-Metric Comparison',
        xLabel = 'Date',
        yLabel = 'Value'
    } = options;

    const colorKeys = Object.keys(chartColors);

    return {
        type: 'line',
        data: {
            labels,
            datasets: datasets.map((dataset, index) => {
                const colorKey = colorKeys[index % colorKeys.length];
                const colors = chartColors[colorKey];
                return {
                    label: dataset.label,
                    data: dataset.values,
                    borderColor: colors.main,
                    backgroundColor: colors.light,
                    fill: false,
                    tension: 0.4,
                    borderWidth: 2
                };
            })
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: title }
            },
            scales: {
                x: { title: { display: true, text: xLabel } },
                y: { title: { display: true, text: yLabel }, beginAtZero: true }
            }
        }
    };
}

/**
 * Generate sales forecast chart with prediction line
 */
function generateForecastChart(historicalData, predictions, options = {}) {
    const {
        title = 'Sales Forecast',
        historicalLabel = 'Historical',
        forecastLabel = 'Forecast'
    } = options;

    const allLabels = [
        ...historicalData.map(d => formatDate(d.date)),
        ...predictions.map((_, i) => `Day +${i + 1}`)
    ];

    return {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                {
                    label: historicalLabel,
                    data: [...historicalData.map(d => d.value), ...Array(predictions.length).fill(null)],
                    borderColor: chartColors.primary.main,
                    backgroundColor: chartColors.primary.light,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: forecastLabel,
                    data: [...Array(historicalData.length).fill(null), ...predictions],
                    borderColor: chartColors.success.main,
                    borderDash: [5, 5],
                    backgroundColor: chartColors.success.light,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: title },
                annotation: {
                    annotations: {
                        forecastLine: {
                            type: 'line',
                            xMin: historicalData.length - 0.5,
                            xMax: historicalData.length - 0.5,
                            borderColor: '#9CA3AF',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: { content: 'Today', enabled: true }
                        }
                    }
                }
            }
        }
    };
}

/**
 * Generate gauge chart for metrics (0-100)
 */
function generateGaugeData(value, options = {}) {
    const {
        title = 'Score',
        thresholds = { low: 30, medium: 70 }
    } = options;

    let colorScheme = 'success';
    if (value < thresholds.low) colorScheme = 'danger';
    else if (value < thresholds.medium) colorScheme = 'warning';

    return {
        value,
        percentage: Math.min(100, Math.max(0, value)),
        color: chartColors[colorScheme].main,
        label: title,
        status: value < thresholds.low ? 'low' : value < thresholds.medium ? 'medium' : 'high'
    };
}

/**
 * Generate heatmap data for weekly patterns
 */
function generateWeeklyHeatmap(data, options = {}) {
    const {
        metricName = 'Value'
    } = options;

    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    // Initialize heatmap matrix
    const matrix = days.map(() => hours.map(() => 0));

    // Fill with data
    data.forEach(item => {
        const date = new Date(item.date);
        const day = date.getDay();
        const hour = date.getHours();
        matrix[day][hour] += item.value || 1;
    });

    return {
        days,
        hours,
        matrix,
        metricName,
        maxValue: Math.max(...matrix.flat())
    };
}

/**
 * Format date for chart labels
 */
function formatDate(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Format currency for chart tooltips
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Format number with abbreviation (1K, 1M, etc)
 */
function formatNumber(value) {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
}

/**
 * Generate chart data from ML analysis result
 */
function generateChartFromAnalysis(analysisType, data) {
    switch (analysisType) {
        case 'sales_forecast':
            return generateForecastChart(
                data.historical_data || [],
                data.predictions || [],
                { title: 'Previsão de Vendas' }
            );

        case 'instagram_analysis':
            return generateMultiLineChart(
                [
                    { label: 'Alcance', values: data.chart_data?.map(d => d.reach) || [] },
                    { label: 'Engajamento', values: data.chart_data?.map(d => d.engagement) || [] }
                ],
                data.chart_data?.map(d => formatDate(d.date)) || [],
                { title: 'Performance Instagram' }
            );

        case 'customer_segmentation':
            return generatePieChart(
                (data.segments || []).map(s => ({ label: s.name, value: s.count })),
                { title: 'Segmentação de Clientes' }
            );

        case 'marketing_roi':
            return generateBarChart(
                [
                    { label: 'Investimento', value: data.metrics?.total_spend || 0 },
                    { label: 'Receita', value: data.metrics?.total_revenue || 0 },
                    { label: 'Lucro', value: (data.metrics?.total_revenue || 0) - (data.metrics?.total_spend || 0) }
                ],
                { title: 'ROI de Marketing', colorScheme: 'success' }
            );

        default:
            return null;
    }
}

module.exports = {
    // Chart generators
    generateLineChart,
    generateBarChart,
    generatePieChart,
    generateMultiLineChart,
    generateForecastChart,
    generateGaugeData,
    generateWeeklyHeatmap,
    generateChartFromAnalysis,

    // Utilities
    formatDate,
    formatCurrency,
    formatNumber,

    // Colors
    chartColors
};
