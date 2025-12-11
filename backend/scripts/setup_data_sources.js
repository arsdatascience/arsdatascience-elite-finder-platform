const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const setupDataSources = async () => {
    const client = await pool.connect();
    try {
        console.log('🔌 Setting up Data Sources...');

        await client.query('BEGIN');

        // 1. Create Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('postgres', 'qdrant', 'mysql', 'api')),
        connection_config JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 2. Define Sources provided by User
        const sources = [
            {
                name: 'Core DB (Crossover)',
                type: 'postgres',
                connection_config: {
                    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway'
                }
            },
            {
                name: 'Ops DB (Tramway)',
                type: 'postgres',
                connection_config: {
                    connectionString: 'postgresql://postgres:LMDjKCXIxkuFblWBerQCmHfeMECTZBHz@tramway.proxy.rlwy.net:20230/railway'
                }
            },
            {
                name: 'Vector DB (Qdrant)',
                type: 'qdrant',
                connection_config: {
                    url: 'https://c21e6a5b-298d-483b-82f4-00aeff5edabe.us-east4-0.gcp.cloud.qdrant.io:6333',
                    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.tr20ppnyxa1Zrz5cyaLAVyEvfMGBIeFbTvSKB4q25FE'
                }
            }
        ];

        // 3. Insert/Update Sources
        for (const source of sources) {
            // Check if exists by name
            const res = await client.query('SELECT id FROM data_sources WHERE name = $1', [source.name]);

            if (res.rows.length === 0) {
                await client.query(
                    'INSERT INTO data_sources (name, type, connection_config) VALUES ($1, $2, $3)',
                    [source.name, source.type, source.connection_config]
                );
                console.log(`✅ Created source: ${source.name}`);
            } else {
                await client.query(
                    'UPDATE data_sources SET connection_config = $1, updated_at = NOW() WHERE name = $2',
                    [source.connection_config, source.name]
                );
                console.log(`🔄 Updated source: ${source.name}`);
            }
        }

        await client.query('COMMIT');
        console.log('🎉 Data Sources Setup Complete!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error setting up data sources:', err);
    } finally {
        client.release();
        pool.end();
    }
};

setupDataSources();
