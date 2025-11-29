const db = require('./db');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'elite-secret-key-change-me';

// Multer configuration
const upload = multer({
    dest: path.join(__dirname, '..', 'uploads'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

// Configuração de Email
const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: (process.env.SMTP_SSL || 'true') === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000, // 10s
    greetingTimeout: 5000,    // 5s
    socketTimeout: 15000      // 15s
};

console.log('📧 Configuração SMTP Carregada:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    user: smtpConfig.auth.user,
    hasPassword: !!smtpConfig.auth.pass
});

const transporter = nodemailer.createTransport(smtpConfig);

const updateAvatar = async (req, res) => {
    const { id } = req.params;
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    try {
        const avatarPath = `/uploads/${req.file.filename}`;
        await db.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatarPath, id]);
        res.json({ success: true, avatarUrl: avatarPath });
    } catch (err) {
        console.error('Error updating avatar:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return res.status(400).json({ error: 'Credenciais inválidas' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Credenciais inválidas' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url
            }
        });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getTeamMembers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id, username, first_name, last_name, email, phone, cpf,
                registration_date, role, status, avatar_url,
                address_street, address_number, address_complement,
                address_district, address_city, address_state, address_zip,
                permissions, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
        `);
        const members = result.rows.map(row => ({
            id: row.id,
            avatarUrl: row.avatar_url,
            username: row.username,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            cpf: row.cpf,
            registrationDate: row.registration_date,
            role: row.role,
            status: row.status,
            address: {
                street: row.address_street,
                number: row.address_number,
                complement: row.address_complement,
                district: row.address_district,
                city: row.address_city,
                state: row.address_state,
                zip: row.address_zip
            },
            permissions: row.permissions || []
        }));
        res.json({ success: true, members });
    } catch (err) {
        console.error('Error fetching team members:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log(`[Forgot Password] Solicitado para: ${email}`);
    try {
        let result;
        try {
            result = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);
        } catch (e) {
            result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        }

        const user = result.rows[0];
        if (!user) {
            console.log('[Forgot Password] Usuário não encontrado.');
            return res.json({ success: true, message: 'Se o email existir, as instruções serão enviadas.' });
        }

        const resetToken = jwt.sign({ id: user.id, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });

        const mailOptions = {
            from: `"Elite Finder Security" <${process.env.SMTP_SENDER || process.env.SMTP_USER}>`,
            to: email,
            subject: 'Recuperação de Senha - Elite Finder',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Recuperação de Senha</h2>
                    <p>Você solicitou a redefinição de sua senha.</p>
                    <p>Use o código abaixo ou clique no link para redefinir:</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; font-weight: bold; font-size: 24px; letter-spacing: 2px;">
                        ${resetToken}
                    </div>
                    <p style="text-align: center; margin-top: 20px;">
                        <a href="https://elitefinder.vercel.app/login?resetToken=${resetToken}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
                    </p>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Este link expira em 1 hora.</p>
                </div>
            `
        };

        console.log('[Forgot Password] Tentando enviar email...');
        try {
            await transporter.verify();
            console.log('[Forgot Password] SMTP Verificado.');
            await transporter.sendMail(mailOptions);
            console.log('[Forgot Password] Email enviado com sucesso.');
        } catch (mailError) {
            console.error('[Forgot Password] ERRO SMTP:', mailError);
            return res.status(500).json({ success: false, error: 'Falha no envio de email. Verifique logs do servidor.' });
        }

        res.json({
            success: true,
            message: 'Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.'
        });
    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ error: 'Erro ao processar solicitação.' });
    }
};

const resetPasswordConfirm = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'reset') throw new Error('Invalid token type');

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        try {
            await db.query('UPDATE "user" SET password_hash = $1 WHERE id = $2', [hash, decoded.id]);
        } catch (e) {
            await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, decoded.id]);
        }

        res.json({ success: true, message: 'Senha alterada com sucesso' });
    } catch (err) {
        console.error('Reset Confirm Error:', err);
        res.status(400).json({ error: 'Token inválido ou expirado' });
    }
};

