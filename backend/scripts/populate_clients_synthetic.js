require('dotenv').config({ path: '../.env' }); // Adjust path if needed, or rely on root .env if run from root
const { Pool } = require('pg');
const { encrypt } = require('../utils/crypto');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({
    connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
    ssl: { rejectUnauthorized: false }
});

// Synthetic Data Arrays
const names = ['Carlos Silva', 'Ana Souza', 'Marcos Oliveira', 'Juliana Santos', 'Roberto Lima', 'Fernanda Costa', 'Paulo Rocha', 'Beatriz Alves', 'Ricardo Mendes', 'Camila Pereira', 'Eduardo Martins', 'Larissa Ferreira'];
const companies = ['TechSolutions Ltda', 'Inova Marketing', 'Construtora Horizonte', 'Supermercado Preço Bom', 'Design Studio X', 'Consultoria Empresarial ABC', 'Logística Rápida', 'Restaurante Sabor Caseiro', 'Clínica Saúde Total', 'Advocacia Silva & Associados', 'Auto Peças Modelo', 'Escola Futuro Brilhante'];
const streets = ['Rua das Flores', 'Av. Paulista', 'Rua XV de Novembro', 'Av. Brasil', 'Rua 7 de Setembro', 'Rua Amazonas', 'Av. Copacabana', 'Rua da Paz', 'Rua Bela Vista', 'Av. Independência', 'Rua São Paulo', 'Av. Central'];
const neighborhoods = ['Centro', 'Jardins', 'Vila Nova', 'Bela Vista', 'Copacabana', 'Savassi', 'Moema', 'Leblon', 'Barra', 'Graça', 'Sion', 'Ipanema'];
const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Recife', 'Fortaleza', 'Brasília', 'Goiânia', 'Campinas', 'Vitória'];
const states = ['SP', 'RJ', 'MG', 'PR', 'RS', 'BA', 'PE', 'CE', 'DF', 'GO', 'SP', 'ES']; // Matching cities
const banks = ['Banco do Brasil', 'Bradesco', 'Itaú', 'Santander', 'Caixa', 'Nubank', 'Inter', 'C6 Bank', 'Original', 'Sofisa', 'Neon', 'Next'];
const industries = ['Tecnologia', 'Varejo', 'Construção', 'Serviços', 'Saúde', 'Educação', 'Alimentação', 'Automotivo', 'Jurídico', 'Logística', 'Financeiro', 'Imobiliário'];

