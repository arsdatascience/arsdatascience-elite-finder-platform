const { Pool } = require('pg');

async function fixUsersTable() {
    const maglev = new Pool({
        connectionString: 'postgresql://postgres:llaKYzXGMyByDmdrFYwPyZBegwGnjeON@maglev.proxy.rlwy.net:29278/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Check if users table exists
        const check = await maglev.query(`SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'users')`);
        console.log('users table exists:', check.rows[0].exists);

        // Check if user (singular) exists
        const checkSingular = await maglev.query(`SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user')`);
        console.log('user table (singular) exists:', checkSingular.rows[0].exists);

        if (!check.rows[0].exists) {
            console.log('\n🔧 Creating users table...');
            await maglev.query(`
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
                    status VARCHAR(20) DEFAULT 'active',
                    permissions JSONB DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('✅ users table created!');
        } else {
            console.log('\n📋 users table columns:');
            const cols = await maglev.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`);
            console.log(cols.rows.map(c => c.column_name).join(', '));
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await maglev.end();
    }
}

fixUsersTable();
