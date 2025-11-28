const pool = require('./database');
const bcrypt = require('bcryptjs');

exports.resetPassword = async (req, res) => {
    const EMAIL = 'denismay@arsdatascience.com.br';
    const NEW_PASSWORD = 'Elite@2025';

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(NEW_PASSWORD, salt);

        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [EMAIL]);

        if (userRes.rows.length === 0) {
            await pool.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                ['Denis May', EMAIL, hash, 'admin']
            );
        } else {
            await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, EMAIL]);
        }

        res.json({
            success: true,
            message: 'Senha resetada com sucesso',
            credentials: { email: EMAIL, password: NEW_PASSWORD }
        });
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({ error: error.message });
    }
};
