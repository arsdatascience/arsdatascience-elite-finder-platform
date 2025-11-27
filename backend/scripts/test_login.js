require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testLogin() {
    const email = 'denismay@arsdatascience.com.br';
    const password = 'admin';

    try {
        console.log(`Testing login for ${email}...`);
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            console.log('❌ User not found in database.');
            return;
        }

        const user = result.rows[0];
        console.log('User found:', { id: user.id, email: user.email, role: user.role });

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {
            console.log('✅ Password match! Login successful (Database level).');
        } else {
            console.log('❌ Password DOES NOT match.');
            console.log('Hash in DB:', user.password_hash);

            // Teste de sanidade: gerar novo hash e comparar
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(password, salt);
            console.log('New hash for "admin" would be:', newHash);
        }

    } catch (err) {
        console.error('Error testing login:', err);
    } finally {
        await pool.end();
    }
}

testLogin();
