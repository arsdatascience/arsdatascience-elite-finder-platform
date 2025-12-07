/**
 * ML Response Formatter Service
 * Formats ML analysis results into WhatsApp-friendly messages
 */

class MLResponseFormatter {

    /**
     * Formatar previsão de vendas
     */
    formatSalesForecast(data, clientName) {
        const { predictions, confidence, insights, historical_data } = data;

        if (!predictions || predictions.length === 0) {
            return this.formatError({ message: 'Sem previsões disponíveis' }, 'sales_forecast');
        }

        const totalPredicted = predictions.reduce((a, b) => a + b, 0);
        const avgDaily = totalPredicted / predictions.length;

        let message = `📊 *Previsão de Vendas - ${clientName}*\n\n`;
        message += `*Próximos ${predictions.length} dias:*\n`;
        message += `💰 Total Previsto: R$ ${this.formatCurrency(totalPredicted)}\n`;
        message += `📈 Média Diária: R$ ${this.formatCurrency(avgDaily)}\n`;
        message += `🎯 Confiança: ${(confidence * 100).toFixed(0)}%\n\n`;

        if (insights && insights.length > 0) {
            message += `*Insights Principais:*\n`;
            insights.slice(0, 3).forEach(insight => {
                message += `✅ ${insight}\n`;
            });
        }

        const historyCount = historical_data?.length || 365;
        message += `\n_Análise gerada por IA com base em ${historyCount} dias de histórico._`;

        return message;
    }

    /**
     * Formatar análise Instagram
     */
    formatInstagramAnalysis(data, clientName) {
        const { summary, growth, period } = data;

        if (!summary) {
            return this.formatError({ message: 'Sem dados de Instagram' }, 'instagram_analysis');
        }

        let message = `📱 *Análise Instagram - ${clientName}*\n\n`;
        message += `*Últimos ${period} dias:*\n\n`;

        message += `*Audiência:*\n`;
        const followersGain = summary.followers_gain || 0;
        message += `👥 ${followersGain > 0 ? '+' : ''}${this.formatNumber(followersGain)} seguidores (${growth?.followers || 0}%)\n`;
        message += `👀 ${this.formatNumber(summary.total_reach || 0)} alcance\n\n`;

        message += `*Engajamento:*\n`;
        message += `❤️ Taxa: ${((summary.avg_engagement_rate || 0) * 100).toFixed(1)}%\n`;
        message += `💬 ${this.formatNumber(summary.total_comments || 0)} comentários\n`;
        message += `📤 ${this.formatNumber(summary.total_shares || 0)} compartilhamentos\n`;
        message += `💾 ${this.formatNumber(summary.total_saves || 0)} salvamentos\n\n`;

        message += `*Conteúdo:*\n`;
        message += `🎬 Reels: ${this.formatNumber(summary.reels_views || 0)} views\n`;
        message += `📖 Stories: ${this.formatNumber(summary.stories_reach || 0)} alcance\n\n`;

        message += `💡 *Recomendação:* Continue focando em Reels para maximizar alcance!`;

        return message;
    }

    /**
     * Formatar análise TikTok
     */
    formatTiktokAnalysis(data, clientName) {
        const { summary, period } = data;

        if (!summary) {
            return this.formatError({ message: 'Sem dados de TikTok' }, 'tiktok_analysis');
        }

        let message = `🎵 *Análise TikTok - ${clientName}*\n\n`;
        message += `*Últimos ${period} dias:*\n\n`;

        message += `*Performance:*\n`;
        message += `👀 ${this.formatNumber(summary.total_views || 0)} visualizações\n`;
        message += `❤️ ${this.formatNumber(summary.total_likes || 0)} curtidas\n`;
        message += `💬 ${this.formatNumber(summary.total_comments || 0)} comentários\n`;
        message += `📤 ${this.formatNumber(summary.total_shares || 0)} compartilhamentos\n\n`;

        message += `*Crescimento:*\n`;
        const followersGain = summary.followers_gain || 0;
        message += `👥 ${followersGain > 0 ? '+' : ''}${this.formatNumber(followersGain)} seguidores\n`;
        message += `📊 Taxa de Engajamento: ${((summary.avg_engagement_rate || 0) * 100).toFixed(1)}%\n\n`;

        message += `💡 *Dica:* Poste nos horários de pico (12h e 19h) para mais alcance!`;

        return message;
    }

