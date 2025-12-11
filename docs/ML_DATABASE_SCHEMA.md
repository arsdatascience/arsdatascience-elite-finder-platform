# Estrutura de Tabelas PostgreSQL - Módulo ML/Análise de Mercado

> **ML Database (maglev):** Railway PostgreSQL - Tabelas ML e Analytics
> **Clients Database (crossover):** Railway PostgreSQL - Clients e Métricas
> **Migrations:** 034-037

---

## 👥 TABELAS DE CLIENTES (Crossover DB)

### `clients`
Cadastro de clientes da plataforma.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER | PK (auto-increment) |
| `name` | VARCHAR | Nome da empresa |
| `email` | VARCHAR | Email principal |
| `phone` | VARCHAR | Telefone |
| `cnpj` | VARCHAR | CNPJ |
| `segment` | VARCHAR | Segmento de mercado |
| `plan_status` | VARCHAR | Status do plano |
| `address` | VARCHAR | Endereço |
| `city` | VARCHAR | Cidade |
| `state` | VARCHAR | Estado |
| `country` | VARCHAR | País |
| `legal_rep_name` | VARCHAR | Representante legal |
| `meeting_notes` | TEXT | Notas de reuniões |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Última atualização |

---

### `client_metrics`
Métricas diárias detalhadas por cliente (200+ colunas).

**Migration:** 036_client_metrics.sql

| Categoria | Colunas Principais |
|-----------|-------------------|
| **Temporal** | date, day_of_week, week_of_year, month, quarter, year, is_weekend, is_holiday |
| **Vendas** | revenue, gross_revenue, net_revenue, discount_amount, refund_amount, tax_amount |
| **Pedidos** | orders, completed_orders, canceled_orders, avg_order_value, max_order_value |
| **Produtos** | products_sold, unique_products, top_category, top_product, out_of_stock |
| **Tráfego** | visits, unique_visitors, page_views, new_visitors, bounce_rate, avg_session_duration |
| **Conversão** | conversion_rate, add_to_cart_rate, checkout_rate, cart_abandonment_rate |
| **Marketing** | marketing_spend, google_ads_*, facebook_*, instagram_ads_spend, tiktok_ads_spend |
| **Instagram** | 60+ métricas: followers, engagement, stories, reels, posts, DMs, shopping, ads |
| **TikTok** | 50+ métricas: followers, engagement, videos, lives, shopping, ads, viralidade |
| **YouTube** | views, subscribers, watch_time, engagement, revenue |
| **Outras Redes** | twitter_*, linkedin_*, pinterest_* |
| **Clientes** | new_customers, returning_customers, churned_customers, avg_customer_lifetime_value |
| **Operacional** | fulfillment_time, shipping_time, delivery_time, return_rate |
| **Satisfação** | nps, csat, reviews_count, avg_rating, email_open_rate |
| **Financeiro** | operational_cost, cost_of_goods_sold, gross_profit, gross_margin, net_profit |
| **Estoque** | inventory_value, inventory_turnover, stockout_rate |
| **Device** | mobile_visits, desktop_visits, mobile_conversion, desktop_conversion |
| **Geo** | top_city, top_state, top_country |
| **Competição** | competitor_price, price_advantage, market_share |
| **Metadados** | source, data_quality, notes, metadata (JSONB) |

**Indexes:** `(client_id, date)`, `(date)`, `(client_id, year, month)`
**Unique:** `(client_id, date)`

---

## 📊 TABELAS ML CORE (Maglev DB)

### 1. `ml_datasets`
Metadados dos arquivos de dados enviados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `tenant_id` | UUID | Tenant owner |
| `name` | VARCHAR(255) | Nome do dataset |
| `original_filename` | VARCHAR(255) | Nome original do arquivo |
| `file_path` | VARCHAR(500) | Caminho do arquivo |
| `file_size` | BIGINT | Tamanho em bytes |
| `row_count` | INTEGER | Número de linhas |
| `column_count` | INTEGER | Número de colunas |
| `columns` | JSONB | Metadados das colunas |
| `statistics` | JSONB | Estatísticas (min, max, mean, etc) |
| `market_area` | VARCHAR(100) | Área (sales, marketing, etc) |
| `created_at` | TIMESTAMP | Data de criação |

