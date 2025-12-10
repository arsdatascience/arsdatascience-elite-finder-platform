

console.log('🚀 STARTING SERVER INITIALIZATION...');

// --- CRITICAL DEBUG: Catch startup errors ---
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION AT STARTUP:', err);
  // Keep process alive for a moment to ensure logs are flushed if possible, or exit
  // process.exit(1); 
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION AT STARTUP:', reason);
});

require('dotenv').config();
console.log('✅ Environment loaded');

const express = require('express');
console.log('✅ Express imported');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
console.log('✅ Express App created');

// --- IMMEDIATE HEALTH CHECK (For Railway) ---
app.get('/', (req, res) => res.status(200).send('EliteConversion API Booting...'));
app.get('/health-check', (req, res) => res.status(200).send('OK'));
console.log('✅ Health check routes defined');

app.set('trust proxy', 1); // Necessário para Railway/Vercel e rate-limiter
// const PORT = process.env.PORT || 3001; // Moved to bottom for immediate start


// Middleware
const authenticateToken = require('./middleware/auth');
const helmet = require('helmet');

// =========================================================
// CRITICAL: CORS CONFIGURATION - MUST BE BEFORE ALL ELSE
// =========================================================
const allowedOrigins = [
  'https://marketinghub.aiiam.com.br',
  'https://elitefinder.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(url => {
    const cleanUrl = url.trim().replace(/\/$/, '');
    if (cleanUrl && !allowedOrigins.includes(cleanUrl)) {
      allowedOrigins.push(cleanUrl);
    }
  });
}

// CORS Options
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

// 1. FIRST: Handle OPTIONS preflight requests IMMEDIATELY
app.options('*', (req, res) => {
  const origin = req.headers.origin;

  // Only allow whitelisted origins
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.status(200).end();
});

// 2. SECOND: Apply CORS headers to ALL requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  next();
});

// 3. THIRD: CORS package as backup
app.use(cors(corsOptions));

// 4. FOURTH: Helmet security (AFTER CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// 5. Compression
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

// Rotas de Admin - Gestão de Tenants (Empresas)
const tenantController = require('./tenantController');
app.get('/api/admin/tenants', authenticateToken, checkAdmin, tenantController.getAllTenants);
app.post('/api/admin/tenants', authenticateToken, checkAdmin, tenantController.createTenant);
app.put('/api/admin/tenants/:id', authenticateToken, checkAdmin, tenantController.updateTenant);
app.delete('/api/admin/tenants/:id', authenticateToken, checkAdmin, tenantController.deleteTenant);
app.put('/api/tenant/me', authenticateToken, tenantController.updateMyTenant);

// Rota de Análise de Áudio (Whisper + GPT-4o)
const audioController = require('./audioController');
app.post('/api/audio/analyze', authenticateToken, audioController.uploadMiddleware, audioController.analyzeAudio);
app.get('/api/audio/history', authenticateToken, audioController.getHistory);
app.get('/api/audio/analysis/:id', authenticateToken, audioController.getAnalysis);
app.delete('/api/audio/analysis/:id', authenticateToken, audioController.deleteAnalysis);

// ML Agent Routes (AI-powered analytics via natural language)
const mlAgentRoutes = require('./routes/mlAgent.routes');
app.use('/api/ml-agent', mlAgentRoutes);

// Cross-Database Unified Routes (Crossover + Maglev integration)
const crossDatabaseController = require('./crossDatabaseController');
app.get('/api/unified/customer/:customerId', authenticateToken, crossDatabaseController.getUnifiedCustomerView);
app.get('/api/unified/customer/:customerId/ml-insights', authenticateToken, crossDatabaseController.getCustomerMlInsights);
app.get('/api/unified/dashboard', authenticateToken, crossDatabaseController.getUnifiedDashboard);

