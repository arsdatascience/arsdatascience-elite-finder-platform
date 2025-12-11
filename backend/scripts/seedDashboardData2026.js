const { Pool } = require('pg');
const path = require('path');
require('dotenv').config(); // Tenta padrão primeiro

// Tentar carregar .env de múltiplos locais se necessário
if (!process.env.DATABASE_URL) {
    const envPaths = [
        path.join(__dirname, '../.env'), // backend/.env
        path.join(__dirname, '../../.env') // root/.env
    ];

    for (const p of envPaths) {
        const result = require('dotenv').config({ path: p });
        if (!result.error) {
            console.log(`✅ Loaded .env from ${p}`);
            break;
        }
    }
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const startDate = new Date('2024-12-01');
const endDate = new Date('2025-12-01');

async function createTablesIfNotExist() {
    const client = await pool.connect();
    try {
        console.log('🏗️ Verificando/Criando tabelas necessárias...');

        // Tabela de Métricas Diárias de Campanha
        await client.query(`
            CREATE TABLE IF NOT EXISTS campaign_daily_metrics (
                id SERIAL PRIMARY KEY,
                campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                impressions INTEGER DEFAULT 0,
                clicks INTEGER DEFAULT 0,
                spend DECIMAL(10, 2) DEFAULT 0,
                conversions INTEGER DEFAULT 0,
                revenue DECIMAL(10, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_daily_metrics(date);
            CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign ON campaign_daily_metrics(campaign_id);
        `);

        // Tabela de Fontes de Conversão
        await client.query(`
            CREATE TABLE IF NOT EXISTS conversion_sources (
                id SERIAL PRIMARY KEY,
                client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
                source_name VARCHAR(100) NOT NULL,
                percentage DECIMAL(5, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Tabela de Estatísticas de Dispositivos (Garantir que existe)
        await client.query(`
            CREATE TABLE IF NOT EXISTS device_stats (
                id SERIAL PRIMARY KEY,
                client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
                device_type VARCHAR(50),
                percentage DECIMAL(5, 2),
                conversions INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('✅ Tabelas verificadas.');
    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error);
        throw error;
    } finally {
        client.release();
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

async function seedData() {
    const client = await pool.connect();
    try {
        await createTablesIfNotExist();

        console.log('🌱 Iniciando seed de dados do Dashboard (2024-2025)...');

        // 1. Buscar todos os clientes
        const clientsRes = await client.query('SELECT id, name FROM clients');
        const clients = clientsRes.rows;

        if (clients.length === 0) {
            console.log('⚠️ Nenhum cliente encontrado. Crie clientes primeiro.');
            return;
        }

        console.log(`📋 Processando ${clients.length} clientes...`);

        for (const c of clients) {
            console.log(`   Processing Client: ${c.name} (ID: ${c.id})`);

            // Limpar dados antigos deste cliente para evitar duplicação no período
            // (Opcional, mas bom para re-run)
            // await client.query('DELETE FROM campaigns WHERE client_id = $1', [c.id]); 
            // Cuidado ao deletar campanhas pois deleta metrics em cascata. Melhor deletar metrics do periodo.

            // 2. Criar Campanhas (Google, Meta e YouTube)
            const campaigns = [
                { name: `Google Search - ${c.name} [2025]`, platform: 'google', status: 'active' },
                { name: `Meta Awareness - ${c.name} [2025]`, platform: 'meta', status: 'active' },
                { name: `Google Display - ${c.name} [2025]`, platform: 'google', status: 'paused' },
                { name: `Instagram Reels - ${c.name} [2025]`, platform: 'meta', status: 'active' },
                { name: `YouTube Views - ${c.name} [2025]`, platform: 'youtube', status: 'active' }
            ];

            const createdCampaigns = [];

            for (const camp of campaigns) {
                const res = await client.query(`
                    INSERT INTO campaigns (client_id, name, platform, status, budget, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id, platform
                `, [c.id, camp.name, camp.platform, camp.status, randomFloat(1000, 5000), startDate]);
                createdCampaigns.push(res.rows[0]);
            }

            // 3. Gerar Métricas Diárias
            let currentDate = new Date(startDate);
            const metricsBuffer = [];

            // Fator de escala baseado no ID do cliente para variar os dados
            const scaleFactor = 1 + (c.id % 5) * 0.2;

            while (currentDate <= endDate) {
                const dateStr = currentDate.toISOString().split('T')[0];

                // Sazonalidade simples (mais vendas no fim do ano e meio do ano)
                const month = currentDate.getMonth();
                const seasonality = (month === 11 || month === 5) ? 1.3 : 1.0;

                for (const camp of createdCampaigns) {
                    const isGoogle = camp.platform === 'google';
                    const isYoutube = camp.platform === 'youtube';

                    // Base metrics
                    let impressions = Math.floor(randomInt(500, 2000) * scaleFactor * seasonality);

                    // YouTube tem muitas impressões e views, mas CTR menor
                    if (isYoutube) impressions = Math.floor(impressions * 2.5);

                    let ctr = isYoutube ? randomFloat(0.005, 0.02) : randomFloat(0.02, 0.08);
                    let clicks = Math.floor(impressions * ctr);

                    let cpc = isGoogle ? randomFloat(1.5, 4.0) : isYoutube ? randomFloat(0.10, 0.50) : randomFloat(0.5, 2.0);
                    let spend = clicks * cpc;

                    let convRate = isYoutube ? randomFloat(0.01, 0.05) : randomFloat(0.05, 0.15);
                    let conversions = Math.floor(clicks * convRate);

                    let ticketMedio = randomFloat(100, 300);
                    let revenue = conversions * ticketMedio;

                    // Adicionar aleatoriedade de "dias ruins" (zerados ou baixos)
                    if (Math.random() > 0.95) {
                        impressions = 0; clicks = 0; spend = 0; conversions = 0; revenue = 0;
                    }

                    await client.query(`
                        INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `, [camp.id, dateStr, impressions, clicks, spend, conversions, revenue]);
                }

                // Avançar dia
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // 4. Gerar Leads (Tabela Leads)
            // Gerar alguns leads soltos para popular a tabela de leads e funil
            const numLeads = randomInt(50, 200);
            for (let i = 0; i < numLeads; i++) {
                const leadDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
                const statusOptions = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
                const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
                const val = status === 'won' ? randomFloat(500, 5000) : 0;

                const sources = ['Google', 'Meta', 'YouTube', 'Indicação'];
                const source = sources[Math.floor(Math.random() * sources.length)];

                await client.query(`
                    INSERT INTO leads (client_id, name, email, status, value, created_at, source)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    c.id,
                    `Lead ${i} - ${c.name}`,
                    `lead${i}@example.com`,
                    status,
                    val,
                    leadDate,
                    source
                ]);
            }

            // 5. Popular Device Stats
            await client.query('DELETE FROM device_stats WHERE client_id = $1', [c.id]);
            await client.query(`
                INSERT INTO device_stats (client_id, device_type, percentage, conversions) VALUES
                ($1, 'Mobile', $2, $3),
                ($1, 'Desktop', $4, $5),
                ($1, 'Tablet', $6, $7)
            `, [
                c.id,
                randomFloat(60, 80), randomInt(100, 500),
                randomFloat(15, 30), randomInt(50, 200),
                randomFloat(0, 5), randomInt(0, 20)
            ]);

            // 6. Popular Conversion Sources
            await client.query('DELETE FROM conversion_sources WHERE client_id = $1', [c.id]);
            await client.query(`
                INSERT INTO conversion_sources (client_id, source_name, percentage) VALUES
                ($1, 'Google Ads', $2),
                ($1, 'Meta Ads', $3),
                ($1, 'YouTube Ads', $4),
                ($1, 'Orgânico', $5)
            `, [
                c.id,
                randomFloat(30, 40),
                randomFloat(20, 30),
                randomFloat(10, 20),
                randomFloat(5, 10)
            ]);
        }

        console.log('✅ Seed Dashboard concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro no seed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

seedData();