---

### 2. `ml_experiments`
Experimentos de treinamento de modelos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `tenant_id` | UUID | Tenant |
| `name` | VARCHAR(255) | Nome do experimento |
| `dataset_id` | UUID | FK → ml_datasets |
| `algorithm` | VARCHAR(100) | Algoritmo usado |
| `task_type` | VARCHAR(50) | regression/classification/clustering/timeseries |
| `status` | VARCHAR(50) | pending/training/completed/failed |
| `target_column` | VARCHAR(100) | Coluna target |
| `feature_columns` | JSONB | Array de features |
| `hyperparameters` | JSONB | Hiperparâmetros configurados |
| `preset` | VARCHAR(50) | fast/balanced/accurate |
| `metrics` | JSONB | Métricas de resultado |
| `feature_importance` | JSONB | Importância das features |
| `is_deployed` | BOOLEAN | Em produção? |
| `training_duration` | INTEGER | Duração em segundos |
| `model_path` | VARCHAR(500) | Path do modelo salvo |
| `created_at` | TIMESTAMP | Início |
| `completed_at` | TIMESTAMP | Fim |

---

### 3. `ml_predictions`
Predições realizadas com modelos treinados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `tenant_id` | UUID | Tenant |
| `experiment_id` | UUID | FK → ml_experiments |
| `input_data` | JSONB | Dados de entrada |
| `predictions` | JSONB | Resultados das predições |
| `confidence` | FLOAT | Confiança média |
| `created_at` | TIMESTAMP | Data |

---

### 4. `ml_algorithm_configs`
Configurações dos 22 algoritmos disponíveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL | PK |
| `algorithm` | VARCHAR(100) | Nome único |
| `task_type` | VARCHAR(50) | Tipo de tarefa |
| `display_name` | VARCHAR(100) | Nome exibido |
| `description` | TEXT | Descrição |
| `complexity` | VARCHAR(20) | low/medium/high |
| `estimated_time` | VARCHAR(50) | Tempo estimado |
| `hyperparameters` | JSONB | Schema dos hiperparâmetros |
| `suitable_for` | JSONB | Áreas adequadas |

**Algoritmos:** 8 Regressão, 7 Classificação, 3 Clustering, 4 Time Series

---

## 🏭 TABELAS POR TIPO DE RESULTADO

### 5. `ml_regression_results`
| Coluna | Tipo |
|--------|------|
| r2_score, rmse, mae, mape, mse, adjusted_r2 | FLOAT |
| residuals, predicted_vs_actual, coefficients | JSONB |

### 6. `ml_classification_results`
| Coluna | Tipo |
|--------|------|
| accuracy, precision_score, recall, f1_score, roc_auc | FLOAT |
| confusion_matrix, roc_curve, class_distribution | JSONB |

### 7. `ml_clustering_results`
| Coluna | Tipo |
|--------|------|
| silhouette_score, davies_bouldin_index, n_clusters, inertia | FLOAT/INT |
| cluster_centers, cluster_sizes, cluster_labels | JSONB |

### 8. `ml_timeseries_results`
| Coluna | Tipo |
|--------|------|
| mape, rmse, mae, forecast_horizon | FLOAT/INT |
| forecast_values, trend, seasonality, confidence_intervals | JSONB |

---

## 📈 TABELAS POR ÁREA DE MERCADO

### 9. `ml_sales_analytics`
Vendas: total_sales, predicted_sales, growth_rate, conversion_rate, avg_ticket, top_products

### 10. `ml_marketing_analytics`
Marketing: roi, cac, cpl, ctr, impressions, clicks, leads, channel_performance

### 11. `ml_customer_analytics`
Clientes: total_customers, churn_rate, clv, retention_rate, nps_score, rfm_analysis

### 12. `ml_financial_analytics`
Financeiro: revenue, expenses, profit, profit_margin, cashflow, financial_forecast