    /**
     * Formatar detecção de anomalias
     */
    formatAnomalyDetection(data, clientName) {
        const { anomalies, insights } = data;

        let message = `🚨 *Detecção de Anomalias - ${clientName}*\n\n`;

        if (!anomalies || anomalies.length === 0) {
            message += `✅ Nenhuma anomalia detectada!\n`;
            message += `Suas métricas estão dentro do esperado.\n\n`;
            message += `Continue monitorando para manter a estabilidade.`;
            return message;
        }

        message += `*Anomalias Identificadas:*\n\n`;

        anomalies.slice(0, 5).forEach((anomaly, index) => {
            message += `${index + 1}. *${anomaly.metric || 'Métrica'}*\n`;
            if (anomaly.date) message += `   📅 Data: ${anomaly.date}\n`;
            if (anomaly.deviation) message += `   📊 Variação: ${anomaly.deviation}%\n`;
            if (anomaly.severity) message += `   ⚠️ Severidade: ${anomaly.severity}\n`;
            message += `\n`;
        });

        if (insights && insights.length > 0) {
            message += `*Possíveis Causas:*\n`;
            insights.forEach(insight => {
                message += `⚠️ ${insight}\n`;
            });
        }

        return message;
    }

    /**
     * Formatar dashboard summary
     */
    formatDashboardSummary(data, clientName) {
        const { summary, period } = data;

        if (!summary) {
            return this.formatError({ message: 'Sem dados disponíveis' }, 'dashboard_summary');
        }

        let message = `📊 *Resumo Executivo - ${clientName}*\n\n`;
        message += `*Período: ${period}*\n\n`;

        message += `💰 *Vendas:*\n`;
        message += `• Total: R$ ${this.formatCurrency(summary.total_revenue || 0)}\n`;
        message += `• Pedidos: ${this.formatNumber(summary.total_orders || 0)}\n\n`;

        message += `📈 *Tráfego:*\n`;
        message += `• Visitas: ${this.formatNumber(summary.total_visits || 0)}\n`;
        message += `• Conversão: ${((summary.avg_conversion || 0) * 100).toFixed(2)}%\n\n`;

        message += `📱 *Social:*\n`;
        const igGain = summary.instagram_followers_gain || 0;
        message += `• Instagram: ${igGain > 0 ? '+' : ''}${igGain} seguidores\n`;
        message += `• TikTok: ${this.formatNumber(summary.tiktok_views || 0)} views\n`;

        return message;
    }

    /**
     * Formatar ROI de Marketing
     */
    formatMarketingROI(data, clientName) {
        const { metrics, period } = data;

        if (!metrics) {
            return this.formatError({ message: 'Sem dados de marketing' }, 'marketing_roi');
        }

        let message = `💵 *ROI de Marketing - ${clientName}*\n\n`;
        message += `*Período: ${period}*\n\n`;

        message += `*Investimento:*\n`;
        message += `• Gasto Total: R$ ${this.formatCurrency(metrics.total_spend || 0)}\n`;
        message += `• Receita Gerada: R$ ${this.formatCurrency(metrics.total_revenue || 0)}\n\n`;

        message += `*Indicadores:*\n`;
        message += `📊 ROI: ${metrics.roi || 0}%\n`;
        message += `💰 ROAS: ${metrics.roas || 0}x\n`;
        message += `👤 CAC: R$ ${this.formatCurrency(metrics.cac || 0)}\n\n`;

        const roi = Number(metrics.roi) || 0;
        if (roi > 100) {
            message += `✅ *Excelente!* Seu ROI está acima de 100%!`;
        } else if (roi > 0) {
            message += `👍 *Bom!* Você está lucrando, mas há espaço para otimização.`;
        } else {
            message += `⚠️ *Atenção!* Seu ROI está negativo. Revise suas campanhas.`;
        }

        return message;
    }