// Email Routes (SMTP configuration and sending - supports multiple)
const emailController = require('./emailController');
app.post('/api/email/test', authenticateToken, emailController.testEmail);
app.post('/api/email/config', authenticateToken, emailController.saveConfig);
app.get('/api/email/config', authenticateToken, emailController.getConfig);
app.delete('/api/email/config/:id', authenticateToken, emailController.deleteConfig);
app.put('/api/email/config/:id/default', authenticateToken, emailController.setDefault);
app.post('/api/email/send', authenticateToken, emailController.sendEmail);

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

    // ============================================
    // CRITICAL: Create unified_customers table (CDP) - independent block
    // ============================================
    console.log('🔄 Verificando tabela unified_customers (CDP)...');
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS unified_customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id INTEGER,
          client_id INTEGER,
          email VARCHAR(255),
          phone VARCHAR(50),
          whatsapp_number VARCHAR(50),
          name VARCHAR(255),
          facebook_id VARCHAR(100),
          instagram_id VARCHAR(100),
          google_id VARCHAR(100),
          linkedin_id VARCHAR(100),
          tiktok_id VARCHAR(100),
          preferred_channel VARCHAR(50) DEFAULT 'whatsapp',
          communication_frequency VARCHAR(20) DEFAULT 'medium',
          best_contact_time VARCHAR(50),
          language VARCHAR(10) DEFAULT 'pt-BR',
          timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
          current_stage VARCHAR(50) DEFAULT 'awareness',
          last_channel VARCHAR(50),
          last_interaction TIMESTAMP,
          total_touchpoints INTEGER DEFAULT 0,
          channel_mix JSONB DEFAULT '{}',
          lifetime_value DECIMAL(12,2) DEFAULT 0,
          avg_order_value DECIMAL(12,2) DEFAULT 0,
          purchase_count INTEGER DEFAULT 0,
          tags TEXT[],
          segments TEXT[],
          cart_items JSONB,
          cart_value DECIMAL(12,2) DEFAULT 0,
          cart_updated_at TIMESTAMP,
          first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_unified_customers_tenant ON unified_customers(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_unified_customers_email ON unified_customers(email);
        CREATE INDEX IF NOT EXISTS idx_unified_customers_phone ON unified_customers(phone);
      `);
      console.log('✅ Tabela unified_customers (CDP) verificada/criada.');
    } catch (cdpErr) {
      console.log('⚠️ unified_customers já existe ou erro:', cdpErr.message);
    }

    // Migração Automática para Analytics de Imagens
    console.log('🔄 Verificando migrações de Analytics...');
    try {
      await pool.query(`
            ALTER TABLE generated_images 
            ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS url TEXT,
            ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
            ADD COLUMN IF NOT EXISTS prompt TEXT,
            ADD COLUMN IF NOT EXISTS model VARCHAR(100),
            ADD COLUMN IF NOT EXISTS width INTEGER,
            ADD COLUMN IF NOT EXISTS height INTEGER,
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
      console.log('🔄 Verificando migrações de Project Management...');
      await pool.query(`
          -- 1. PROJECTS TABLE
          CREATE TABLE IF NOT EXISTS projects (
              id SERIAL PRIMARY KEY,
              tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
              client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
              owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
              
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

          CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
          CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

          -- 2. PROJECT MEMBERS
          CREATE TABLE IF NOT EXISTS project_members (
              project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
              user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
              role VARCHAR(50) DEFAULT 'member',
              joined_at TIMESTAMP DEFAULT NOW(),
              PRIMARY KEY (project_id, user_id)
          );

          -- 3. TASKS TABLE
          CREATE TABLE IF NOT EXISTS tasks (
              id SERIAL PRIMARY KEY,
              tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
              project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
              parent_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
              
              title VARCHAR(255) NOT NULL,
              description TEXT,
              
              status VARCHAR(50) DEFAULT 'todo',
              priority VARCHAR(20) DEFAULT 'medium',
              
              assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
              reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
              
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
              task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
              user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
              
              content TEXT NOT NULL,
              is_internal BOOLEAN DEFAULT false,
              
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
          );
          
          -- 5. PROJECT ACTIVITY LOG
          CREATE TABLE IF NOT EXISTS project_activity_log (
              id SERIAL PRIMARY KEY,
              tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
              project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
              task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
              user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
              
              action_type VARCHAR(50) NOT NULL,
              details JSONB,
              
              created_at TIMESTAMP DEFAULT NOW()
          );
      `);
      console.log('✅ Migração de Project Management verificada/aplicada.');

      // Migração para Operations & Knowledge (Digital Maturity Phase 2)
      console.log('🔄 Verificando migrações de Operations & Knowledge...');
      const operationsMigration = fs.readFileSync(path.join(__dirname, 'migrations', '024_phase2_operations.sql'), 'utf8');
      await pool.query(operationsMigration);
      console.log('✅ Migração de Operations & Knowledge verificada/aplicada.');

      // Migração para SOP Templates (Automation Phase)
      console.log('🔄 Verificando migrações de SOP Templates...');
      const sopMigration = fs.readFileSync(path.join(__dirname, 'migrations', '025_create_sop_templates.sql'), 'utf8');

      // Use helper to run split statements if needed, or just query if file is simple
      // Since 025 has triggers, we should treat it carefully.
      // But for now, assuming simple query execution or simple split if supported.
      // Ideally reuse the parser logic above, but for quick fix:
      await pool.query(sopMigration);
      console.log('✅ Migração de SOP Templates verificada/aplicada.');

      // Migração para Task Expansion (Task Management Phase)
      console.log('🔄 Verificando migrações de Task Expansion...');
      const taskMigration = fs.readFileSync(path.join(__dirname, 'migrations', '026_expand_tasks_table.sql'), 'utf8');
      await pool.query(taskMigration);
      console.log('✅ Migração de Task Expansion verificada/aplicada.');

      // Migração 027: Detailed Project Fields
      console.log('🔄 Verificando migrações de Projetos Detalhados (027)...');
      const projectDetailed = fs.readFileSync(path.join(__dirname, 'migrations', '027_expand_projects_table.sql'), 'utf8');
      await pool.query(projectDetailed);
      console.log('✅ Migração 027 aplicada.');

      // Migração 028: Detailed Task Fields
      console.log('🔄 Verificando migrações de Tarefas Detalhadas (028)...');
      const taskDetailed = fs.readFileSync(path.join(__dirname, 'migrations', '028_expand_tasks_detailed.sql'), 'utf8');
      await pool.query(taskDetailed);
      console.log('✅ Migração 028 aplicada.');

      // Migração 030: Native OAuth Integrations
      console.log('🔄 Verificando migrações de OAuth Integrations (030)...');
      try {
        const oauthMigration = fs.readFileSync(path.join(__dirname, 'migrations', '030_create_oauth_integrations.sql'), 'utf8');
        await pool.query(oauthMigration);
        console.log('✅ Migração 030 aplicada.');
      } catch (oauthErr) {
        console.log('⚠️ OAuth Integrations (030) já existe ou erro ignorável:', oauthErr.message);
      }

      // Migração 041: Drop empty financial tables from Crossover (they live in Maglev/OPS now)
      console.log('🔄 Limpando tabelas financeiras vazias do Crossover (041)...');
      try {
        await pool.query('DROP TABLE IF EXISTS financial_transactions CASCADE;');
        await pool.query('DROP TABLE IF EXISTS financial_categories CASCADE;');
        console.log('✅ Tabelas financeiras removidas do Crossover (agora estão no Maglev).');
      } catch (dropErr) {
        console.log('⚠️ Tabelas financeiras já removidas ou não existem:', dropErr.message);
      }

      // Migração 042: Omnichannel CDP Foundation
      console.log('🔄 Verificando migrações de Omnichannel CDP (042)...');
      try {
        // Drop old tables to ensure FKs and schema updates - COMMENTED OUT TO PRESERVE DATA AFTER FIX
        /*
        await pool.query(`
          DROP TABLE IF EXISTS conversion_events CASCADE;
          DROP TABLE IF EXISTS customer_journeys CASCADE;
          DROP TABLE IF EXISTS customer_interactions CASCADE;
          DROP TABLE IF EXISTS identity_graph CASCADE;
          DROP TABLE IF EXISTS journey_step_templates CASCADE;
          DROP TABLE IF EXISTS unified_customers CASCADE;
        `);
        */
        const omnichannelMigration = fs.readFileSync(path.join(__dirname, 'migrations', '042_omnichannel_foundation.sql'), 'utf8');
        await pool.query(omnichannelMigration);
        console.log('✅ Migração 042 (Omnichannel Foundation) aplicada.');
      } catch (cdpErr) {
        console.log('⚠️ Omnichannel CDP já existe ou erro:', cdpErr.message);
      }

      // Migração 043: KPI and Satisfaction Metrics
      console.log('🔄 Verificando migrações de KPIs e Satisfação (043)...');
      try {
        const kpiMigration = fs.readFileSync(path.join(__dirname, 'migrations', '043_kpi_satisfaction_metrics.sql'), 'utf8');
        await pool.query(kpiMigration);
        console.log('✅ Migração 043 (KPI Metrics) aplicada.');
      } catch (kpiErr) {
        console.log('⚠️ KPI tables já existem ou erro:', kpiErr.message);
      }

      // Migração 034: ML Module Schema (all result tables) - lives in OPS/Maglev
      console.log('🔄 Verificando migrações de ML Module Schema (034) no Maglev...');
      try {
        // Drop old tables with FK constraints to recreate without FKs - COMMENTED OUT TO PRESERVE DATA
        /*
        console.log('🗑️ Removendo tabelas ML antigas para recriar sem FKs...');
        await pool.opsPool.query(`
          -- Drop ALL ml tables to ensure FKs are removed
          DROP TABLE IF EXISTS ml_regression_results CASCADE;
          DROP TABLE IF EXISTS ml_classification_results CASCADE;
          DROP TABLE IF EXISTS ml_clustering_results CASCADE;
          DROP TABLE IF EXISTS ml_timeseries_results CASCADE;
          DROP TABLE IF EXISTS ml_predictions CASCADE;
          DROP TABLE IF EXISTS ml_sales_analytics CASCADE;
          DROP TABLE IF EXISTS ml_marketing_analytics CASCADE;
          DROP TABLE IF EXISTS ml_customer_analytics CASCADE;
          DROP TABLE IF EXISTS ml_financial_analytics CASCADE;
          DROP TABLE IF EXISTS ml_algorithm_configs CASCADE;
          DROP TABLE IF EXISTS ml_experiments CASCADE;
          DROP TABLE IF EXISTS ml_datasets CASCADE;
        `);
        console.log('✅ Tabelas ML antigas removidas.');
        */

        const mlModuleMigration = fs.readFileSync(path.join(__dirname, 'migrations', '034_ml_module_schema.sql'), 'utf8');
        await pool.opsPool.query(mlModuleMigration);
        console.log('✅ Migração 034 (ML Module Schema) aplicada no Maglev.');
      } catch (mlModuleErr) {
        console.log('⚠️ ML Module Schema já existe ou erro:', mlModuleErr.message);
      }


      // Migração 035: ML Industry Segments (ml_segment_analytics, ml_viz_*) - lives in OPS/Maglev
      console.log('🔄 Verificando migrações de ML Industry Segments (035) no Maglev...');
      try {
        // Drop old viz tables with FK constraints
        console.log('🗑️ Removendo tabelas ml_viz antigas...');
        await pool.opsPool.query(`
          DROP TABLE IF EXISTS ml_viz_regression CASCADE;
          DROP TABLE IF EXISTS ml_viz_classification CASCADE;
          DROP TABLE IF EXISTS ml_viz_clustering CASCADE;
          DROP TABLE IF EXISTS ml_viz_timeseries CASCADE;
          DROP TABLE IF EXISTS ml_segment_analytics CASCADE;
          DROP TABLE IF EXISTS ml_industry_segments CASCADE;
        `);
        console.log('✅ Tabelas ml_viz antigas removidas.');

        const mlSegmentMigration = fs.readFileSync(path.join(__dirname, 'migrations', '035_ml_industry_segments.sql'), 'utf8');
        await pool.opsPool.query(mlSegmentMigration);
        console.log('✅ Migração 035 (ML Segments) aplicada no Maglev.');
      } catch (mlSegmentErr) {
        console.log('⚠️ ML Segments já existe ou erro:', mlSegmentErr.message);
      }


      // Migração 044: ML Algorithm Configs and History (lives in OPS/Maglev DB)
      console.log('🔄 Verificando migrações de ML Algorithm Configs (044) no Maglev...');
      try {
        // Drop old table structure (from 034) to recreate with new structure (044)
        // Use pool.opsPool because all ML tables live in Maglev (OPS) database
        await pool.opsPool.query('DROP TABLE IF EXISTS ml_algorithm_config_history CASCADE;');
        await pool.opsPool.query('DROP TABLE IF EXISTS ml_algorithm_configs CASCADE;');
        console.log('🗑️ Tabelas ML antigas removidas (Maglev/OPS).');

        const mlConfigMigration = fs.readFileSync(path.join(__dirname, 'migrations', '044_ml_algorithm_configs.sql'), 'utf8');
        await pool.opsPool.query(mlConfigMigration);
        console.log('✅ Migração 044 (ML Configs) aplicada no Maglev.');
      } catch (mlConfigErr) {
        console.log('⚠️ ML Configs erro:', mlConfigErr.message);
      }

    } catch (err) {
      console.error('⚠️ Erro na migração:', err.message);
    }
  } catch (error) {
    console.error('⚠️  Database initialization error:', error.message);
    // Don't crash the app if schema already exists
  }
}

