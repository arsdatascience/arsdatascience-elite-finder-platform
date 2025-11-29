

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.set('trust proxy', 1); // Necessário para Railway/Vercel e rate-limiter
const PORT = process.env.PORT || 3001;

// Middleware
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
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), version: '1.0.1' });
});

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
app.get('/api/leads', dbController.getLeads);
app.patch('/api/leads/:id/status', dbController.updateLeadStatus);

// Chat Messages
app.get('/api/chat-messages', dbController.getChatMessages);

// Social Posts
// Social Posts
const socialMediaController = require('./socialMediaController');
app.get('/api/social-posts', socialMediaController.getPosts);
app.post('/api/social-posts', socialMediaController.upload.single('media'), socialMediaController.createPost);

// Automation Workflows
app.get('/api/workflows', dbController.getWorkflows);

const integrationsController = require('./integrationsController');

// OAuth callbacks (kept as app.get as per instruction)
app.get('/auth/google-ads/callback', integrationsController.handleGoogleAdsCallback);
app.get('/auth/meta-ads/callback', integrationsController.handleMetaAdsCallback);

app.post('/api/integrations/whatsapp/setup', integrationsController.setupWhatsAppWebhook);

// --- WEBHOOKS ---
app.post('/webhooks/whatsapp', (req, res) => {
  const { from, message } = req.body;
  console.log(`Nova mensagem de ${from}: ${message}`);
  // Lógica futura: Integrar com tabela chat_logs e chamar Gemini API
  res.status(200).send('EVENT_RECEIVED');
});

// --- AI SERVICES ---
const aiController = require('./aiController');

app.post('/api/ai/analyze', aiController.analyzeChatConversation);
app.post('/api/ai/generate', aiController.generateMarketingContent);
app.post('/api/ai/chat', aiController.askEliteAssistant);
// AI Analysis Routes
app.post('/api/ai/analyze-strategy', aiController.analyzeConversationStrategy);
app.post('/api/ai/generate-config', aiController.generateAgentConfig);
app.post('/api/ai/save-analysis', aiController.saveAnalysis);


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
app.post('/api/users', userCtrl.createUser);

// Login
app.post('/api/auth/login', userCtrl.login);
app.post('/api/auth/forgot-password', userCtrl.forgotPassword);
app.post('/api/auth/reset-password', userCtrl.resetPasswordConfirm);

// Update avatar for a user (requires multipart/form-data)
app.post('/api/users/:id/avatar', userCtrl.upload.single('avatar'), userCtrl.updateAvatar);

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

const runMigrations = require('./migrate');

// Iniciar servidor após migrações
runMigrations().then(() => {
  server.listen(PORT, () => {
    console.log(`🔥 Server running on port ${PORT}`);
  });
});
