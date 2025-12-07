import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExperimentPDFData {
    name: string;
    algorithm: string;
    task_type: string;
    target_column: string;
    feature_columns: string[];
    metrics?: Record<string, number>;
    feature_importance?: { feature: string; importance: number }[];
    hyperparameters?: Record<string, any>;
    created_at: string;
    completed_at?: string;
    training_duration?: number;
}

export const generateExperimentPDF = (experiment: ExperimentPDFData): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const primaryColor = '#597996';
    const secondaryColor = '#2c6a6b';

    // Header
    doc.setFillColor(89, 121, 150); // #597996
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Elite Finder - ML Analytics', 14, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Experimento', 14, 30);

    // Reset color for body
    doc.setTextColor(30, 41, 59); // slate-800

    let yPos = 55;

    // Experiment Info Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(experiment.name, 14, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`${experiment.algorithm} • ${experiment.task_type}`, 14, yPos);
    yPos += 15;

    // Info Table
    doc.setTextColor(30, 41, 59);
    const infoData = [
        ['Target Column', experiment.target_column],
        ['Features', `${experiment.feature_columns.length} colunas`],
        ['Criado em', formatDate(experiment.created_at)],
        ['Concluído em', experiment.completed_at ? formatDate(experiment.completed_at) : 'N/A'],
        ['Duração', experiment.training_duration ? formatDuration(experiment.training_duration) : 'N/A']
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Informação', 'Valor']],
        body: infoData,
        theme: 'grid',
        headStyles: { fillColor: [89, 121, 150], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold' } },
        margin: { left: 14, right: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Metrics Section
    if (experiment.metrics && Object.keys(experiment.metrics).length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 106, 107); // #2c6a6b
        doc.text('Métricas de Performance', 14, yPos);
        yPos += 8;

        const metricsData = Object.entries(experiment.metrics).map(([key, value]) => [
            formatMetricName(key),
            typeof value === 'number' ? formatMetricValue(key, value) : String(value)
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Métrica', 'Valor']],
            body: metricsData,
            theme: 'striped',
            headStyles: { fillColor: [44, 106, 107], textColor: [255, 255, 255] },
            styles: { fontSize: 10 },
            columnStyles: { 0: { fontStyle: 'bold' } },
            margin: { left: 14, right: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Feature Importance Section
    if (experiment.feature_importance && experiment.feature_importance.length > 0) {
        // Check if we need a new page
        if (yPos > 230) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(89, 121, 150);
        doc.text('Feature Importance', 14, yPos);
        yPos += 8;

        const fiData = experiment.feature_importance
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 10)
            .map((fi, i) => [
                String(i + 1),
                fi.feature,
                `${(fi.importance * 100).toFixed(2)}%`
            ]);

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Feature', 'Importância']],
            body: fiData,
            theme: 'striped',
            headStyles: { fillColor: [89, 121, 150], textColor: [255, 255, 255] },
            styles: { fontSize: 10 },
            columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 30 } },
            margin: { left: 14, right: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Hyperparameters Section
    if (experiment.hyperparameters && Object.keys(experiment.hyperparameters).length > 0) {
        if (yPos > 230) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 106, 107);
        doc.text('Hiperparâmetros', 14, yPos);
        yPos += 8;

        const hpData = Object.entries(experiment.hyperparameters).map(([key, value]) => [
            key,
            String(value)
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Parâmetro', 'Valor']],
            body: hpData,
            theme: 'grid',
            headStyles: { fillColor: [44, 106, 107], textColor: [255, 255, 255] },
            styles: { fontSize: 10 },
            margin: { left: 14, right: 14 }
        });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
            `Gerado em ${new Date().toLocaleString('pt-BR')} • Página ${i} de ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save
    const filename = `experimento_${experiment.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
};

// Helper functions
function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

function formatMetricName(key: string): string {
    const names: Record<string, string> = {
        accuracy: 'Accuracy',
        precision: 'Precision',
        recall: 'Recall',
        f1_score: 'F1 Score',
        r2: 'R² Score',
        rmse: 'RMSE',
        mae: 'MAE',
        mape: 'MAPE',
        roc_auc: 'ROC AUC'
    };
    return names[key] || key;
}

function formatMetricValue(key: string, value: number): string {
    const percentageMetrics = ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc'];
    if (percentageMetrics.includes(key)) {
        return `${(value * 100).toFixed(2)}%`;
    }
    return value.toFixed(4);
}