// Run schema initialization
// Last updated: 2025-11-24 22:38
// Run schema initialization
// Last updated: 2025-11-24 22:38
// initializeDatabase(); // Moved to server.listen to ensure order

// --- SOCIAL ---
const socialCtrl = require('./socialController');
app.get('/api/social/posts', socialCtrl.getPosts);
app.post('/api/social/posts', socialCtrl.createPost);
app.put('/api/social/posts/:id', socialCtrl.updatePost);
app.delete('/api/social/posts/:id', socialCtrl.deletePost);
app.get('/api/social/holidays', socialCtrl.getHolidays);

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

// --- WEBHOOKS ---
const whatsappController = require('./whatsappController');
// Debug logging to identify which controller function is missing
console.log('WhatsApp Controller Exports:', Object.keys(whatsappController));

app.post('/webhooks/whatsapp', whatsappController.handleWebhook);
app.post('/api/whatsapp/send', authenticateToken, whatsappController.sendOutboundMessage);
app.get('/api/whatsapp/sessions', authenticateToken, whatsappController.getSessions);
app.get('/api/whatsapp/sessions/:sessionId/messages', authenticateToken, whatsappController.getSessionMessages);
app.delete('/api/whatsapp/sessions/:sessionId', authenticateToken, whatsappController.deleteSession);

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

