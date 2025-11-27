

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());


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

// --- ROTAS ---

// Import database controller
const dbController = require('./dbController');

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


// --- DASHBOARD ANALYTICS ---
const dashboardCtrl = require('./dashboardController');
app.get('/api/dashboard/kpis', dashboardCtrl.getKPIs);
app.get('/api/dashboard/chart-data', dashboardCtrl.getChartData);
app.get('/api/dashboard/funnel-data', dashboardCtrl.getFunnelData);
app.get('/api/dashboard/device-data', dashboardCtrl.getDeviceData);

// --- CAMPAIGNS ---
app.get('/api/campaigns', dbController.getCampaigns);

// --- USER MANAGEMENT ---
const userCtrl = require('./userController');

// Serve uploaded avatars statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Create new user (admin)
app.post('/api/users', userCtrl.createUser);

// Login
app.post('/api/auth/login', userCtrl.login);

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
app.get('/api/clients/:clientId/social-accounts', socialAccountCtrl.getSocialAccounts);
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
app.post('/api/admin/cleanup', adminCtrl.cleanupDatabase);

server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