const generateCNPJ = () => {
    let n = 9;
    let n1 = Math.floor(Math.random() * n), n2 = Math.floor(Math.random() * n), n3 = Math.floor(Math.random() * n);
    let n4 = Math.floor(Math.random() * n), n5 = Math.floor(Math.random() * n), n6 = Math.floor(Math.random() * n);
    let n7 = Math.floor(Math.random() * n), n8 = Math.floor(Math.random() * n);
    let n9 = 0, n10 = 0, n11 = 0, n12 = 1; // 0001
    let d1 = 0, d2 = 0; // Digitos verificadores - fake for now, using valid format
    // Simple random string to avoid complexity of checksum implementation here (validation is on frontend mostly)
    // But let's make it 14 digits numeric
    return `${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;
};

const generateCPF = () => {
    return `${Math.floor(10000000000 + Math.random() * 90000000000)}`;
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const formatDate = (date) => date.toISOString().split('T')[0];

const populateClients = async () => {
    try {
        console.log('🔄 Connecting to database...');
        await pool.query('SELECT 1'); // Validates connection
        console.log('✅ Connected.');

        // 1. Get existing clients
        const { rows: existingClients } = await pool.query('SELECT * FROM clients');
        console.log(`ℹ️  Found ${existingClients.length} existing clients.`);

        const targetCount = 12;
        const passwordHash = await bcrypt.hash('123456', 10);

        for (let i = 0; i < targetCount; i++) {
            const isPJ = i % 2 !== 0; // Alternate types
            const type = isPJ ? 'PJ' : 'PF';

            // Basic Data
            const name = isPJ ? companies[i] || `Empresa ${i}` : names[i] || `Cliente ${i}`;
            const email = `cliente${i + 1}@exemplo.com`;
            const phone = `119${Math.floor(Math.random() * 100000000)}`;
            const document = isPJ ? generateCNPJ() : generateCPF();

            // Address
            const zip = `0${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(100 + Math.random() * 900)}`;
            const street = streets[i] || `Rua ${i}`;
            const number = `${Math.floor(Math.random() * 1000)}`;
            const neighborhood = neighborhoods[i] || `Bairro ${i}`;
            const city = cities[i] || 'São Paulo';
            const state = states[i] || 'SP';

            // Encrypted Fields
            const encPhone = encrypt(phone);
            const encWhatsapp = encrypt(phone); // Same as phone
            const encDocument = encrypt(document);
            const encStreet = encrypt(street);
            const encNumber = encrypt(number);
            const encZip = zip; // Assuming zip is not encrypted in logic based on previous migration, let's check... Schema says address_zip VARCHAR(10), usually not encrypted in 'searchable' implementation unless specified. dbController.js line 163 updates 'address_zip' with 'cep', not encrypted. Only street, number, complement are encrypted.

            // New Fields Data
            const username = `user_client_${i + 1}`;
            const gender = getRandom(['Masculino', 'Feminino', 'Outro']);
            const marital = getRandom(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)']);
            const bank = getRandom(banks);
            const agency = `${Math.floor(1000 + Math.random() * 9000)}`;
            const account = `${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(Math.random() * 9)}`;

            let query = '';
            let params = [];

            if (i < existingClients.length) {
                // UPDATE existing
                const client = existingClients[i];
                console.log(`🔄 Updating client ${client.id} (${client.name})...`);

                query = `
                    UPDATE clients SET
                        type = $1, document = $2, phone = $3, whatsapp = $4,
                        address_zip = $5, address_street = $6, address_number = $7, address_neighborhood = $8,
                        address_city = $9, address_state = $10,
                        username = $11, password_hash = $12, terms_accepted = true, privacy_accepted = true,
                        gender = $13, marital_status = $14, nationality = 'Brasileira',
                        bank_name = $15, bank_agency = $16, bank_account = $17, bank_account_type = 'Corrente',
                        updated_at = NOW()
                    WHERE id = $18
                `;
                params = [
                    type, encDocument, encPhone, encWhatsapp,
                    zip, encStreet, encNumber, neighborhood,
                    city, state,
                    username, passwordHash,
                    gender, marital,
                    bank, agency, encrypt(account),
                    client.id
                ];

                if (isPJ) {
                    // Add PJ specifics update if needed, simplify for now to core fields + type specific
                    // For comprehensive update, we might need dynamic query or long set.
                    // Let's run a second update for specifics to keep query clean or just one big one.
                    // Actually, let's just update the core 'missing' fields.
                }

            } else {
                // INSERT new
                console.log(`➕ Creating new client ${i + 1} (${name})...`);
                query = `
                    INSERT INTO clients (
                        tenant_id, name, type, email, phone, whatsapp, document, foundation_date,
                        address_zip, address_street, address_number, address_neighborhood, address_city, address_state,
                        username, password_hash, terms_accepted, privacy_accepted,
                        gender, marital_status, nationality,
                        fantasy_name, company_size, industry,
                        bank_name, bank_agency, bank_account, bank_account_type
                    ) VALUES (
                        1, $1, $2, $3, $4, $5, $6, NOW(),
                        $7, $8, $9, $10, $11, $12,
                        $13, $14, true, true,
                        $15, $16, 'Brasileira',
                        $17, 'Pequena', $18,
                        $19, $20, $21, 'Corrente'
                    )
                `;
                // Note: tenant_id hardcoded to 1 or null if multi-tenant needs fetch. Assuming 1 for dev.
                // Better if we fetch a valid tenant first.

                params = [
                    name, type, email, encPhone, encWhatsapp, encDocument,
                    zip, encStreet, encNumber, neighborhood, city, state,
                    username, passwordHash,
                    isPJ ? null : gender, isPJ ? null : marital, // Only PF fields
                    isPJ ? name : null, industries[i], // PJ fields
                    bank, agency, encrypt(account)
                ];
            }

            await pool.query(query, params);
        }

        console.log('✅ 12 Clients populated/updated successfully.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error populating clients:', error);
        process.exit(1);
    }
};

populateClients();