// --- KPI & CUSTOMER JOURNEY ROUTES ---
const kpiController = require('./kpiController');
const CustomerService = require('./services/customerService');

// Dashboard KPIs
app.get('/api/kpis/dashboard', authenticateToken, kpiController.getDashboardKPIs);
app.get('/api/kpis/journey', authenticateToken, kpiController.getJourneyAnalytics);

// NPS Surveys
app.post('/api/kpis/nps', authenticateToken, kpiController.submitNPSSurvey);
app.get('/api/kpis/nps/history', authenticateToken, kpiController.getNPSHistory);

// CSAT Surveys
app.post('/api/kpis/csat', authenticateToken, kpiController.submitCSATSurvey);

// Employee Happiness
app.post('/api/kpis/happiness', authenticateToken, kpiController.submitHappinessSurvey);
app.get('/api/kpis/happiness/history', authenticateToken, kpiController.getHappinessHistory);

// Unified Customer API
app.get('/api/customers/unified', authenticateToken, kpiController.getUnifiedCustomers);
app.get('/api/customers/unified/:id', authenticateToken, kpiController.getUnifiedCustomerDetails);




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

// Login
app.post('/api/auth/login', userCtrl.login);
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
const templatesController = require('./templatesController'); // Agent templates from agent_templates table
// New SOP Template Controller
const templateController = require('./controllers/templateController');