---

## 🌍 SEGMENTOS DE INDÚSTRIA

### 13. `ml_industry_segments`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL | PK |
| `code` | VARCHAR(50) | Código único |
| `name_pt` | VARCHAR(100) | Nome em PT |
| `name_en` | VARCHAR(100) | Nome em EN |
| `icon` | VARCHAR(50) | Ícone Lucide |
| `color` | VARCHAR(20) | Cor hex |
| `typical_metrics` | JSONB | Métricas típicas |
| `typical_algorithms` | JSONB | Algoritmos recomendados |

**Segmentos cadastrados:**
- `ecommerce` - E-commerce (#3B82F6)
- `retail` - Varejo (#10B981)
- `technology` - Tecnologia (#8B5CF6)
- `agriculture` - Agricultura (#22C55E)
- `automotive` - Concessionárias (#F59E0B)
- `aesthetics` - Clínicas Estética (#EC4899)

### 14. `ml_segment_analytics`
Resultados agregados por segmento com visualization data.

| Coluna | Tipo |
|--------|------|
| segment_id | INTEGER FK |
| experiment_id | UUID FK |
| analysis_type | VARCHAR(50) |
| algorithm | VARCHAR(100) |
| primary_metric_name/value | VARCHAR/FLOAT |
| secondary_metrics | JSONB |
| chart_data, table_data | JSONB |
| sample_size | INTEGER |

---

## 📊 TABELAS DE VISUALIZAÇÃO

### 15. `ml_viz_regression`
scatter_data, residual_plot, coefficient_chart, trend_line, r2, rmse, mae

### 16. `ml_viz_classification`
confusion_matrix, roc_curve, pr_curve, class_distribution, accuracy, precision_score, recall, f1, auc

### 17. `ml_viz_clustering`
cluster_scatter, cluster_sizes, centroid_radar, elbow_plot, n_clusters, silhouette_score, inertia

### 18. `ml_viz_timeseries`
historical_data, forecast_data, seasonality_chart, trend_chart, mape, rmse, forecast_horizon

---

## 📈 ÍNDICES

```sql
-- Performance indexes
idx_ml_datasets_tenant
idx_ml_datasets_market
idx_ml_experiments_tenant
idx_ml_experiments_dataset
idx_ml_experiments_status
idx_ml_experiments_algorithm
idx_ml_experiments_market
idx_ml_predictions_experiment
idx_segment_analytics_segment
idx_segment_analytics_experiment
idx_segment_analytics_type
idx_segment_analytics_algorithm
idx_viz_*_segment

-- Client-based indexes (Migration 037)
idx_ml_datasets_client
idx_ml_experiments_client
idx_ml_experiments_client_status
idx_ml_experiments_client_algorithm
idx_ml_segment_analytics_client
idx_ml_segment_analytics_client_segment
idx_ml_predictions_client
```

---

## 🔗 ASSOCIAÇÃO COM CLIENTES

> **Migration:** 037_ml_client_association.sql

**Objetivo:** Permitir análises ML por cliente, associando tabelas ML (maglev DB) com clients/client_metrics (crossover DB).

**Tabelas com `client_id INTEGER`:**
- ml_datasets
- ml_experiments
- ml_segment_analytics
- ml_predictions
- ml_regression_results
- ml_classification_results
- ml_clustering_results
- ml_timeseries_results
- ml_sales_analytics
- ml_marketing_analytics
- ml_customer_analytics
- ml_financial_analytics

**Nota:** Sem FK direta pois estão em DBs diferentes. A associação é feita pela aplicação usando o mesmo `client_id`.

---

## 📋 RESUMO

| Categoria | Tabelas |
|-----------|---------|
| Core | 4 |
| Resultados por tipo | 4 |
| Áreas de mercado | 4 |
| Segmentos | 2 |
| Visualizações | 4 |
| **TOTAL** | **18 tabelas** |

**Dados sintéticos:** 132 registros em `ml_segment_analytics` (22 algoritmos × 6 segmentos)
**Client Association:** 12 tabelas com coluna `client_id` para análises por cliente
