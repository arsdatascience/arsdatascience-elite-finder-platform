require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createAdmin() {
    const email = 'denismay@arsdatascience.com.br';
    const password = 'admin'; // Senha padrão solicitada
    const name = 'Denis May';

    try {
        // Garantir que a coluna 'role' existe
        try {
            await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'");
            console.log("Checked/Added 'role' column.");
        } catch (e) {
            console.log("Error checking 'role' column:", e.message);
        }

        console.log(`Checking if user ${email} exists...`);
        const checkRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (checkRes.rows.length > 0) {
            console.log('User already exists. Updating password and role to admin...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            await pool.query(
                'UPDATE users SET password_hash = $1, role = $2 WHERE email = $3',
                [hash, 'admin', email]
            );
            console.log('User updated successfully.');
        } else {
            console.log('Creating new admin user...');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            await pool.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                [name, email, hash, 'admin']
            );
            console.log('Admin user created successfully.');
        }

    } catch (err) {
        console.error('Error creating/updating admin user:', err);
    } finally {
        await pool.end();
    }
}

createAdmin();
