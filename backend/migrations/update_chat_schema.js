const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway';

const pool = new Pool({
    connectionString,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Starting migration...');

        // 1. Update Chatbots table
        console.log('Updating chatbots table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS chatbots (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT
      );
    `);

        await client.query(`
      ALTER TABLE chatbots 
      ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general',
      ADD COLUMN IF NOT EXISTS model_config JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS system_prompt TEXT,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);

        // 2. Update Chat Sessions
        console.log('Updating chat_sessions table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY
      );
    `);

        const sessionCols = [
            "chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE SET NULL",
            "user_id INTEGER REFERENCES users(id) ON DELETE SET NULL",
            "client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL",
            "lead_id UUID REFERENCES leads(id) ON DELETE SET NULL",
            "channel VARCHAR(50) DEFAULT 'web'",
            "status VARCHAR(50) DEFAULT 'active'",
            "start_time TIMESTAMP DEFAULT NOW()",
            "end_time TIMESTAMP",
            "sentiment_score DECIMAL(3, 2)",
            "summary TEXT",
            "tags TEXT[]",
            "metadata JSONB DEFAULT '{}'",
            "created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",
            "updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"
        ];

        for (const col of sessionCols) {
            const colName = col.split(' ')[0];
            try {
                await client.query(`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS ${col};`);
            } catch (e) {
                console.log(`Column ${colName} might already exist or error: ${e.message}`);
            }
        }

        // 3. Update Chat Messages
        console.log('Updating chat_messages table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY
      );
    `);

        const messageCols = [
            "session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE",
            "sender_type VARCHAR(20) DEFAULT 'user'",
            "sender_id VARCHAR(255)",
            "content TEXT",
            "sentiment_score DECIMAL(3, 2)",
            "intent_detected VARCHAR(100)",
            "metadata JSONB DEFAULT '{}'",
            "created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"
        ];

        for (const col of messageCols) {
            const colName = col.split(' ')[0];
            try {
                await client.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS ${col};`);
            } catch (e) {
                console.log(`Column ${colName} might already exist or error: ${e.message}`);
            }
        }

        // 4. Create New Tables
        console.log('Creating new tables (chat_analyses, agent_feedbacks)...');
        await client.query(`
        CREATE TABLE IF NOT EXISTS chat_analyses (
            id SERIAL PRIMARY KEY,
            session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
            analysis_type VARCHAR(50) DEFAULT 'sales_coaching',
            sentiment_label VARCHAR(20),
            objections_detected TEXT[],
            buying_stage VARCHAR(50),
            suggested_strategies TEXT[],
            full_report JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

        await client.query(`
        CREATE TABLE IF NOT EXISTS agent_feedbacks (
            id SERIAL PRIMARY KEY,
            session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            comments TEXT,
            tags TEXT[],
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