// Agent Templates (from agent_templates table) - For Agent Builder
app.use('/api/agent-templates', templatesController);

// SOP Template CRUD (from templates table)
app.get('/api/templates', authenticateToken, templateController.getAllTemplates);
app.post('/api/templates', authenticateToken, templateController.createTemplate);
app.get('/api/templates/:id', authenticateToken, templateController.getTemplateDetails);
app.put('/api/templates/:id', authenticateToken, templateController.updateTemplate);
app.delete('/api/templates/:id', authenticateToken, templateController.deleteTemplate);

// Apply Template to Project
app.post('/api/projects/:id/apply-template', authenticateToken, templateController.applyTemplateToProject);


// --- ASSET LIBRARY ROUTES (Phase 2) ---
const assetCtrl = require('./assetController');
app.get('/api/assets', authenticateToken, assetCtrl.listAssets);
app.post('/api/assets', authenticateToken, checkLimit('storage'), socialMediaController.upload.single('file'), assetCtrl.uploadAsset); // Using existing upload middleware for now
app.delete('/api/assets/:id', authenticateToken, assetCtrl.deleteAsset);
app.get('/api/assets/:id/download', authenticateToken, assetCtrl.downloadAsset);

app.get('/api/folders', authenticateToken, assetCtrl.listFolders);
app.post('/api/folders', authenticateToken, assetCtrl.createFolder);
app.delete('/api/folders/:id', authenticateToken, assetCtrl.deleteFolder);

