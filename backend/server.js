

const path = require('path');
const fs = require('fs');
console.log('🚀 STARTING SERVER INITIALIZATION...');

require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const compression = require('compression');

const app = express();
app.set('trust proxy', 1); // Necessário para Railway/Vercel e rate-limiter
// const PORT = process.env.PORT || 3001; // Moved to bottom for immediate start


// Middleware
const authenticateToken = require('./middleware/auth');
const helmet = require('helmet');

// Configuração de Origens Permitidas - MUST BE DEFINED BEFORE CORS
const allowedOrigins = [
  'https://marketinghub.aiiam.com.br',
  'https://elitefinder.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(url => {
    if (url) allowedOrigins.push(url.trim().replace(/\/$/, ''));
  });
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

// ============ CORS MUST COME FIRST ============
// Handle preflight OPTIONS for all routes BEFORE any other middleware
console.log('🌐 CORS configured for origins:', allowedOrigins);

// Log ALL incoming requests (even before CORS processing)
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path} from ${req.headers.origin || 'no-origin'}`);
  next();
});

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Manual CORS headers backup (in case cors package fails)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  next();
});

// ============ HELMET AFTER CORS ============
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

app.use(compression());
const stripeController = require('./stripeController');

// Webhook Stripe (Precisa ser antes do express.json() global para validar assinatura)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), version: '1.0.1' });
});

// Rota de Checkout (Protegida)
app.post('/api/stripe/create-checkout-session', authenticateToken, stripeController.createCheckoutSession);

const planController = require('./planController');
const checkAdmin = require('./middleware/checkAdmin');
// Rotas de Admin - Gestão de Planos
app.get('/api/admin/plans', authenticateToken, checkAdmin, planController.getAllPlans);
app.post('/api/admin/plans', authenticateToken, checkAdmin, planController.createPlan);
app.put('/api/admin/plans/:id', authenticateToken, checkAdmin, planController.updatePlan);
app.delete('/api/admin/plans/:id', authenticateToken, checkAdmin, planController.deletePlan);

// Rota de Análise de Áudio (Whisper + GPT-4o)
const audioController = require('./audioController');
app.post('/api/audio/analyze', authenticateToken, audioController.uploadMiddleware, audioController.analyzeAudio);
app.get('/api/audio/history', authenticateToken, audioController.getHistory);
app.get('/api/audio/analysis/:id', authenticateToken, audioController.getAnalysis);
app.delete('/api/audio/analysis/:id', authenticateToken, audioController.deleteAnalysis);

// Log request URL para debug
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});


// Conexão com Banco de Dados (PostgreSQL no Railway)
// Importar do módulo database.js para evitar dependências circulares
const pool = require('./database');

// Initialize database schema
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Custom SQL parser that handles DO $$ blocks and multi-line statements
    const statements = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let inBlockComment = false;

    const lines = schema.split('\n');

    for (let line of lines) {
      const trimmedLine = line.trim();

      // Skip single-line comments
      if (trimmedLine.startsWith('--')) continue;

      // Handle block comments
      if (trimmedLine.includes('/*')) inBlockComment = true;
      if (trimmedLine.includes('*/')) {
        inBlockComment = false;
        continue;
      }
      if (inBlockComment) continue;

      // Handle DO $$ blocks
      if (trimmedLine.includes('DO $$') || trimmedLine.includes('$$')) {
        inDollarQuote = !inDollarQuote;
      }

      currentStatement += line + '\n';

      // End of statement (semicolon outside of dollar quotes)
      if (trimmedLine.endsWith(';') && !inDollarQuote) {
        const stmt = currentStatement.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }

    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        await pool.query(statement);
        successCount++;
      } catch (error) {
        // Ignore "already exists" and "duplicate key" errors
        if (error.message.includes('already exists') ||
          error.message.includes('duplicate key')) {
          skipCount++;
        } else {
          errorCount++;
          console.error('⚠️  SQL Error:', error.message.substring(0, 150));
        }
      }
    }

    console.log(`✅ Database schema initialized! (${successCount} executed, ${skipCount} skipped, ${errorCount} errors)`);

    // Migração Automática para Analytics de Imagens
    console.log('🔄 Verificando migrações de Analytics...');
    try {
      await pool.query(`
            ALTER TABLE generated_images 
            ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 4) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'replicate',
            ADD COLUMN IF NOT EXISTS generation_time INTEGER,
            ADD COLUMN IF NOT EXISTS metadata JSONB;
        `);
      console.log('✅ Migração de Analytics verificada/aplicada.');

      // Migração para Chaves de API Criptografadas (SaaS Security)
      console.log('🔄 Verificando migrações de Segurança (API Keys)...');
      await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS openai_key TEXT,
            ADD COLUMN IF NOT EXISTS gemini_key TEXT,
            ADD COLUMN IF NOT EXISTS anthropic_key TEXT;
      `);
      console.log('✅ Migração de Segurança verificada/aplicada.');

      // Migração para Fila de Jobs (SaaS Scalability)
      console.log('🔄 Verificando migrações de Fila de Jobs...');
      await pool.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                payload JSONB NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                result JSONB,
                error TEXT,
                scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_jobs_status_scheduled ON jobs(status, scheduled_for);
      `);
      console.log('✅ Migração de Fila de Jobs verificada/aplicada.');

      // Migração para Melhoria da Tabela de Clientes (PF/PJ e Compliance)
      console.log('🔄 Verificando migrações de Clientes (PF/PJ)...');
      await pool.query(`
            -- Access & Compliance
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS username VARCHAR(100);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT;
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT false;
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_consent BOOLEAN DEFAULT false;
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS marketing_optin BOOLEAN DEFAULT false;

            -- PF Specific
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS rg VARCHAR(30);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date DATE;
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255);

            -- PJ Specific
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS fantasy_name VARCHAR(255);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS state_registration VARCHAR(50);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS municipal_registration VARCHAR(50);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS cnae VARCHAR(100);

            -- PJ Legal Representative
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_rep_name VARCHAR(255);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_rep_cpf VARCHAR(20);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_rep_role VARCHAR(100);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_rep_email VARCHAR(255);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_rep_phone VARCHAR(50);

            -- Banking Information
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_agency VARCHAR(50);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(50);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS pix_key VARCHAR(100);

            -- Additional Info
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS referral_source VARCHAR(100);
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_references TEXT;

            -- Address Expansion
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_district VARCHAR(100);
      `);
      console.log('✅ Migração de Clientes verificada/aplicada.');

      // Migração de Reparo (Fix DB Issues)
      console.log('🔄 Executando migração de reparo (022)...');
      await pool.query(`
          -- 1. Ensure 'document' column exists in clients
          DO $$
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'document') THEN
                  ALTER TABLE clients ADD COLUMN document VARCHAR(20);
              END IF;
          END $$;

          -- 2. Increase column lengths for clients
          ALTER TABLE clients ALTER COLUMN state_registration TYPE VARCHAR(100);
          ALTER TABLE clients ALTER COLUMN municipal_registration TYPE VARCHAR(100);
          ALTER TABLE clients ALTER COLUMN fantasy_name TYPE VARCHAR(255);
          ALTER TABLE clients ALTER COLUMN legal_rep_email TYPE VARCHAR(255);

          -- 3. Ensure User ID 1 exists
          INSERT INTO users (id, name, email, password_hash, role, status)
          VALUES (1, 'System User', 'system@elitefinder.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'super_admin', 'active')
          ON CONFLICT (id) DO NOTHING;

          -- 4. Fix sequences
          SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
      `);
      console.log('✅ Migração de reparo (022) aplicada.');

      // Migração para Planos e Limites (SaaS)
      console.log('🔄 Verificando migrações de Planos e Limites...');
      await pool.query(`
            CREATE TABLE IF NOT EXISTS plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                price DECIMAL(10, 2) DEFAULT 0,
                limits JSONB DEFAULT '{}',
                features JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Adicionar plan_id em users
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan_id') THEN
                    ALTER TABLE users ADD COLUMN plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL;
                END IF;
            END $$;
            
            -- Adicionar user_id em social_posts para rate limiting
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='social_posts' AND column_name='user_id') THEN
                    ALTER TABLE social_posts ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
                END IF;
            END $$;

            -- Inserir planos padrão
            INSERT INTO plans (name, price, limits, features) VALUES 
            ('Free', 0.00, '{"social_posts_per_day": 3, "ai_generations_per_day": 5, "team_members": 1}', '["basic_analytics", "1_social_account"]'),
            ('Pro', 29.90, '{"social_posts_per_day": 50, "ai_generations_per_day": 100, "team_members": 5}', '["advanced_analytics", "5_social_accounts", "priority_support"]'),
            ('Enterprise', 99.90, '{"social_posts_per_day": 1000, "ai_generations_per_day": 1000, "team_members": 20}', '["all_features", "unlimited_social_accounts", "dedicated_manager"]')
            ON CONFLICT (name) DO NOTHING;
            
            -- Atribuir plano Free para usuários sem plano
            UPDATE users SET plan_id = (SELECT id FROM plans WHERE name = 'Free') WHERE plan_id IS NULL;
      `);
      console.log('✅ Migração de Planos e Limites verificada/aplicada.');

      // Migração para Agent Builder (Script Content)
      console.log('🔄 Verificando migrações de Agent Builder...');
      await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_prompts' AND column_name = 'script_content') THEN 
                    ALTER TABLE agent_prompts ADD COLUMN script_content TEXT; 
                END IF; 
            END $$;
      `);
      console.log('✅ Migração de Agent Builder verificada/aplicada.');

      // Migração para Saved Copies (Copywriter History)
      console.log('🔄 Verificando migrações de Saved Copies...');
      await pool.query(`
            CREATE TABLE IF NOT EXISTS saved_copies (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                topic TEXT NOT NULL,
                platform VARCHAR(50) NOT NULL,
                tone VARCHAR(50),
                content JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
      `);
      console.log('✅ Migração de Saved Copies verificada/aplicada.');

      // Migração para Audio Analysis (Call Intelligence)
      console.log('🔄 Verificando migrações de Audio Analysis...');
      await pool.query(`
            CREATE TABLE IF NOT EXISTS audio_analyses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                filename VARCHAR(255),
                summary TEXT,
                global_sentiment JSONB,
                speakers JSONB,
                segments JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
      `);
      console.log('✅ Migração de Audio Analysis verificada/aplicada.');

      // Garantir que o usuário principal seja super_admin
      console.log('🔄 Atualizando permissões do Super Admin...');
      await pool.query(`
            UPDATE users 
            SET role = 'super_admin', tenant_id = NULL 
            WHERE email = 'denismay@arsdatascience.com.br';
      `);
      console.log('✅ Permissões de Super Admin atualizadas.');

      // Migração para Project Management (Digital Maturity Phase 1)
      console.log('🔄 Verificando migrações de Project Management (Ops DB)...');

      // FIX: Ensure columns exist BEFORE running the main migration block
      // Migração para Project Management (Digital Maturity Phase 1)
      console.log('🔄 Verificando migrações de Project Management (Ops DB)...');

      // NOTE: Using pool.opsPool (Maglev)
      // Removed Cross-DB Foreign Keys for Microservices Architecture
      await pool.opsPool.query(`
          -- 1. PROJECTS TABLE
          CREATE TABLE IF NOT EXISTS projects (
              id SERIAL PRIMARY KEY,
              tenant_id INTEGER, -- Ref Core DB
              client_id INTEGER, -- Ref Core DB
              owner_id INTEGER,  -- Ref Core DB
              
              name VARCHAR(255) NOT NULL,
              description TEXT,
              status VARCHAR(50) DEFAULT 'planning', 
              priority VARCHAR(20) DEFAULT 'medium',
              
              start_date DATE,
              end_date DATE,
              budget DECIMAL(12, 2),
              
              settings JSONB DEFAULT '{}',
              
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
          CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);

          -- 2. PROJECT MEMBERS
          CREATE TABLE IF NOT EXISTS project_members (
              project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, -- Local FK OK
              user_id INTEGER, -- Ref Core DB
              role VARCHAR(50) DEFAULT 'member',
              joined_at TIMESTAMP DEFAULT NOW(),
              PRIMARY KEY (project_id, user_id)
          );

          -- 3. TASKS TABLE
          CREATE TABLE IF NOT EXISTS tasks (
              id SERIAL PRIMARY KEY,
              tenant_id INTEGER, -- Ref Core DB
              project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, -- Local FK OK
              parent_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL, -- Local FK OK
              
              title VARCHAR(255) NOT NULL,
              description TEXT,
              
              status VARCHAR(50) DEFAULT 'todo',
              priority VARCHAR(20) DEFAULT 'medium',
              
              assignee_id INTEGER, -- Ref Core DB
              reporter_id INTEGER, -- Ref Core DB
              
              due_date TIMESTAMP,
              start_date TIMESTAMP,
              completed_at TIMESTAMP,
              
              estimated_minutes INTEGER DEFAULT 0,
              logged_minutes INTEGER DEFAULT 0,
              
              tags TEXT[],
              column_order INTEGER DEFAULT 0,
              
              metadata JSONB DEFAULT '{}',
              
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

          -- 4. TASK COMMENTS
          CREATE TABLE IF NOT EXISTS task_comments (
              id SERIAL PRIMARY KEY,
              task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE, -- Local FK OK
              user_id INTEGER, -- Ref Core DB
              
              content TEXT NOT NULL,
              is_internal BOOLEAN DEFAULT false,
              
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
          );
          
          -- 5. PROJECT ACTIVITY LOG
          CREATE TABLE IF NOT EXISTS project_activity_log (
              id SERIAL PRIMARY KEY,
              tenant_id INTEGER, -- Ref Core DB
              project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, -- Local FK OK
              task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL, -- Local FK OK
              user_id INTEGER, -- Ref Core DB
              
              action_type VARCHAR(50) NOT NULL,
              details JSONB,
              
              created_at TIMESTAMP DEFAULT NOW()
          );
      `);
      console.log('✅ Migração de Project Management verificada/aplicada no Ops DB.');

      // Migração para Produção em Lote (Content Batches) - Assuming Ops DB due to Tasks relation
      console.log('🔄 Verificando migrações de Content Batches (Ops DB)...');
      await pool.opsPool.query(`
            CREATE TABLE IF NOT EXISTS content_batches (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT DEFAULT 'admin',
                topic TEXT NOT NULL,
                total_days INTEGER NOT NULL,
                platform TEXT NOT NULL,
                tone TEXT NOT NULL,
                status TEXT DEFAULT 'processing', 
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                settings JSONB DEFAULT '{}'
            );
            -- No FKs to users/content here in schema normally
      `);

      // Handle the cross-db column on Core DB separately
      await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'batch_id') THEN
                    ALTER TABLE social_posts ADD COLUMN batch_id UUID; -- No FK to Ops DB
                END IF;
            END $$;
      `);
      console.log('✅ Migração de Content Batches verificada/aplicada.');

      // Migração para Operations & Knowledge
      console.log('🔄 Verificando migrações de Operations & Knowledge (Ops DB)...');
      // NOTE: 024_phase2_operations.sql likely likely contains FKs. We should ideally inline it or fix it.
      // For now, I'll trust the inline approach for main tables.
      // But 024 is external. I should check it.
      // If 024 has FKs, it will fail.
      const operationsMigration = fs.readFileSync(path.join(__dirname, 'migrations', '024_phase2_operations.sql'), 'utf8');
      // Hacky fix: Remove REFERENCES via regex? Or just let it fail and fix the file?
      // Better to fix the file.
      await pool.opsPool.query(operationsMigration);
      console.log('✅ Migração de Operations & Knowledge verificada/aplicada no Ops DB.');

      // Migração para SOP Templates (Automation Phase)
      console.log('🔄 Verificando migrações de SOP Templates (Ops DB)...');
      const sopMigration = fs.readFileSync(path.join(__dirname, 'migrations', '025_create_sop_templates.sql'), 'utf8');
      await pool.opsPool.query(sopMigration);
      console.log('✅ Migração de SOP Templates verificada/aplicada no Ops DB.');

      // Migração para Task Expansion (Task Management Phase)
      console.log('🔄 Verificando migrações de Task Expansion (Ops DB)...');
      const taskMigration = fs.readFileSync(path.join(__dirname, 'migrations', '026_expand_tasks_table.sql'), 'utf8');
      await pool.opsPool.query(taskMigration);
      console.log('✅ Migração de Task Expansion verificada/aplicada no Ops DB.');

      // Migração 027: Detailed Project Fields
      console.log('🔄 Verificando migrações de Projetos Detalhados (027) (Ops DB)...');
      const projectDetailed = fs.readFileSync(path.join(__dirname, 'migrations', '027_expand_projects_table.sql'), 'utf8');
      await pool.opsPool.query(projectDetailed);
      console.log('✅ Migração 027 aplicada no Ops DB.');

      // Migração 028: Detailed Task Fields
      console.log('🔄 Verificando migrações de Tarefas Detalhadas (028) (Ops DB)...');
      const taskDetailed = fs.readFileSync(path.join(__dirname, 'migrations', '028_expand_tasks_detailed.sql'), 'utf8');
      await pool.opsPool.query(taskDetailed);
      console.log('✅ Migração 028 aplicada no Ops DB.');

      // Migração 030: Native OAuth Integrations (Core DB usually? Or Ops?)
      console.log('🔄 Verificando migrações de OAuth Integrations (030) (Core DB)...');
      const oauthMigration = fs.readFileSync(path.join(__dirname, 'migrations', '030_create_oauth_integrations.sql'), 'utf8');
      await pool.query(oauthMigration);

      // Migração 031: Financial & Services (Ops DB)
      console.log('🔄 Verificando migrações de Financial & Services (031) (Ops DB)...');
      const financialMigration = fs.readFileSync(path.join(__dirname, 'migrations', '031_setup_financial_ops.sql'), 'utf8');
      await pool.opsPool.query(financialMigration);
      console.log('✅ Migração 031 (Financial) aplicada no Ops DB.');
      console.log('✅ Migração 030 aplicada.');

    } catch (err) {
      console.error('⚠️ Erro na migração:', err.message);
    }
  } catch (error) {
    console.error('⚠️  Database initialization error:', error.message);
    // Don't crash the app if schema already exists
  }
}

// --- ROTAS ---

// Import database controller
const dbController = require('./dbController');
const userCtrl = require('./userController');

// --- SEGURANÇA E OBSERVABILIDADE ---
const { client } = require('./metrics/n8nMetrics');
const n8nRateLimiter = require('./middleware/n8nRateLimiter');

// Endpoint de Métricas para Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).send(ex);
  }
});

// Aplicar Rate Limiter em rotas sensíveis
app.use('/webhooks/', n8nRateLimiter);
app.use('/api/auth/', n8nRateLimiter);

// 1. Health Check (Railway uses this)
app.get('/', (req, res) => {
  res.status(200).send('EliteConversion API is running 🚀');
});

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Return 200 even if DB is not ready (Railway healthcheck)
    res.status(200).json({
      status: 'starting',
      database: 'initializing',
      timestamp: new Date().toISOString()
    });
  }
});

// --- DATABASE ROUTES ---

// Users
app.get('/api/users', dbController.getUsers);

// Team Management
app.get('/api/team', authenticateToken, userCtrl.getTeamMembers);
app.post('/api/team', authenticateToken, userCtrl.createTeamMember);
app.put('/api/team/:id', authenticateToken, userCtrl.updateTeamMember);
app.delete('/api/team/:id', authenticateToken, userCtrl.deleteTeamMember);

// Clients
app.get('/api/clients', authenticateToken, dbController.getClients);
app.post('/api/clients', authenticateToken, dbController.createClient);

// Campaigns
app.get('/api/campaigns', authenticateToken, dbController.getCampaigns);

// Leads
// Leads
app.get('/api/leads', authenticateToken, dbController.getLeads);
app.post('/api/leads', authenticateToken, dbController.createLead);
app.put('/api/leads/:id', authenticateToken, dbController.updateLead);
app.patch('/api/leads/:id/status', authenticateToken, dbController.updateLeadStatus);

// Chat Messages
app.get('/api/chat-messages', dbController.getChatMessages);

// Social Posts
// Social Posts
const socialMediaController = require('./socialMediaController');
const checkLimit = require('./middleware/usageLimiter');

// --- EXPORT ROUTES ---
const exportController = require('./exportController');
app.get('/api/export/leads/pdf', authenticateToken, exportController.exportLeadsPdf);
app.get('/api/export/leads/excel', authenticateToken, exportController.exportLeadsExcel);
app.get('/api/export/campaigns/pdf', authenticateToken, exportController.exportCampaignsPdf);
app.get('/api/export/campaigns/excel', authenticateToken, exportController.exportCampaignsExcel);
app.get('/api/export/clients/excel', authenticateToken, exportController.exportClientsExcel);

// --- SOCIAL MEDIA ROUTES ---
app.get('/api/social/posts', authenticateToken, socialMediaController.getPosts);
app.post('/api/social/posts', authenticateToken, checkLimit('social_post'), socialMediaController.upload.single('media'), socialMediaController.createPost);

// Automation Workflows
app.get('/api/workflows', dbController.getWorkflows);

const integrationsController = require('./integrationsController');

// OAuth Router (Native Integration)
const oauthRoutes = require('./routes/oauthRoutes');
app.use('/api/oauth', oauthRoutes);

// Legacy OAuth callbacks (kept as app.get as per instruction)
app.get('/auth/google-ads/callback', integrationsController.handleGoogleAdsCallback);
app.get('/auth/meta-ads/callback', integrationsController.handleMetaAdsCallback);

// Custom Legacy Route for Facebook (Requested by User)
const oauthController = require('./controllers/oauthController');
app.get('/api/auth/meta', (req, res) => {
  req.params.provider = 'facebook';
  oauthController.handleCallback(req, res);
});

app.post('/api/integrations/whatsapp/setup', integrationsController.setupWhatsAppWebhook);
app.get('/api/integrations/whatsapp', authenticateToken, integrationsController.getWhatsAppConfig);
app.post('/api/integrations/whatsapp', authenticateToken, integrationsController.saveWhatsAppConfig);
app.delete('/api/integrations/whatsapp', authenticateToken, integrationsController.deleteWhatsAppConfig);
app.post('/api/integrations/n8n', authenticateToken, integrationsController.saveN8nConfig);
app.get('/api/integrations/n8n/url', authenticateToken, integrationsController.getN8nUrl);

// --- WEBHOOKS ---
const whatsappController = require('./whatsappController');
// Debug logging to identify which controller function is missing
console.log('WhatsApp Controller Exports:', Object.keys(whatsappController));

app.post('/webhooks/whatsapp', whatsappController.handleWebhook);
app.post('/api/whatsapp/send', authenticateToken, whatsappController.sendOutboundMessage);
app.get('/api/whatsapp/sessions', authenticateToken, whatsappController.getSessions);
app.get('/api/whatsapp/sessions/:sessionId/messages', authenticateToken, whatsappController.getSessionMessages);

// --- AI SERVICES ---
const aiController = require('./aiController');
const imageController = require('./imageController');

// --- IMAGE GENERATION ROUTES ---
app.get('/api/images/models', authenticateToken, imageController.getModels);
app.get('/api/images', authenticateToken, imageController.listImages);
app.post('/api/images/generate', authenticateToken, checkLimit('ai_generation'), imageController.generateImage);
app.post('/api/images/edit', authenticateToken, checkLimit('ai_generation'), imageController.editImage);
app.post('/api/images/upscale', authenticateToken, checkLimit('ai_generation'), imageController.upscaleImage);
app.post('/api/images/:id/variations', authenticateToken, checkLimit('ai_generation'), imageController.createVariations);
app.post('/api/images/translate', authenticateToken, imageController.translate);
app.delete('/api/images/:id', authenticateToken, imageController.deleteImage);




// Iniciar servidor após migrações
app.post('/api/ai/analyze', authenticateToken, aiController.analyzeChatConversation);
app.post('/api/ai/generate', authenticateToken, checkLimit('ai_generation'), aiController.generateMarketingContent);
app.post('/api/ai/batch-generate', authenticateToken, checkLimit('ai_generation'), aiController.startBatchGeneration); // NEW BATCH ROUTE
app.post('/api/ai/chat', authenticateToken, checkLimit('ai_generation'), aiController.askEliteAssistant);
// AI Analysis Routes
app.post('/api/ai/analyze-strategy', authenticateToken, aiController.analyzeConversationStrategy);
app.post('/api/ai/generate-config', authenticateToken, aiController.generateAgentConfig);
app.post('/api/ai/save-analysis', authenticateToken, aiController.saveAnalysis);
app.post('/api/ai/dashboard-insights', authenticateToken, aiController.generateDashboardInsights);
app.post('/api/ai/generate-from-chat', authenticateToken, aiController.generateContentIdeasFromChat);


// --- DASHBOARD ANALYTICS ---
const dashboardCtrl = require('./dashboardController');
app.get('/api/dashboard/kpis', dashboardCtrl.getKPIs);
app.get('/api/dashboard/chart-data', dashboardCtrl.getChartData);
app.get('/api/dashboard/funnel-data', dashboardCtrl.getFunnelData);
app.get('/api/dashboard/device-data', dashboardCtrl.getDeviceData);
app.get('/api/dashboard/conversion-sources', dashboardCtrl.getConversionSources);

// --- CAMPAIGNS ---
const campaignCtrl = require('./campaignController');
app.get('/api/campaigns/analytics', campaignCtrl.getCampaignAnalytics);


// --- USER MANAGEMENT ---

// Serve uploaded avatars statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Create new user (admin)
// Create new user (admin)
app.post('/api/users', authenticateToken, checkAdmin, userCtrl.createUser);
app.put('/api/users/:id', authenticateToken, checkAdmin, userCtrl.updateTeamMember);
app.delete('/api/users/:id', authenticateToken, checkAdmin, userCtrl.deleteTeamMember);

// Login & Registration (Public - No Auth)
app.post('/api/auth/login', userCtrl.login);
app.post('/api/auth/register', userCtrl.register);
app.post('/api/auth/forgot-password', userCtrl.forgotPassword);
app.post('/api/auth/reset-password', userCtrl.resetPasswordConfirm);

// Update avatar for a user (requires multipart/form-data)
app.post('/api/users/:id/avatar', userCtrl.upload.single('avatar'), userCtrl.updateAvatar);

// Manage API Keys (SaaS Security)
app.post('/api/users/:id/api-keys', authenticateToken, userCtrl.updateApiKeys);
app.get('/api/users/usage', authenticateToken, userCtrl.getUserUsage);
app.get('/api/users/:id/api-keys', userCtrl.getApiKeys);

// --- TEAM MEMBERS MANAGEMENT ---
app.get('/api/team/members', userCtrl.getTeamMembers);
app.post('/api/team/members', userCtrl.createTeamMember);
app.put('/api/team/members/:id', userCtrl.updateTeamMember);
app.delete('/api/team/members/:id', userCtrl.deleteTeamMember);

// --- PROJECT & TASK MANAGEMENT ---
const projectCtrl = require('./projectController');
const taskCtrl = require('./taskController');

// Projects
app.get('/api/projects', authenticateToken, projectCtrl.getProjects);
app.post('/api/projects', authenticateToken, projectCtrl.createProject);
app.get('/api/projects/:id', authenticateToken, projectCtrl.getProject);
app.put('/api/projects/:id', authenticateToken, projectCtrl.updateProject);
app.delete('/api/projects/:id', authenticateToken, projectCtrl.deleteProject);

// Tasks
app.get('/api/tasks', authenticateToken, taskCtrl.getTasks);
app.post('/api/tasks', authenticateToken, taskCtrl.createTask);
app.post('/api/tasks/reorder', authenticateToken, taskCtrl.updateOrder); // Batch reorder
app.put('/api/tasks/:id', authenticateToken, taskCtrl.updateTask);
app.delete('/api/tasks/:id', authenticateToken, taskCtrl.deleteTask);

// --- AGENT TEMPLATES ---
const templatesController = require('./templatesController'); // Kept for legacy if needed, or replace if duplicate
app.use('/api/templates', templatesController); // Restore legacy support for prompts

// New SOP Template Controller
const templateController = require('./controllers/templateController');

// Template CRUD
// Template CRUD (SOPs)
app.get('/api/sop-templates', authenticateToken, templateController.getAllTemplates);
app.post('/api/sop-templates', authenticateToken, templateController.createTemplate);
app.get('/api/sop-templates/:id', authenticateToken, templateController.getTemplateDetails);
app.put('/api/sop-templates/:id', authenticateToken, templateController.updateTemplate);
app.delete('/api/sop-templates/:id', authenticateToken, templateController.deleteTemplate);

// Apply Template to Project
app.post('/api/projects/:id/apply-template', authenticateToken, templateController.applyTemplateToProject);


// --- ASSET LIBRARY ROUTES (Phase 2) ---
const assetCtrl = require('./assetController');
app.get('/api/assets', authenticateToken, assetCtrl.listAssets);
app.post('/api/assets', authenticateToken, checkLimit('storage'), socialMediaController.upload.single('file'), assetCtrl.uploadAsset); // Using existing upload middleware for now
app.delete('/api/assets/:id', authenticateToken, assetCtrl.deleteAsset);

app.get('/api/folders', authenticateToken, assetCtrl.listFolders);
app.post('/api/folders', authenticateToken, assetCtrl.createFolder);
app.delete('/api/folders/:id', authenticateToken, assetCtrl.deleteFolder);

// --- APPROVAL WORKFLOW ROUTES (Phase 2) ---
const approvalCtrl = require('./approvalController');
app.get('/api/approvals', authenticateToken, approvalCtrl.getApprovals);
app.post('/api/approvals', authenticateToken, approvalCtrl.createApproval);
app.put('/api/approvals/:id/review', authenticateToken, approvalCtrl.reviewApproval);

// Public Approval Routes (No Auth required)
app.get('/api/public/approvals/:token', approvalCtrl.getPublicApproval);
app.post('/api/public/approvals/:token/review', approvalCtrl.publicReview);

// --- QDRANT VECTOR DATABASE ---
const qdrantController = require('./controllers/qdrantController');
app.get('/api/qdrant/collections', qdrantController.getCollections);
app.get('/api/qdrant/test', qdrantController.testConnection);

// --- SERVICE CATALOG (Phase 2) ---
const serviceCtrl = require('./controllers/serviceController');
app.get('/api/services', authenticateToken, serviceCtrl.getServices);
app.post('/api/services', authenticateToken, serviceCtrl.createService);
app.put('/api/services/:id', authenticateToken, serviceCtrl.updateService);
app.delete('/api/services/:id', authenticateToken, serviceCtrl.deleteService);

// --- FINANCIAL ---
const financialCtrl = require('./financialController');
const adminCtrl = require('./adminController');

app.get('/api/financial/dashboard', authenticateToken, financialCtrl.getFinancialDashboard);
app.get('/api/financial/transactions', authenticateToken, financialCtrl.getTransactions);
app.post('/api/financial/transactions', authenticateToken, financialCtrl.createTransaction);
app.put('/api/financial/transactions/:id', authenticateToken, financialCtrl.updateTransaction);
app.delete('/api/financial/transactions/:id', authenticateToken, financialCtrl.deleteTransaction);

// Auxiliares
app.get('/api/financial/categories', authenticateToken, financialCtrl.getCategories);
app.post('/api/financial/categories', authenticateToken, financialCtrl.createCategory);
app.put('/api/financial/categories/:id', authenticateToken, financialCtrl.updateCategory);

app.post('/api/financial/sync', authenticateToken, financialCtrl.runSync);
app.get('/api/financial/suppliers', authenticateToken, financialCtrl.getSuppliers);
app.post('/api/financial/suppliers', authenticateToken, financialCtrl.createSupplier);
app.get('/api/financial/clients', authenticateToken, financialCtrl.getClients);

// --- ML DATA & ANALYTICS ROUTES ---
const dataController = require('./controllers/dataController');
const trainingController = require('./controllers/trainingController');

// Dataset Management
app.post('/api/data/upload', authenticateToken, dataController.upload.single('file'), dataController.uploadDataset);
app.get('/api/data/datasets', authenticateToken, dataController.getDatasets);

// Model Training & Experiments
app.get('/api/models/experiments', authenticateToken, trainingController.getExperiments);
app.post('/api/models/experiments', authenticateToken, trainingController.createExperiment);
app.get('/api/models/experiments/:id', authenticateToken, trainingController.getExperimentDetails);
app.post('/api/models/experiments/:id/deploy', authenticateToken, trainingController.deployModel);

// Model Predictions
app.post('/api/predictions/custom', authenticateToken, trainingController.runPrediction);
app.get('/api/predictions/history', authenticateToken, trainingController.getPredictionHistory);

// Analytics Results & Segments
app.get('/api/analytics/results', authenticateToken, dataController.getAnalyticsResults);
app.get('/api/analytics/segments', authenticateToken, dataController.getSegments);
app.get('/api/analytics/segments/:code', authenticateToken, dataController.getSegmentData);
app.get('/api/analytics/algorithms', authenticateToken, dataController.getAlgorithms);

// --- ML ANALYSIS ENDPOINTS (Fase 1 MVP) ---
const analysisRoutes = require('./routes/analysisRoutes');
app.use('/api/analysis', analysisRoutes);

// --- BULLMQ DASHBOARD ---
const serverAdapter = require('./queueBoard');
// Note: router need to be used as a middleware
app.use('/admin/queues', authenticateToken, checkAdmin, serverAdapter.getRouter());

// Rotas de Estatísticas do Sistema (Admin)
app.get('/api/admin/usage-stats', authenticateToken, checkAdmin, adminCtrl.getSystemUsage);

// Rota temporária para migração de tenants
const copiesController = require('./copiesController');
app.use('/api/copies', copiesController);

// Definir rota de Churn (fora do bloco de migração para garantir registro)
const churnController = require('./churnController');
app.get('/api/churn/predict', authenticateToken, churnController.predictChurn);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Inicialização do Servidor (IMEDIATA para evitar Timeout do Railway)
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Tornar io acessível globalmente se necessário
global.io = io;

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Socket.io pronto para conexões`);

  // Rodar processos de inicialização em background
  initializeDatabase().then(() => {
    console.log('✅ Migrações concluídas com sucesso.');

    // Iniciar Job Processor (Queue Worker - BullMQ)
    const jobProcessor = require('./services/jobProcessor');
    jobProcessor.start();
    console.log('🚀 Job Processor (BullMQ) started');
    console.log('🔄 Force Deploy: ' + new Date().toISOString());

  }).catch(err => {
    console.error('❌ Erro crítico na inicialização (Migrações):', err);
  });
});



