

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.set('trust proxy', 1); // Necessário para Railway/Vercel e rate-limiter
const PORT = process.env.PORT || 3001;

// Middleware
const authenticateToken = require('./middleware/auth');
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://marketinghub.aiiam.com.br',
      'https://elitefinder.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    // Adiciona origens do env se houver (suporta lista separada por vírgula)
    if (process.env.FRONTEND_URL) {
      process.env.FRONTEND_URL.split(',').forEach(url => {
        if (url) allowedOrigins.push(url.trim().replace(/\/$/, '')); // Remove barra final se houver
      });
    }

    // Permitir requests sem origin (como mobile apps ou curl) ou se estiver na lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`[CORS] Bloqueado: ${origin} (Permitidos: ${allowedOrigins.join(', ')})`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
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
initializeDatabase();

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
app.get('/api/team', userCtrl.getTeamMembers);
app.post('/api/team', userCtrl.createTeamMember);
app.put('/api/team/:id', userCtrl.updateTeamMember);
app.delete('/api/team/:id', userCtrl.deleteTeamMember);

// Clients
app.get('/api/clients', dbController.getClients);
app.post('/api/clients', dbController.createClient);

// Campaigns
app.get('/api/campaigns', dbController.getCampaigns);

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

// --- SOCIAL MEDIA ROUTES ---
app.get('/api/social-posts', socialMediaController.getPosts);
app.post('/api/social-posts', authenticateToken, checkLimit('social_post'), socialMediaController.upload.single('media'), socialMediaController.createPost);

// Automation Workflows
app.get('/api/workflows', dbController.getWorkflows);

const integrationsController = require('./integrationsController');

// OAuth callbacks (kept as app.get as per instruction)
app.get('/auth/google-ads/callback', integrationsController.handleGoogleAdsCallback);
app.get('/auth/meta-ads/callback', integrationsController.handleMetaAdsCallback);

app.post('/api/integrations/whatsapp/setup', integrationsController.setupWhatsAppWebhook);
app.post('/api/integrations/n8n', authenticateToken, integrationsController.saveN8nConfig);

// --- WEBHOOKS ---
app.post('/webhooks/whatsapp', (req, res) => {
  const { from, message } = req.body;
  console.log(`Nova mensagem de ${from}: ${message}`);
  // Lógica futura: Integrar com tabela chat_logs e chamar Gemini API
  res.status(200).send('EVENT_RECEIVED');
});

// --- AI SERVICES ---
const aiController = require('./aiController');

app.post('/api/ai/analyze', authenticateToken, aiController.analyzeChatConversation);
app.post('/api/ai/generate', authenticateToken, checkLimit('ai_generation'), aiController.generateMarketingContent);
app.post('/api/ai/chat', authenticateToken, checkLimit('ai_generation'), aiController.askEliteAssistant);
// AI Analysis Routes
app.post('/api/ai/analyze-strategy', authenticateToken, aiController.analyzeConversationStrategy);
app.post('/api/ai/generate-config', authenticateToken, aiController.generateAgentConfig);
app.post('/api/ai/save-analysis', authenticateToken, aiController.saveAnalysis);


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
app.get('/api/campaigns', dbController.getCampaigns); // Manter compatibilidade se necessário

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

// --- AGENT TEMPLATES ---
const templatesController = require('./templatesController');
app.use('/api/templates', templatesController);

// --- QDRANT VECTOR DATABASE ---
const qdrantController = require('./qdrantController');
app.use('/api/qdrant', qdrantController);


// --- SOCIAL MEDIA INTEGRATIONS ---
const socialIntegration = require('./socialIntegrationController');
app.get('/api/auth/meta', socialIntegration.initiateMetaAuth);
app.get('/api/auth/meta/callback', socialIntegration.handleMetaCallback);
app.get('/api/auth/linkedin', socialIntegration.initiateLinkedInAuth);
app.get('/api/auth/linkedin/callback', socialIntegration.handleLinkedInCallback);
app.get('/api/auth/twitter', socialIntegration.initiateTwitterAuth);
app.get('/api/auth/twitter/callback', socialIntegration.handleTwitterCallback);

// Publishing Routes
app.post('/api/social/publish/instagram', socialIntegration.publishToInstagram);
app.post('/api/social/publish/linkedin', socialIntegration.publishToLinkedIn);
app.post('/api/social/publish/twitter', socialIntegration.publishToTwitter);

