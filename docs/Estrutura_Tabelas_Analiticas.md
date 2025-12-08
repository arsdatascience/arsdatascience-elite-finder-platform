# 📊 Estrutura de Tabelas Analíticas e ML

> Documentação completa das tabelas de análise de dados, Machine Learning e Customer Journey do sistema Elite Finder.

---

## 📑 Índice

1. [Tabelas Core ML](#1-tabelas-core-ml)
2. [Tabelas de Resultados por Tipo de Modelo](#2-tabelas-de-resultados-por-tipo-de-modelo)
3. [Tabelas de Analytics por Domínio](#3-tabelas-de-analytics-por-domínio)
4. [Tabelas de Visualização](#4-tabelas-de-visualização)
5. [Tabelas de Configuração de Algoritmos](#5-tabelas-de-configuração-de-algoritmos)
6. [Tabelas de Customer Journey (Omnichannel)](#6-tabelas-de-customer-journey-omnichannel)
7. [Tabelas de Segmentos de Indústria](#7-tabelas-de-segmentos-de-indústria)

---

## 1. Tabelas Core ML

### `ml_datasets`
Armazena metadados dos datasets carregados para análise.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `tenant_id` | UUID | ID do tenant |
| `name` | VARCHAR(255) | Nome do dataset |
| `original_filename` | VARCHAR(255) | Nome do arquivo original |
| `file_path` | VARCHAR(500) | Caminho do arquivo |
| `file_size` | BIGINT | Tamanho em bytes |
| `row_count` | INTEGER | Número de linhas |
| `column_count` | INTEGER | Número de colunas |
| `columns` | JSONB | Definição das colunas |
| `statistics` | JSONB | Estatísticas descritivas |
| `market_area` | VARCHAR(100) | Área: sales, marketing, customers, finance |
| `created_by` | UUID | Usuário que criou |
| `created_at` | TIMESTAMP | Data de criação |

---

### `ml_experiments`
Registra experimentos/modelos treinados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `tenant_id` | UUID | ID do tenant |
| `name` | VARCHAR(255) | Nome do experimento |
| `dataset_id` | UUID | Referência ao dataset |
| `algorithm` | VARCHAR(100) | Algoritmo utilizado |
| `task_type` | VARCHAR(50) | Tipo: regression, classification, etc |
| `status` | VARCHAR(50) | Status: pending, running, completed, failed |
| `target_column` | VARCHAR(100) | Coluna alvo |
| `feature_columns` | JSONB | Colunas de features |
| `hyperparameters` | JSONB | Configuração de hyperparâmetros |
| `preset` | VARCHAR(50) | Preset: fast, balanced, accurate |
| `metrics` | JSONB | Métricas de performance |
| `feature_importance` | JSONB | Importância das features |
| `predictions_sample` | JSONB | Amostra de previsões |
| `confusion_matrix` | JSONB | Matriz de confusão |
| `training_duration` | INTEGER | Duração do treino (ms) |
| `model_path` | VARCHAR(500) | Caminho do modelo salvo |
| `is_deployed` | BOOLEAN | Se está em produção |
| `market_area` | VARCHAR(100) | Área de negócio |

---

### `ml_predictions`
Armazena previsões geradas pelos modelos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `tenant_id` | UUID | ID do tenant |
| `experiment_id` | UUID | Referência ao experimento |
| `input_data` | JSONB | Dados de entrada |
| `predictions` | JSONB | Previsões geradas |
| `confidence` | FLOAT | Nível de confiança |
| `created_at` | TIMESTAMP | Data de criação |

---

## 2. Tabelas de Resultados por Tipo de Modelo

### `ml_regression_results`
Resultados de modelos de regressão.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `experiment_id` | UUID | Referência ao experimento |
| `r2_score` | FLOAT | Coeficiente de determinação R² |
| `rmse` | FLOAT | Root Mean Squared Error |
| `mae` | FLOAT | Mean Absolute Error |
| `mape` | FLOAT | Mean Absolute Percentage Error |
| `mse` | FLOAT | Mean Squared Error |
| `adjusted_r2` | FLOAT | R² ajustado |
| `residuals` | JSONB | Resíduos do modelo |
| `predicted_vs_actual` | JSONB | Comparação previsto x real |
| `coefficients` | JSONB | Coeficientes do modelo |
| `intercept` | FLOAT | Intercepto |

---

### `ml_classification_results`
Resultados de modelos de classificação.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `experiment_id` | UUID | Referência ao experimento |
| `accuracy` | FLOAT | Acurácia do modelo |
| `precision_score` | FLOAT | Precisão |
| `recall` | FLOAT | Recall/Sensibilidade |
| `f1_score` | FLOAT | F1-Score |
| `roc_auc` | FLOAT | Área sob curva ROC |
| `confusion_matrix` | JSONB | Matriz de confusão |
| `classification_report` | JSONB | Relatório completo |
| `roc_curve` | JSONB | Dados da curva ROC |
| `precision_recall_curve` | JSONB | Curva Precision-Recall |
| `class_distribution` | JSONB | Distribuição das classes |

---

### `ml_clustering_results`
Resultados de modelos de clusterização.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `experiment_id` | UUID | Referência ao experimento |
| `silhouette_score` | FLOAT | Score de silhueta |
| `davies_bouldin_index` | FLOAT | Índice Davies-Bouldin |
| `calinski_harabasz_score` | FLOAT | Score Calinski-Harabasz |
| `n_clusters` | INTEGER | Número de clusters |
| `cluster_centers` | JSONB | Centróides dos clusters |
| `cluster_sizes` | JSONB | Tamanho de cada cluster |
| `cluster_labels` | JSONB | Labels dos clusters |
| `inertia` | FLOAT | Inércia (K-Means) |

---

### `ml_timeseries_results`
Resultados de modelos de séries temporais.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `experiment_id` | UUID | Referência ao experimento |
| `mape` | FLOAT | Mean Absolute Percentage Error |
| `rmse` | FLOAT | Root Mean Squared Error |
| `mae` | FLOAT | Mean Absolute Error |
| `forecast_values` | JSONB | Valores previstos |
| `trend` | JSONB | Componente de tendência |
| `seasonality` | JSONB | Componente sazonal |
| `residuals` | JSONB | Resíduos |
| `confidence_intervals` | JSONB | Intervalos de confiança |
| `forecast_horizon` | INTEGER | Horizonte de previsão |

---

## 3. Tabelas de Analytics por Domínio

### `ml_sales_analytics`
Analytics de vendas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `experiment_id` | UUID | Referência ao experimento |
| `period` | VARCHAR(50) | Período analisado |
| `total_sales` | DECIMAL(15,2) | Total de vendas |
| `predicted_sales` | DECIMAL(15,2) | Vendas previstas |
| `growth_rate` | FLOAT | Taxa de crescimento |
| `conversion_rate` | FLOAT | Taxa de conversão |
| `avg_ticket` | DECIMAL(10,2) | Ticket médio |
| `top_products` | JSONB | Produtos mais vendidos |
| `sales_by_region` | JSONB | Vendas por região |
| `sales_trend` | JSONB | Tendência de vendas |
| `seasonality_index` | JSONB | Índice de sazonalidade |

---

### `ml_marketing_analytics`
Analytics de marketing.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `experiment_id` | UUID | Referência ao experimento |
| `campaign_name` | VARCHAR(255) | Nome da campanha |
| `roi` | FLOAT | Return on Investment |
| `cac` | DECIMAL(10,2) | Customer Acquisition Cost |
| `cpl` | DECIMAL(10,2) | Cost per Lead |
| `ctr` | FLOAT | Click-through Rate |
| `conversion_rate` | FLOAT | Taxa de conversão |
| `impressions` | BIGINT | Total de impressões |
| `clicks` | BIGINT | Total de cliques |
| `leads` | INTEGER | Total de leads |
| `channel_performance` | JSONB | Performance por canal |
| `audience_segments` | JSONB | Segmentos de audiência |
| `predicted_roi` | FLOAT | ROI previsto |

---

### `ml_customer_analytics`
Analytics de clientes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `experiment_id` | UUID | Referência ao experimento |
| `total_customers` | INTEGER | Total de clientes |
| `new_customers` | INTEGER | Novos clientes |
| `churned_customers` | INTEGER | Clientes perdidos |
| `churn_rate` | FLOAT | Taxa de churn |
| `clv` | DECIMAL(10,2) | Customer Lifetime Value |
| `retention_rate` | FLOAT | Taxa de retenção |
| `nps_score` | FLOAT | Net Promoter Score |
| `customer_segments` | JSONB | Segmentos de clientes |
| `rfm_analysis` | JSONB | Análise RFM |
| `churn_risk_distribution` | JSONB | Distribuição de risco |
| `predicted_churn` | JSONB | Previsão de churn |

---

### `ml_financial_analytics`
Analytics financeiras.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `experiment_id` | UUID | Referência ao experimento |
| `period` | VARCHAR(50) | Período analisado |
| `revenue` | DECIMAL(15,2) | Receita total |
| `expenses` | DECIMAL(15,2) | Despesas totais |
| `profit` | DECIMAL(15,2) | Lucro |
| `profit_margin` | FLOAT | Margem de lucro |
| `cashflow` | DECIMAL(15,2) | Fluxo de caixa |
| `predicted_revenue` | DECIMAL(15,2) | Receita prevista |
| `revenue_trend` | JSONB | Tendência de receita |
| `expense_breakdown` | JSONB | Breakdown de despesas |
| `financial_forecast` | JSONB | Projeção financeira |

---

## 4. Tabelas de Visualização

### `ml_viz_regression`
Dados de visualização para regressão.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `segment_analytics_id` | UUID | Referência à análise |
| `scatter_data` | JSONB | Pontos actual vs predicted |
| `residual_plot` | JSONB | Distribuição de resíduos |
| `coefficient_chart` | JSONB | Gráfico de coeficientes |
| `trend_line` | JSONB | Linha de tendência |
| `r2` | FLOAT | R² Score |
| `rmse` | FLOAT | RMSE |
| `mae` | FLOAT | MAE |

---

### `ml_viz_classification`
Dados de visualização para classificação.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `segment_analytics_id` | UUID | Referência à análise |
| `confusion_matrix` | JSONB | Dados para heatmap |
| `roc_curve` | JSONB | Pontos da curva ROC |
| `pr_curve` | JSONB | Curva Precision-Recall |
| `class_distribution` | JSONB | Dados para bar chart |
| `accuracy` | FLOAT | Acurácia |
| `precision_score` | FLOAT | Precisão |
| `recall` | FLOAT | Recall |
| `f1` | FLOAT | F1 Score |
| `auc` | FLOAT | AUC |

---

### `ml_viz_clustering`
Dados de visualização para clustering.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `segment_analytics_id` | UUID | Referência à análise |
| `cluster_scatter` | JSONB | Projeção 2D dos clusters |
| `cluster_sizes` | JSONB | Tamanhos (pie/bar) |
| `centroid_radar` | JSONB | Radar para centróides |
| `elbow_plot` | JSONB | Método do cotovelo |
| `n_clusters` | INTEGER | Número de clusters |
| `silhouette_score` | FLOAT | Silhueta |
| `inertia` | FLOAT | Inércia |

---

### `ml_viz_timeseries`
Dados de visualização para séries temporais.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `segment_analytics_id` | UUID | Referência à análise |
| `historical_data` | JSONB | Dados históricos |
| `forecast_data` | JSONB | Previsão com bandas |
| `seasonality_chart` | JSONB | Decomposição sazonal |
| `trend_chart` | JSONB | Componente de tendência |
| `mape` | FLOAT | MAPE |
| `rmse` | FLOAT | RMSE |
| `forecast_horizon` | INTEGER | Horizonte |

---

## 5. Tabelas de Configuração de Algoritmos

### `ml_algorithm_configs` (User Configs)
Configurações de algoritmos salvas pelo usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `tenant_id` | UUID | ID do tenant |
| `algorithm_id` | VARCHAR(100) | ID do algoritmo |
| `algorithm_name` | VARCHAR(200) | Nome do algoritmo |
| `algorithm_category` | VARCHAR(50) | Categoria: regression, classification, etc |
| `config` | JSONB | Hyperparâmetros configurados |
| `preset_name` | VARCHAR(50) | Preset: fast, balanced, accurate, custom |
| `is_default` | BOOLEAN | Se é a configuração padrão |
| `is_active` | BOOLEAN | Se está ativa |
| `description` | TEXT | Descrição da configuração |
| `created_by` | UUID | Usuário que criou |

---

### `ml_prophet_holidays`
Feriados brasileiros para o Prophet.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `tenant_id` | UUID | ID do tenant (NULL = global) |
| `holiday_name` | VARCHAR(100) | Nome do feriado |
| `holiday_date` | DATE | Data do feriado |
| `lower_window` | INT | Dias antes com efeito |
| `upper_window` | INT | Dias depois com efeito |
| `is_recurring` | BOOLEAN | Se é anual |

**Feriados pré-cadastrados:**
- Ano Novo, Carnaval, Páscoa, Tiradentes
- Dia do Trabalho, Dia das Mães, Dia dos Namorados
- Dia dos Pais, Independência, Nossa Senhora Aparecida
- Dia das Crianças, Finados, Proclamação da República
- Black Friday, Natal, Reveillon

---

### `ml_algorithm_config_history`
Histórico de alterações em configurações.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `config_id` | UUID | Referência à configuração |
| `previous_config` | JSONB | Configuração anterior |
| `new_config` | JSONB | Nova configuração |
| `changed_by` | UUID | Usuário que alterou |
| `changed_at` | TIMESTAMPTZ | Data/hora da alteração |

---

## 6. Tabelas de Customer Journey (Omnichannel)

### `unified_customers`
Hub central de dados do cliente (CDP Core).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `tenant_id` | INTEGER | ID do tenant |
| `client_id` | INTEGER | Link para clients(id) |
| `email` | VARCHAR(255) | Email do cliente |
| `phone` | VARCHAR(50) | Telefone |
| `whatsapp_number` | VARCHAR(50) | Número do WhatsApp |
| `name` | VARCHAR(255) | Nome completo |
| `facebook_id` | VARCHAR(100) | ID do Facebook |
| `instagram_id` | VARCHAR(100) | ID do Instagram |
| `google_id` | VARCHAR(100) | ID do Google |
| `linkedin_id` | VARCHAR(100) | ID do LinkedIn |
| `tiktok_id` | VARCHAR(100) | ID do TikTok |
| `preferred_channel` | VARCHAR(50) | Canal preferido |
| `communication_frequency` | VARCHAR(20) | Frequência: low, medium, high |
| `best_contact_time` | VARCHAR(50) | Melhor horário |
| `current_stage` | VARCHAR(50) | Estágio: awareness, consideration, decision, retention |
| `last_channel` | VARCHAR(50) | Último canal usado |
| `last_interaction` | TIMESTAMP | Última interação |
| `total_touchpoints` | INTEGER | Total de touchpoints |
| `channel_mix` | JSONB | Mix de canais (%) |
| `lifetime_value` | DECIMAL(12,2) | LTV |
| `avg_order_value` | DECIMAL(12,2) | Ticket médio |
| `purchase_count` | INTEGER | Número de compras |
| `tags` | TEXT[] | Tags do cliente |
| `segments` | TEXT[] | Segmentos |
| `cart_items` | JSONB | Itens no carrinho |
| `cart_value` | DECIMAL(12,2) | Valor do carrinho |

---

### `identity_graph`
Resolução de identidade cross-channel.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL | Identificador único |
| `customer_id` | UUID | Referência ao cliente unificado |
| `identifier_type` | VARCHAR(50) | Tipo: email, phone, facebook_id, cookie_id |
| `identifier_value` | VARCHAR(255) | Valor do identificador |
| `confidence_score` | DECIMAL(3,2) | Score de confiança (0-1) |
| `source_channel` | VARCHAR(50) | Canal de origem |
| `is_verified` | BOOLEAN | Se foi verificado |
| `verified_at` | TIMESTAMP | Data de verificação |

---

### `customer_interactions`
Log de eventos/touchpoints do cliente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL | Identificador único |
| `customer_id` | UUID | Referência ao cliente |
| `tenant_id` | INTEGER | ID do tenant |
| `channel` | VARCHAR(50) | Canal: email, whatsapp, instagram, website |
| `interaction_type` | VARCHAR(50) | Tipo: view, click, message, purchase |
| `campaign_id` | INTEGER | ID da campanha |
| `session_id` | VARCHAR(100) | ID da sessão |
| `device_type` | VARCHAR(50) | Tipo de device |
| `content_summary` | TEXT | Resumo da interação |
| `metadata` | JSONB | Dados adicionais |
| `utm_source` | VARCHAR(100) | UTM Source |
| `utm_medium` | VARCHAR(100) | UTM Medium |
| `utm_campaign` | VARCHAR(100) | UTM Campaign |
| `utm_content` | VARCHAR(100) | UTM Content |
| `referrer` | VARCHAR(500) | Referrer |

---

### `customer_journeys`
Sequências de automação ativas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL | Identificador único |
| `customer_id` | UUID | Referência ao cliente |
| `tenant_id` | INTEGER | ID do tenant |
| `journey_type` | VARCHAR(100) | Tipo: abandoned_cart, onboarding, reactivation |
| `journey_name` | VARCHAR(255) | Nome da jornada |
| `current_step` | INTEGER | Passo atual |
| `total_steps` | INTEGER | Total de passos |
| `status` | VARCHAR(50) | Status: active, paused, completed |
| `next_action_channel` | VARCHAR(50) | Canal da próxima ação |
| `next_action_type` | VARCHAR(50) | Tipo da próxima ação |
| `next_action_content` | TEXT | Conteúdo da próxima ação |
| `next_action_at` | TIMESTAMP | Quando executar |
| `response_rate` | DECIMAL(5,2) | Taxa de resposta |
| `engagement_score` | DECIMAL(5,2) | Score de engajamento |
| `trigger_data` | JSONB | Gatilho que iniciou |
| `started_at` | TIMESTAMP | Início da jornada |
| `completed_at` | TIMESTAMP | Conclusão |

---

### `conversion_events`
Tracking de atribuição de conversões.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL | Identificador único |
| `customer_id` | UUID | Referência ao cliente |
| `tenant_id` | INTEGER | ID do tenant |
| `conversion_type` | VARCHAR(50) | Tipo: purchase, signup, lead |
| `conversion_value` | DECIMAL(12,2) | Valor da conversão |
| `currency` | VARCHAR(10) | Moeda (BRL) |
| `conversion_path` | JSONB | Caminho de conversão |
| `touchpoints_count` | INTEGER | Total de touchpoints |
| `first_touch_channel` | VARCHAR(50) | Primeiro canal |
| `last_touch_channel` | VARCHAR(50) | Último canal |
| `attribution_last_click` | JSONB | Atribuição last click |
| `attribution_first_click` | JSONB | Atribuição first click |
| `attribution_linear` | JSONB | Atribuição linear |
| `attribution_time_decay` | JSONB | Atribuição time decay |
| `order_id` | VARCHAR(100) | ID do pedido |
| `product_ids` | JSONB | Produtos comprados |
| `campaign_id` | INTEGER | Campanha relacionada |
| `converted_at` | TIMESTAMP | Data da conversão |

---

### `journey_step_templates`
Templates reutilizáveis de automação.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL | Identificador único |
| `tenant_id` | INTEGER | ID do tenant |
| `journey_type` | VARCHAR(100) | Tipo de jornada |
| `step_order` | INTEGER | Ordem do passo |
| `channel` | VARCHAR(50) | Canal de envio |
| `delay_minutes` | INTEGER | Tempo de espera |
| `action_type` | VARCHAR(50) | Tipo: send_email, send_whatsapp |
| `action_template` | TEXT | Template ou conteúdo |
| `condition_type` | VARCHAR(50) | Condição: if_not_opened, if_clicked |
| `condition_value` | VARCHAR(255) | Valor da condição |
| `is_active` | BOOLEAN | Se está ativo |

---

## 7. Tabelas de Segmentos de Indústria

### `ml_industry_segments`
Segmentos de indústria para análise.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL | Identificador único |
| `code` | VARCHAR(50) | Código único |
| `name_pt` | VARCHAR(100) | Nome em português |
| `name_en` | VARCHAR(100) | Nome em inglês |
| `description` | TEXT | Descrição |
| `icon` | VARCHAR(50) | Ícone (Lucide) |
| `color` | VARCHAR(20) | Cor hex |
| `typical_metrics` | JSONB | Métricas típicas |
| `typical_algorithms` | JSONB | Algoritmos recomendados |

**Segmentos pré-cadastrados:**
- 🛒 E-commerce
- 🏪 Varejo
- 💻 Tecnologia
- 🌾 Agricultura
- 🏥 Saúde
- 🏦 Financeiro

---

### `ml_segment_analytics`
Analytics por segmento.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `segment_id` | INTEGER | Referência ao segmento |
| `experiment_id` | UUID | Referência ao experimento |
| `tenant_id` | UUID | ID do tenant |
| `analysis_date` | DATE | Data da análise |
| `analysis_type` | VARCHAR(50) | Tipo de análise |
| `algorithm` | VARCHAR(100) | Algoritmo usado |
| `primary_metric_name` | VARCHAR(100) | Nome da métrica principal |
| `primary_metric_value` | FLOAT | Valor da métrica |
| `secondary_metrics` | JSONB | Métricas secundárias |
| `chart_data` | JSONB | Dados para gráficos |
| `table_data` | JSONB | Dados para tabelas |
| `sample_size` | INTEGER | Tamanho da amostra |
| `confidence_level` | FLOAT | Nível de confiança |

---

## 📈 Resumo

| Categoria | Quantidade |
|-----------|------------|
| Tabelas Core ML | 3 |
| Tabelas de Resultados | 4 |
| Tabelas de Analytics | 4 |
| Tabelas de Visualização | 4 |
| Tabelas de Configuração | 3 |
| Tabelas de Customer Journey | 6 |
| Tabelas de Segmentos | 2 |
| **Total** | **26 tabelas** |

---

*Documentação gerada em: 2025-12-08*