const createTeamMember = async (req, res) => {
    const {
        avatarUrl, username, firstName, lastName, email, phone, cpf,
        registrationDate, role, status, address, permissions
    } = req.body;

    if (!username || !firstName || !lastName || !email) {
        return res.status(400).json({ success: false, error: 'Campos obrigatórios faltando' });
    }

    try {
        const defaultPassword = 'Elite@2024';
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(defaultPassword, salt);

        const result = await db.query(`
            INSERT INTO users(
                    username, first_name, last_name, email, phone, cpf,
                    registration_date, role, status, password_hash, avatar_url,
                    address_street, address_number, address_complement,
                    address_district, address_city, address_state, address_zip,
                    permissions, name
                ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING id, username, first_name, last_name, email, phone, cpf,
                registration_date, role, status, avatar_url, created_at
                    `, [
            username, firstName, lastName, email, phone, cpf,
            registrationDate || new Date().toISOString().split('T')[0],
            role || 'Vendedor',
            status || 'active',
            password_hash,
            avatarUrl || null,
            address?.street, address?.number, address?.complement,
            address?.district, address?.city, address?.state, address?.zip,
            JSON.stringify(permissions || []),
            `${firstName} ${lastName} `
        ]);

        res.json({ success: true, member: result.rows[0] });
    } catch (err) {
        console.error('Error creating team member:', err);
        if (err.code === '23505') {
            return res.status(400).json({ success: false, error: 'Email ou username já cadastrado' });
        }
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const updateTeamMember = async (req, res) => {
    const { id } = req.params;
    const {
        avatarUrl, username, firstName, lastName, email, phone, cpf,
        registrationDate, role, status, address, permissions,
        oldPassword, newPassword
    } = req.body;

    try {
        const duplicateCheck = await db.query(
            'SELECT id, email, username FROM users WHERE (email = $1 OR username = $2) AND id != $3',
            [email, username, id]
        );

        if (duplicateCheck.rows.length > 0) {
            const conflict = duplicateCheck.rows[0];
            if (conflict.email === email) return res.status(400).json({ success: false, error: 'Email em uso.' });
            if (conflict.username === username) return res.status(400).json({ success: false, error: 'Username em uso.' });
        }

        if (cpf) {
            const cpfCheck = await db.query('SELECT id FROM users WHERE cpf = $1 AND id != $2', [cpf, id]);
            if (cpfCheck.rows.length > 0) return res.status(400).json({ success: false, error: 'CPF em uso.' });
        }

        if (newPassword) {
            if (!oldPassword) return res.status(400).json({ success: false, error: 'Senha antiga obrigatória.' });
            const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [id]);
            if (userResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            const isOldPasswordValid = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);
            if (!isOldPasswordValid) return res.status(400).json({ success: false, error: 'Senha antiga incorreta' });

            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(newPassword, salt);

            const result = await db.query(`
                UPDATE users SET
                username = $1, first_name = $2, last_name = $3, email = $4, phone = $5, cpf = $6,
                registration_date = $7, role = $8, status = $9, avatar_url = $10,
                address_street = $11, address_number = $12, address_complement = $13,
                address_district = $14, address_city = $15, address_state = $16, address_zip = $17,
                permissions = $18, name = $19, password_hash = $20, updated_at = NOW()
                WHERE id = $21
                RETURNING id, username, first_name, last_name, email, phone, cpf,
                registration_date, role, status, avatar_url, updated_at
            `, [
                username, firstName, lastName, email, phone, cpf,
                registrationDate, role, status, avatarUrl,
                address?.street, address?.number, address?.complement,
                address?.district, address?.city, address?.state, address?.zip,
                JSON.stringify(permissions || []),
                `${firstName} ${lastName} `,
                password_hash,
                id
            ]);
            if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Membro não encontrado' });
            res.json({ success: true, member: result.rows[0], message: 'Senha alterada com sucesso' });
        } else {
            const result = await db.query(`
                UPDATE users SET
                username = $1, first_name = $2, last_name = $3, email = $4, phone = $5, cpf = $6,
                registration_date = $7, role = $8, status = $9, avatar_url = $10,
                address_street = $11, address_number = $12, address_complement = $13,
                address_district = $14, address_city = $15, address_state = $16, address_zip = $17,
                permissions = $18, name = $19, updated_at = NOW()
                WHERE id = $20
                RETURNING id, username, first_name, last_name, email, phone, cpf,
                registration_date, role, status, avatar_url, updated_at
            `, [
                username, firstName, lastName, email, phone, cpf,
                registrationDate, role, status, avatarUrl,
                address?.street, address?.number, address?.complement,
                address?.district, address?.city, address?.state, address?.zip,
                JSON.stringify(permissions || []),
                `${firstName} ${lastName} `,
                id
            ]);
            if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Membro não encontrado' });
            res.json({ success: true, member: result.rows[0] });
        }
    } catch (err) {
        console.error('Error updating team member:', err);
        if (err.code === '23505') return res.status(400).json({ success: false, error: 'Dados duplicados.' });
        res.status(500).json({ success: false, error: 'Database error: ' + err.message });
    }
};

const deleteTeamMember = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = $1 RETURNING id`, [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Membro não encontrado' });
        res.json({ success: true, message: 'Membro removido com sucesso' });
    } catch (err) {
        console.error('Error deleting team member:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

module.exports = {
    upload,
    updateAvatar,
    createUser,
    login,
    getTeamMembers,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    forgotPassword,
    resetPasswordConfirm
};
