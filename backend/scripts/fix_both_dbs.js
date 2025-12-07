const { Pool } = require('pg');

async function fixBothDatabases() {
    const crossover = new Pool({
        connectionString: 'postgresql://postgres:aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ@crossover.proxy.rlwy.net:59957/railway',
        ssl: { rejectUnauthorized: false }
    });

    const maglev = new Pool({
        connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
        ssl: { rejectUnauthorized: false }
    });

    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            tenant_id INTEGER,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            avatar_url TEXT,
            username VARCHAR(100),
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            phone VARCHAR(20),
            cpf VARCHAR(14),
            registration_date DATE DEFAULT CURRENT_DATE,
            status VARCHAR(20) DEFAULT 'active',
            address_street VARCHAR(255),
            address_number VARCHAR(20),
            address_complement VARCHAR(100),
            address_district VARCHAR(100),
            address_city VARCHAR(100),
            address_state CHAR(2),
            address_zip VARCHAR(10),
            permissions JSONB DEFAULT '[]',
            openai_key TEXT,
            gemini_key TEXT,
            anthropic_key TEXT,
            plan_id INTEGER,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `;

    try {
        console.log('=== CROSSOVER (DATABASE_URL) ===');
        const checkC = await crossover.query(`SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'users')`);
        console.log('users table exists:', checkC.rows[0].exists);

        if (!checkC.rows[0].exists) {
            console.log('🔧 Creating users table in CROSSOVER...');
            await crossover.query(createUsersTable);
            console.log('✅ Created!');
        }

        console.log('\n=== MAGLEV (OPERATIONS_DB) ===');
        const checkM = await maglev.query(`SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'users')`);
        console.log('users table exists:', checkM.rows[0].exists);

        if (!checkM.rows[0].exists) {
            console.log('🔧 Creating users table in MAGLEV...');
            await maglev.query(createUsersTable);
            console.log('✅ Created!');
        }

        // Verify both have password_hash column
        console.log('\n=== VERIFY COLUMNS ===');
        const colsC = await crossover.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash'`);
        console.log('CROSSOVER has password_hash:', colsC.rows.length > 0);

        const colsM = await maglev.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash'`);
        console.log('MAGLEV has password_hash:', colsM.rows.length > 0);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await crossover.end();
        await maglev.end();
    }
}

fixBothDatabases();