// --- SOCIAL ACCOUNTS MANAGEMENT ---
const socialAccountCtrl = require('./socialAccountController');
app.get('/api/clients', dbController.getClients);
app.get('/api/clients/:clientId/social-accounts', socialAccountCtrl.getSocialAccounts);

// --- ADMIN UTILS ---
const seedController = require('./admin/seedController');
app.get('/api/admin/seed-campaigns', seedController.seedCampaigns);
app.post('/api/social-accounts', socialAccountCtrl.addSocialAccount);
app.delete('/api/social-accounts/:accountId', socialAccountCtrl.deleteSocialAccount);

// Analytics Routes
app.get('/api/social/insights/instagram', socialIntegration.getInstagramInsights);
app.get('/api/social/analytics/linkedin', socialIntegration.getLinkedInAnalytics);
app.get('/api/social/metrics/twitter', socialIntegration.getTwitterMetrics);


// Iniciar Servidor com Socket.io
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Tornar io acessível globalmente ou passar para controllers
app.set('io', io);

// --- ADMIN TOOLS ---
const adminCtrl = require('./adminController');
const seedCtrl = require('./seedController');
const resetCtrl = require('./resetController');
app.get('/api/seed-campaigns', seedCtrl.seedCampaigns);
app.get('/api/reset-password', resetCtrl.resetPassword);
app.post('/api/admin/cleanup', adminCtrl.cleanupDatabase);

// N8N Dashboard Stats
const n8nDashboardCtrl = require('./admin/n8nDashboardController');
app.get('/api/admin/n8n/stats', n8nDashboardCtrl.getDashboardStats);

// Queue Monitoring
const queueCtrl = require('./queueController');
app.get('/api/admin/queue-status', queueCtrl.getQueueStatus);

const runMigrations = require('./migrate');

// --- IMAGE GENERATION ---
const imageGenCtrl = require('./imageGenerationController');
const promptTemplateController = require('./promptTemplateController');
// const authenticateToken = require('./middleware/auth'); // Moved to top

app.post('/api/images/generate', authenticateToken, checkLimit('ai_generation'), imageGenCtrl.generateImage);
app.get('/api/images', authenticateToken, imageGenCtrl.listImages);
app.delete('/api/images/:id', authenticateToken, imageGenCtrl.deleteImage);
app.post('/api/images/translate', authenticateToken, imageGenCtrl.translateText);
app.get('/api/images/models', imageGenCtrl.getModels);
app.post('/api/images/edit', authenticateToken, imageGenCtrl.editImage);
app.post('/api/images/:id/variations', authenticateToken, imageGenCtrl.createVariations);
app.post('/api/images/upscale', authenticateToken, imageGenCtrl.upscaleImage);
app.post('/api/images/remove-background', authenticateToken, imageGenCtrl.removeBackground);
app.get('/api/images/prompts', authenticateToken, imageGenCtrl.getRecentPrompts);
app.get('/api/images/analytics', authenticateToken, imageGenCtrl.getAnalytics);

// Rotas de Templates de Prompt
app.post('/api/templates', authenticateToken, promptTemplateController.createTemplate);
app.get('/api/templates', authenticateToken, promptTemplateController.listTemplates);
const tenantController = require('./tenantController');

// ... (outros imports)

// Rotas de Tenants (Super Admin)
app.get('/api/admin/tenants', authenticateToken, checkAdmin, tenantController.getAllTenants);
app.post('/api/admin/tenants', authenticateToken, checkAdmin, tenantController.createTenant);
app.put('/api/admin/tenants/:id', authenticateToken, checkAdmin, tenantController.updateTenant);
app.delete('/api/admin/tenants/:id', authenticateToken, checkAdmin, tenantController.deleteTenant);

// Rotas de Planos (Admin)
// --- FINANCIAL MODULE ---
const financialCtrl = require('./financialController');

// Rotas Financeiras
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

// Rotas de Estatísticas do Sistema (Admin)
app.get('/api/admin/usage-stats', authenticateToken, checkAdmin, adminCtrl.getSystemUsage);

// Rota temporária para migração de tenants


// Iniciar servidor após migrações
runMigrations().then(() => {
  // Iniciar Job Processor (Queue Worker)
  const jobProcessor = require('./services/jobProcessor');
  jobProcessor.start();
  console.log('🚀 Job Processor started');
  console.log('🔄 Force Deploy: ' + new Date().toISOString());

  server.listen(PORT, () => {
    console.log(`🔥 Server running on port ${PORT}`);
  });
});

