require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./database');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const OUTPUT_DIR = path.join(__dirname, '../generated_data');
const TENANT_ID = 1; // Assuming Tenant 1

const CSV_HEADER = (headers) => headers.join(',') + '\n';
const CSV_ROW = (values) => values.map(v =>
    v === null || v === undefined ? '' :
        typeof v === 'string' && (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v
).join(',') + '\n';

async function generateData() {
    try {
        console.log('🚀 Iniciando geração de dados sintéticos sincronizados...');

        // 1. Fetch Clients
        const clientsRes = await pool.query('SELECT id, name, industry FROM clients ORDER BY id');
        const clients = clientsRes.rows;
        console.log(`✅ ${clients.length} Clientes encontrados.`);

        // Files
        const files = {
            unified_customers: fs.createWriteStream(path.join(OUTPUT_DIR, 'unified_customers.csv')),
            journey_step_templates: fs.createWriteStream(path.join(OUTPUT_DIR, 'journey_step_templates.csv')),
            customer_interactions: fs.createWriteStream(path.join(OUTPUT_DIR, 'customer_interactions.csv')),
            customer_journeys: fs.createWriteStream(path.join(OUTPUT_DIR, 'customer_journeys.csv')),
            identity_graph: fs.createWriteStream(path.join(OUTPUT_DIR, 'identity_graph.csv')),
            conversion_events: fs.createWriteStream(path.join(OUTPUT_DIR, 'conversion_events.csv'))
        };

        // Write Headers
        files.unified_customers.write(CSV_HEADER(['id', 'tenant_id', 'client_id', 'name', 'email', 'phone', 'created_at']));
        files.journey_step_templates.write(CSV_HEADER(['id', 'tenant_id', 'journey_type', 'step_order', 'channel', 'action_type', 'is_active', 'created_at']));
        files.customer_interactions.write(CSV_HEADER(['id', 'customer_id', 'tenant_id', 'channel', 'interaction_type', 'content', 'created_at']));
        files.customer_journeys.write(CSV_HEADER(['id', 'customer_id', 'tenant_id', 'journey_type', 'status', 'current_step', 'created_at']));
        files.identity_graph.write(CSV_HEADER(['id', 'customer_id', 'tenant_id', 'identifier_type', 'identifier_value', 'confidence_score', 'last_seen_at']));
        files.conversion_events.write(CSV_HEADER(['id', 'customer_id', 'tenant_id', 'conversion_type', 'value', 'currency', 'converted_at']));

        // 2. Generate Data per Client
        let totalCustomers = 0;

        for (const client of clients) {
            const customerCount = 20 + Math.floor(Math.random() * 30); // 20-50 customers per client
            console.log(`   Generate ${customerCount} consumers for Client ${client.name} (ID: ${client.id})...`);

            for (let i = 0; i < customerCount; i++) {
                const customerId = uuidv4();
                totalCustomers++;

                // Unified Customer
                files.unified_customers.write(CSV_ROW([
                    customerId, TENANT_ID, client.id,
                    `Customer ${totalCustomers}`, `customer${totalCustomers}@example.com`, `551199999${1000 + totalCustomers}`,
                    new Date().toISOString()
                ]));

                // Identity Graph (1 per customer)
                files.identity_graph.write(CSV_ROW([
                    uuidv4(), customerId, TENANT_ID,
                    'email', `customer${totalCustomers}@example.com`, 1.0, new Date().toISOString()
                ]));

                // Interactions (1-5 per customer)
                const interactionCount = 1 + Math.floor(Math.random() * 5);
                for (let k = 0; k < interactionCount; k++) {
                    files.customer_interactions.write(CSV_ROW([
                        uuidv4(), customerId, TENANT_ID,
                        ['whatsapp', 'email', 'site'][Math.floor(Math.random() * 3)],
                        ['message_sent', 'click', 'view'][Math.floor(Math.random() * 3)],
                        'Interaction Content',
                        new Date().toISOString()
                    ]));
                }

                // Journeys (50% chance)
                if (Math.random() > 0.5) {
                    files.customer_journeys.write(CSV_ROW([
                        uuidv4(), customerId, TENANT_ID,
                        'onboarding', 'active', 1,
                        new Date().toISOString()
                    ]));
                }

                // Conversions (20% chance)
                if (Math.random() > 0.8) {
                    files.conversion_events.write(CSV_ROW([
                        uuidv4(), customerId, TENANT_ID,
                        'purchase', (Math.random() * 1000).toFixed(2), 'BRL',
                        new Date().toISOString()
                    ]));
                }
            }
        }

        // 3. Generate Global Templates (Tenant level)
        const journeyTypes = ['onboarding', 'abandoned_cart', 'reactivation'];
        let templateId = 1;
        for (const type of journeyTypes) {
            files.journey_step_templates.write(CSV_ROW([
                templateId++, TENANT_ID, type, 1, 'email', 'send_email', true, new Date().toISOString()
            ]));
            files.journey_step_templates.write(CSV_ROW([
                templateId++, TENANT_ID, type, 2, 'whatsapp', 'send_message', true, new Date().toISOString()
            ]));
        }

        console.log('✅ Geração concluída! Arquivos salvos em generated_data/');

    } catch (e) {
        console.error('❌ Erro:', e);
    } finally {
        await pool.end();
    }
}

generateData();
