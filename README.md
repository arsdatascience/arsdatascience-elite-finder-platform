# Elite Finder 2.0 🚀

**Plataforma de Inteligência Artificial para Marketing, Vendas e Gestão Financeira.**

O Elite Finder é um ecossistema "Simbiótico" onde CRM, Marketing, Projetos e Financeiro operam como um único organismo inteligente, automatizando decisões e otimizando resultados.

---

## 📋 Índice

1. [Arquitetura do Sistema](#-arquitetura-do-sistema)
2. [Estrutura de Bancos de Dados](#-estrutura-de-bancos-de-dados)
3. [Módulos Implementados](#-módulos-implementados)
4. [Integração Cross-Database](#-integração-cross-database)
5. [APIs e Endpoints](#-apis-e-endpoints)
6. [Stack Tecnológica](#-stack-tecnológica)
7. [Configuração e Deploy](#-configuração-e-deploy)
8. [Estrutura de Arquivos](#-estrutura-de-arquivos)
9. [Guia de Desenvolvimento](#-guia-de-desenvolvimento)

---

## 🏗️ Arquitetura do Sistema

### Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                               │
│                         Vercel: marketinghub.aiiam.com.br                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Node.js/Express)                         │
│                         Railway: elite-finder.up.railway.app               │
└─────────────────────────────────────────────────────────────────────────────┘
          │                    │                    │                    │
          ▼                    ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   CROSSOVER     │  │     MAGLEV      │  │      REDIS      │  │     QDRANT      │
│   (PostgreSQL)  │  │   (PostgreSQL)  │  │    (Cache/MQ)   │  │   (Vector DB)   │
│   Core Data     │  │   Operations    │  │   BullMQ Jobs   │  │    RAG Memory   │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Componentes Principais

| Componente | Tecnologia | Propósito |
|------------|------------|-----------|
| **Frontend** | React + TypeScript + Vite | Interface de usuário SPA |
| **Backend** | Node.js + Express | API REST + WebSockets |
| **Crossover DB** | PostgreSQL (Railway) | Dados core: auth, tenants, clientes, CRM |
| **Maglev DB** | PostgreSQL (Railway) | Dados operacionais: ML, projetos, financeiro |
| **Redis** | Redis (Railway) | Cache, filas BullMQ, sessions |
| **Qdrant** | Qdrant Cloud | Vector database para RAG/AI |

---

## 🗄️ Estrutura de Bancos de Dados

### Dual-Database Architecture

O sistema utiliza **dois bancos PostgreSQL separados** para garantir escalabilidade e isolamento:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CROSSOVER (Core)                               │
│                      postgresql://...crossover.railway.app                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  AUTH & IDENTITY          │  CRM & CUSTOMERS           │  INTEGRATIONS     │
│  ─────────────────        │  ────────────────          │  ────────────     │
│  • users                  │  • clients_pf              │  • integrations   │
│  • tenants                │  • clients_pj              │  • oauth_tokens   │
│  • permissions            │  • unified_customers       │  • api_keys       │
│  • sessions               │  • identity_graph          │  • webhooks       │
│                           │  • customer_interactions   │                   │
│                           │  • customer_journeys       │                   │
│                           │  • conversion_events       │                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                               MAGLEV (Operations)                           │
│                       postgresql://...maglev.railway.app                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ML & ANALYTICS           │  PROJECTS & TASKS          │  FINANCIAL        │
│  ──────────────           │  ─────────────────         │  ─────────        │
│  • ml_datasets            │  • projects                │  • transactions   │
│  • ml_experiments         │  • tasks                   │  • categories     │
│  • ml_predictions         │  • task_comments           │  • services       │
│  • ml_*_results           │  • task_attachments        │  • invoices       │
│  • ml_*_analytics         │  • sops                    │                   │
│  • ml_segment_analytics   │  • sop_templates           │                   │
│  • ml_viz_*               │                            │                   │
│  • ml_algorithm_configs   │                            │                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Conexão no Código

```javascript
// backend/database.js
const pool = require('./database');        // Crossover (Core)
const opsPool = pool.opsPool;              // Maglev (Operations)

// Exemplo de uso
const customers = await pool.query('SELECT * FROM unified_customers');
const mlData = await pool.opsPool.query('SELECT * FROM ml_predictions');
```

### Tabelas por Banco

#### Crossover (Core) - 25+ tabelas
| Categoria | Tabelas |
|-----------|---------|
| **Auth** | users, tenants, permissions, sessions |
| **CRM** | clients_pf, clients_pj, leads, contacts |
| **Omnichannel** | unified_customers, identity_graph, customer_interactions, customer_journeys, conversion_events, journey_step_templates |
| **Integrations** | integrations, oauth_tokens, api_keys |
| **Chat** | chat_sessions, chat_messages |
| **Copies** | saved_copies |

#### Maglev (Operations) - 30+ tabelas
| Categoria | Tabelas |
|-----------|---------|
| **ML Core** | ml_datasets, ml_experiments, ml_predictions |
| **ML Results** | ml_regression_results, ml_classification_results, ml_clustering_results, ml_timeseries_results |
| **ML Analytics** | ml_sales_analytics, ml_marketing_analytics, ml_customer_analytics, ml_financial_analytics |
| **ML Segments** | ml_industry_segments, ml_segment_analytics |
| **ML Viz** | ml_viz_regression, ml_viz_classification, ml_viz_clustering, ml_viz_timeseries |
| **ML Config** | ml_algorithm_configs, ml_algorithm_config_history, ml_prophet_holidays |
| **Projects** | projects, tasks, task_comments, task_attachments, task_checklist_items |
| **Operations** | sops, sop_templates, digital_assets |
| **Financial** | financial_transactions, financial_categories, services |

---

## 🌟 Módulos Implementados

### ✅ Flight Control (CRM/Leads)
- Kanban visual com drag-and-drop
- Quick Actions (Call, Email, WhatsApp, Schedule)
- Sistema de tags para leads
- Scoring automático de leads

### ✅ WhatsApp Sales Coaching
- Integração com Evolution API
- **Teleprompter IA:** Análise de sentimento e sugestões em tempo real com scroll vertical
- **Relatórios PDF:** Geração de relatórios de análise e históricos completos
- Detecção de contexto (Vendas vs Conversa Informal)
- Botão de excluir conversas

### ✅ Módulo ML/Analytics
- 22 algoritmos implementados (Regression, Classification, Clustering, Time Series)
- **Aba de Dados:** Visualização com formatação monetária automática (R$)
- Importação em batch de dados CSV/Excel
- Visualizações por segmento e Insights Automáticos
- Configuração de hiperparâmetros

### ✅ Gestão Estratégica (Dashboard)
- Filtros por Plataforma: Google Ads, Meta Ads, YouTube Ads, LinkedIn Ads
- KPIs Consolidados de todas as fontes
- Análise de ROI e Custo por Conversão

### ✅ Gestão de Projetos
- Projetos com budget e timeline
- Tarefas com dependências
- SOPs integrados
- Gestão de carga de trabalho

### ✅ Financeiro
- Transações categorizadas
- ROI por projeto
- Catálogo de serviços

### ✅ Omnichannel CDP
- Customer Data Platform unificada
- Identity Graph para cross-channel matching
- Jornadas automatizadas
- Atribuição de conversões

---

## 🔗 Integração Cross-Database

### Arquitetura de Conexão

Como os dados estão em bancos diferentes, a integração é feita na **camada de aplicação**:

```javascript
// backend/crossDatabaseController.js

// 1. Buscar cliente no Crossover
const customer = await pool.query(
    'SELECT * FROM unified_customers WHERE id = $1', [customerId]
);

// 2. Buscar análises ML no Maglev
const mlAnalysis = await pool.opsPool.query(
    'SELECT * FROM ml_customer_analytics WHERE tenant_id = $1', [tenantId]
);

// 3. Combinar resultados
return {
    customer: customer.rows[0],
    analytics: mlAnalysis.rows
};
```

### Endpoints Unificados

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/unified/customer/:id` | Visão completa do cliente + análises ML |
| `GET /api/unified/customer/:id/ml-insights` | Previsões e segmentação do cliente |
| `GET /api/unified/dashboard` | Dashboard executivo cross-database |

### Chaves de Conexão

| Crossover | Maglev | Tipo |
|-----------|--------|------|
| `unified_customers.id` | `ml_*.client_id` | UUID |
| `tenants.id` | `ml_*.tenant_id` | UUID |
| `clients_pf/pj.id` | `ml_*.client_id` | INTEGER |

---

## 📡 APIs e Endpoints

### Autenticação
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me
```

### Clientes
```
GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PUT    /api/clients/:id
DELETE /api/clients/:id
```

### ML Analytics
```
GET  /api/analytics/segments
GET  /api/analytics/results
POST /api/ml-agent/analyze
GET  /api/ml/configs
POST /api/ml/configs
```

### Importação de Dados
```
GET  /api/import/tables
POST /api/import/:tableName
POST /api/import/batch
```

### WhatsApp
```
POST /api/webhooks/whatsapp
POST /api/whatsapp/send
GET  /api/whatsapp/sessions
GET  /api/whatsapp/sessions/:sessionId/messages
DELETE /api/whatsapp/sessions/:sessionId
```

### Unified (Cross-Database)
```
GET /api/unified/customer/:customerId
GET /api/unified/customer/:customerId/ml-insights
GET /api/unified/dashboard
```

---

## 🛠️ Stack Tecnológica

### Frontend
| Tech | Versão | Uso |
|------|--------|-----|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| TailwindCSS | 3.x | Styling |
| Framer Motion | 11.x | Animations |
| @dnd-kit | 6.x | Drag & Drop |
| Recharts | 2.x | Charts |
| Lucide React | - | Icons |

### Backend
| Tech | Versão | Uso |
|------|--------|-----|
| Node.js | 18.x | Runtime |
| Express | 4.x | Web framework |
| pg | 8.x | PostgreSQL client |
| ioredis | 5.x | Redis client |
| bullmq | 5.x | Job queue |
| socket.io | 4.x | WebSockets |
| jsonwebtoken | 9.x | JWT auth |
| multer | 1.x | File uploads |
| papaparse | 5.x | CSV parsing |

### IA/ML
| Tech | Uso |
|------|-----|
| OpenAI GPT-4o | Chat, análise, geração |
| Google Gemini 2.0 | Backup AI |
| Anthropic Claude | Análise avançada |
| Whisper | Transcrição de áudio |

### Infraestrutura
| Service | Provider |
|---------|----------|
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |
| PostgreSQL (2x) | Railway |
| Redis | Railway |
| Vector DB | Qdrant Cloud |

---

## ⚙️ Configuração e Deploy

### Variáveis de Ambiente (.env)

```env
# Database - Crossover (Core)
DATABASE_URL=postgresql://postgres:xxx@crossover.proxy.rlwy.net:xxx/railway

# Database - Maglev (Operations)
DATA_BASE_URL2=postgresql://postgres:xxx@maglev.proxy.rlwy.net:xxx/railway

# Redis
REDIS_PUBLIC_URL=redis://default:xxx@switchyard.proxy.rlwy.net:xxx

# JWT
JWT_SECRET=your-secret-key

# AI APIs
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_API_KEY=xxx

# WhatsApp Evolution API
EVOLUTION_API_URL=https://your-evolution.com
EVOLUTION_API_KEY=xxx

# Frontend URL (CORS)
FRONTEND_URL=https://marketinghub.aiiam.com.br
```

### Deploy

```bash
# Backend (Railway)
# - Conectado via GitHub auto-deploy
# - Branch: main
# - Root dir: /backend

# Frontend (Vercel)
# - Conectado via GitHub auto-deploy
# - Branch: main
# - Root dir: /frontend
# - Build: npm run build
# - Output: dist
```

### Executar Localmente

```bash
# Backend (porta 3001)
cd backend
npm install
npm run dev

# Frontend (porta 5173)
cd frontend
npm install
npm run dev
```

---

## 📁 Estrutura de Arquivos

```
elite-finder-appv1/
├── backend/
│   ├── server.js              # Entry point, rotas, middlewares
│   ├── database.js            # Conexões PostgreSQL (pool, opsPool)
│   ├── schema.sql             # Schema inicial Crossover
│   │
│   ├── controllers/           # (alguns inline no server.js)
│   ├── crossDatabaseController.js  # Integração Crossover + Maglev
│   ├── audioController.js     # Análise de áudio (Whisper)
│   ├── bulkImportController.js # Importação CSV
│   ├── emailController.js     # SMTP e envio de emails
│   ├── integrationsController.js # WhatsApp, OAuth
│   ├── mlConfigController.js  # Configurações ML
│   ├── whatsappController.js  # Webhook e sessões WhatsApp
│   │
│   ├── routes/
│   │   └── mlAgent.routes.js  # Rotas do ML Agent
│   │
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── checkAdmin.js      # Admin verification
│   │
│   ├── migrations/            # Arquivos SQL de migração
│   │   ├── 034_ml_module_schema.sql
│   │   ├── 035_ml_industry_segments.sql
│   │   ├── 042_omnichannel_foundation.sql
│   │   ├── 044_ml_algorithm_configs.sql
│   │   └── ...
│   │
│   └── jobs/
│       └── jobProcessor.js    # BullMQ job handlers
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Rotas principais
│   │   ├── main.tsx           # Entry point
│   │   │
│   │   ├── components/
│   │   │   ├── market-analysis/
│   │   │   │   ├── BulkDataImport.tsx
│   │   │   │   ├── AlgorithmConfigModal.tsx
│   │   │   │   └── ...
│   │   │   ├── SalesCoachingChat.tsx
│   │   │   ├── FlightControl.tsx
│   │   │   └── ...
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── MarketAnalysis.tsx
│   │   │   └── ...
│   │   │
│   │   └── services/
│   │       └── apiClient.ts   # API wrapper
│   │
│   └── index.html
│
├── docs/
│   └── Estrutura_Tabelas_Analiticas.md
│
├── synthetic_data/            # CSVs para importação
│   ├── ml_datasets.csv
│   ├── ml_experiments.csv
│   └── ...
│
└── README.md                  # Esta documentação
```

---

## 👨‍💻 Guia de Desenvolvimento

### Adicionar Nova Tabela

1. **Criar migração** em `backend/migrations/XXX_nome.sql`
2. **Adicionar execução** em `backend/server.js` (função `initializeDatabase`)
3. **Usar pool correto**:
   - `pool` → Crossover (auth, clientes, CRM)
   - `pool.opsPool` → Maglev (ML, projetos, financeiro)

### Criar Endpoint Cross-Database

```javascript
// Em crossDatabaseController.js
const newEndpoint = async (req, res) => {
    // Crossover query
    const coreData = await pool.query('SELECT * FROM unified_customers WHERE id = $1', [id]);
    
    // Maglev query
    const opsData = await pool.opsPool.query('SELECT * FROM ml_predictions WHERE tenant_id = $1', [tenantId]);
    
    // Combinar
    res.json({ core: coreData.rows, ops: opsData.rows });
};
```

### Importar Dados CSV

1. Acessar `/dados` no frontend
2. Selecionar CSV (nome deve corresponder à tabela)
3. Sistema detecta banco automaticamente (Crossover ou Maglev)
4. ETL normaliza dados antes da inserção

### Ordem de Importação (Dependências FK)

Para tabelas com FK, importar na ordem correta:

```
1. unified_customers
2. identity_graph, customer_interactions, customer_journeys
3. conversion_events

1. ml_datasets
2. ml_experiments
3. ml_predictions, ml_*_results, ml_*_analytics
```

---

## 📄 Licença

Proprietário - Todos os direitos reservados.

---

## 🔄 Changelog Recente

### 2025-12-10
- ✅ Correção Crítica: Insights IA acessando dados reais (Fix Tenant ID)
- ✅ Dashboard: Filtros de Ads (Google, Meta, Youtube, LinkedIn)
- ✅ Market Analysis: Formatação monetária na tabela de dados
- ✅ Teleprompter: Scroll vertical, Relatórios PDF e Detecção de Contexto
- ✅ Correção de erros TypeScript e Backend (UUID validation)

### 2025-12-08
- ✅ Integração WhatsApp Sales Coaching corrigida
- ✅ Botão de excluir conversas adicionado
- ✅ Filtro de mensagens de grupo WhatsApp
- ✅ Importação batch de dados ML
- ✅ Remoção de FKs cross-database (Maglev)
- ✅ Endpoints unificados cross-database
- ✅ Documentação completa do sistema