// --- ML ALGORITHM CONFIGURATION ROUTES ---
const mlConfigCtrl = require('./mlConfigController');
app.get('/api/ml/configs', authenticateToken, mlConfigCtrl.list);
app.get('/api/ml/configs/:algorithmId', authenticateToken, mlConfigCtrl.getByAlgorithm);
app.post('/api/ml/configs', authenticateToken, mlConfigCtrl.create);
app.put('/api/ml/configs/:id', authenticateToken, mlConfigCtrl.update);
app.delete('/api/ml/configs/:id', authenticateToken, mlConfigCtrl.delete);
app.get('/api/ml/holidays', authenticateToken, mlConfigCtrl.getHolidays);
app.post('/api/ml/holidays', authenticateToken, mlConfigCtrl.addHoliday);
app.get('/api/ml/configs/:id/history', authenticateToken, mlConfigCtrl.getHistory);

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

// --- AI INSIGHTS (Customer Journey) ---
const insightsController = require('./insightsController');
app.post('/api/insights/customer-journey', authenticateToken, insightsController.generateCustomerJourneyInsight);
app.get('/api/insights/recent', authenticateToken, insightsController.getRecentInsights);
app.get('/api/insights/:id', authenticateToken, insightsController.getInsightById);

// --- BULK DATA IMPORT ---
const bulkImportCtrl = require('./bulkImportController');
app.get('/api/import/tables', authenticateToken, bulkImportCtrl.listTables);
app.get('/api/import/template/:tableName', authenticateToken, bulkImportCtrl.getTemplate);
app.post('/api/import/preview', authenticateToken, bulkImportCtrl.upload.single('file'), bulkImportCtrl.previewData);
// IMPORTANT: /batch route MUST come BEFORE /:tableName to avoid 'batch' being captured as tableName
app.post('/api/import/batch', authenticateToken, bulkImportCtrl.upload.array('files', 50), bulkImportCtrl.batchImport);
app.post('/api/import/:tableName', authenticateToken, bulkImportCtrl.upload.single('file'), bulkImportCtrl.importData);

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

// --- BULLMQ DASHBOARD ---
// --- BULLMQ DASHBOARD ---
let serverAdapter; // Declare outside try-catch
try {
  console.log('🔌 Initializing Queue Board...');
  serverAdapter = require('./queueBoard');
  // Note: router need to be used as a middleware
  app.use('/admin/queues', authenticateToken, checkAdmin, serverAdapter.getRouter());
  console.log('✅ Queue Board initialized');
} catch (err) {
  console.error('⚠️ Failed to initialize Queue Board (Redis issue?):', err.message);
  // Continue without Queue Board
}