    /**
     * Formatar segmentação de clientes
     */
    formatCustomerSegmentation(data, clientName) {
        const { segments, insights } = data;

        let message = `👥 *Segmentação de Clientes - ${clientName}*\n\n`;

        if (!segments || segments.length === 0) {
            message += `Ainda não há dados suficientes para segmentação.\n`;
            message += `Continue alimentando os dados de clientes!`;
            return message;
        }

        message += `*Segmentos Identificados:*\n\n`;

        segments.forEach((segment, index) => {
            message += `${index + 1}. *${segment.name || `Cluster ${index + 1}`}*\n`;
            if (segment.count) message += `   👤 ${segment.count} clientes\n`;
            if (segment.revenue) message += `   💰 Ticket Médio: R$ ${this.formatCurrency(segment.revenue)}\n`;
            if (segment.description) message += `   📝 ${segment.description}\n`;
            message += `\n`;
        });

        if (insights && insights.length > 0) {
            message += `*Recomendações:*\n`;
            insights.forEach(insight => {
                message += `💡 ${insight}\n`;
            });
        }

        return message;
    }

    /**
     * Formatar predição de churn
     */
    formatChurnPrediction(data, clientName) {
        const { predictions, insights } = data;

        let message = `⚠️ *Risco de Churn - ${clientName}*\n\n`;

        if (!predictions || predictions.length === 0) {
            message += `✅ Nenhum cliente em risco alto identificado!\n`;
            return message;
        }

        message += `*Clientes em Risco:*\n\n`;

        predictions.slice(0, 5).forEach((pred, index) => {
            message += `${index + 1}. *${pred.customer_name || 'Cliente'}*\n`;
            message += `   📊 Risco: ${(pred.churn_probability * 100).toFixed(0)}%\n`;
            if (pred.reason) message += `   📝 Motivo: ${pred.reason}\n`;
            message += `\n`;
        });

        if (insights && insights.length > 0) {
            message += `*Ações Recomendadas:*\n`;
            insights.forEach(insight => {
                message += `✅ ${insight}\n`;
            });
        }

        return message;
    }

    /**
     * Formatar erro
     */
    formatError(error, intent) {
        let message = `❌ *Ops! Algo deu errado*\n\n`;

        const errorMsg = error?.message || String(error);

        if (errorMsg.includes('insuficientes') || errorMsg.includes('insuficiente')) {
            message += `Você ainda não tem dados suficientes para esta análise.\n\n`;
            message += `💡 Continue alimentando suas métricas e tente novamente em breve!`;
        } else if (errorMsg.includes('não encontrad')) {
            message += `Não consegui localizar seus dados.\n\n`;
            message += `Você já está cadastrado no sistema?`;
        } else if (errorMsg.includes('ML') || errorMsg.includes('conexão')) {
            message += `O serviço de análise está temporariamente indisponível.\n\n`;
            message += `Por favor, tente novamente em alguns instantes.`;
        } else {
            message += `Tive um problema ao processar sua solicitação.\n\n`;
            message += `_Erro: ${errorMsg}_\n\n`;
            message += `Por favor, tente novamente em alguns instantes.`;
        }

        return message;
    }

    /**
     * Formatar resposta genérica quando intent não é suportado
     */
    formatUnsupportedIntent(intent) {
        return `🤔 Desculpe, ainda não consigo fazer análise de "${intent}".\n\n` +
            `*Análises disponíveis:*\n` +
            `• Previsão de vendas\n` +
            `• Análise de Instagram/TikTok\n` +
            `• Detecção de anomalias\n` +
            `• Resumo do dashboard\n` +
            `• ROI de marketing\n` +
            `• Segmentação de clientes\n` +
            `• Risco de churn\n\n` +
            `Experimente perguntar de outra forma!`;
    }

    // ==================== Helpers ====================

    formatCurrency(value) {
        const num = Number(value) || 0;
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    formatNumber(value) {
        const num = Number(value) || 0;
        return new Intl.NumberFormat('pt-BR').format(num);
    }
}

module.exports = new MLResponseFormatter();