// Rotas de Estatísticas do Sistema (Admin)
app.get('/api/admin/usage-stats', authenticateToken, checkAdmin, adminCtrl.getSystemUsage);

// Rota temporária para migração de tenants
const copiesController = require('./copiesController');
app.use('/api/copies', copiesController);

// Definir rota de Churn (fora do bloco de migração para garantir registro)
const churnController = require('./churnController');
app.get('/api/churn/predict', authenticateToken, churnController.predictChurn);

// ============================================
// STUB ROUTES - Endpoints pendentes de implementação
// ============================================

// SOP Templates
app.get('/api/sop-templates', authenticateToken, async (req, res) => {
  try {
    const result = await pool.opsPool.query('SELECT * FROM templates ORDER BY created_at DESC');
    res.json(result.rows); // Frontend expects array directly
  } catch (err) {
    console.error('Error fetching SOP templates:', err);
    res.json([]); // Return empty array on error
  }
});

app.post('/api/sop-templates', authenticateToken, async (req, res) => {
  res.json({ success: true, message: 'Template created' });
});

// --- DATA & MARKET ANALYSIS ROUTES ---
const dataController = require('./controllers/dataController');

// Datasets
app.post('/api/data/upload', authenticateToken, dataController.upload.single('file'), dataController.uploadDataset);
app.get('/api/data/datasets', authenticateToken, dataController.getDatasets);

// Analytics & Segments
app.get('/api/analytics/results', authenticateToken, dataController.getAnalyticsResults);
app.get('/api/analytics/segments', authenticateToken, dataController.getSegments);
app.get('/api/analytics/segments/:code', authenticateToken, dataController.getSegmentData);
app.get('/api/analytics/algorithms', authenticateToken, dataController.getAlgorithms);


// Training modules
app.get('/api/training/modules', authenticateToken, async (req, res) => {
  res.json({ success: true, modules: [] });
});

app.get('/api/training/progress', authenticateToken, async (req, res) => {
  res.json({ success: true, progress: { completed: 0, total: 0 } });
});

// Integrations N8N URL
app.get('/api/integrations/n8n/url', authenticateToken, (req, res) => {
  res.json({
    success: true,
    url: process.env.N8N_EDITOR_URL || 'https://arsdatascience-n8n.aiiam.com.br'
  });
});

// WhatsApp Integration Status
app.get('/api/integrations/whatsapp', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    connected: true,
    instanceName: 'elite-finder'
  });
});

// Client Social Accounts
app.get('/api/clients/:id/social-accounts', authenticateToken, async (req, res) => {
  res.json({ success: true, accounts: [] });
});

// Admin Queue Status
app.get('/api/admin/queue-status', authenticateToken, checkAdmin, async (req, res) => {
  res.json({
    success: true,
    queues: {
      whatsapp: { waiting: 0, active: 0, completed: 0, failed: 0 },
      email: { waiting: 0, active: 0, completed: 0, failed: 0 }
    }
  });
});

// Admin Tenants
app.get('/api/admin/tenants', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
    res.json({ success: true, tenants: result.rows });
  } catch (err) {
    res.json({ success: true, tenants: [] });
  }
});

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
// Tornar io acessível globalmente se necessário
global.io = io;
app.set('io', io); // Critical: Allow controllers to access io via req.app.get('io')

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Required for Railway/Docker containers
server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando em ${HOST}:${PORT}`);
  console.log(`📡 Socket.io pronto para conexões`);

  // Rodar processos de inicialização em background
  initializeDatabase().then(() => {
    console.log('✅ Migrações concluídas com sucesso.');

    // Iniciar Job Processor (Queue Worker - BullMQ)
    const jobProcessor = require('./services/jobProcessor');
    jobProcessor.start();
    console.log('🚀 Job Processor (BullMQ) started');

    // Iniciar ML Alert Scheduler (Proactive Alerts)
    const mlAlertScheduler = require('./workers/mlAlertScheduler');
    mlAlertScheduler.start();

    console.log('🔄 Force Deploy: ' + new Date().toISOString());

  }).catch(err => {
    console.error('❌ Erro crítico na inicialização (Migrações):', err);
  });
});



