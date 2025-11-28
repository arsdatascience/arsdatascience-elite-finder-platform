const db = require('./db');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'elite-secret-key-change-me';

// Multer configuration – store uploads in ./uploads (outside src)
const upload = multer({
    dest: path.join(__dirname, '..', 'uploads'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

/**
 * Update user avatar (profile picture).
 * Expects multipart/form-data with field "avatar".
 */
const updateAvatar = async (req, res) => {
    const { id } = req.params; // user id
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    try {
        const avatarPath = `/uploads/${req.file.filename}`; // will be served statically
        await db.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatarPath, id]);
        res.json({ success: true, avatarUrl: avatarPath });
    } catch (err) {
        console.error('Error updating avatar:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

/**
 * Create a new user (admin only).
 * Expected body: { name, email, password_hash, role_id? }
 */
const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role, avatar_url, created_at`,
            [name, email, password_hash, role || 'user']
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

/**
 * Login user.
 * Expected body: { email, password }
 */
const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(`[Login Attempt] Email: ${email}`);

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            console.log('[Login Fail] User not found');
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        console.log(`[Login] User found: ${user.id}, Role: ${user.role}`);
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            console.log('[Login Fail] Password mismatch');
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

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

/**
 * Get all team members
 */
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

        // Formatar dados para o frontend
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

    /**
     * Create a new team member
     * Expected body: { username, firstName, lastName, email, phone, cpf, registrationDate, role, address, permissions }
     */
    const createTeamMember = async (req, res) => {
        const {
            avatarUrl, username, firstName, lastName, email, phone, cpf,
            registrationDate, role, status, address, permissions
        } = req.body;

        if (!username || !firstName || !lastName || !email) {
            return res.status(400).json({ success: false, error: 'Campos obrigatórios faltando' });
        }

        try {
            // Gerar senha padrão (pode ser alterada depois)
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
                `${firstName} ${lastName} ` // Campo name para compatibilidade
            ]);

            res.json({ success: true, member: result.rows[0] });
        } catch (err) {
            console.error('Error creating team member:', err);
            if (err.code === '23505') { // Unique violation
                return res.status(400).json({ success: false, error: 'Email ou username já cadastrado' });
            }
            res.status(500).json({ success: false, error: 'Database error' });
        }
    };

    /**
     * Update a team member
     * Expected body: { username, firstName, lastName, email, phone, cpf, registrationDate, role, status, address, permissions, oldPassword?, newPassword? }
     */
    const updateTeamMember = async (req, res) => {
        const { id } = req.params;
        const {
            avatarUrl, username, firstName, lastName, email, phone, cpf,
            registrationDate, role, status, address, permissions,
            oldPassword, newPassword
        } = req.body;

        try {

            // Verificar duplicidade de Email/Username (excluindo o próprio usuário)
            const duplicateCheck = await db.query(
                'SELECT id, email, username FROM users WHERE (email = $1 OR username = $2) AND id != $3',
                [email, username, id]
            );

            if (duplicateCheck.rows.length > 0) {
                const conflict = duplicateCheck.rows[0];
                if (conflict.email === email) {
                    return res.status(400).json({
                        success: false,
                        error: `Este email já está em uso pelo usuário ID ${conflict.id} (${conflict.username}).`
                    });
                }
                if (conflict.username === username) {
                    return res.status(400).json({
                        success: false,
                        error: `Este nome de usuário já está em uso pelo usuário ID ${conflict.id}.`
                    });
                }
            }

            // Verificar duplicidade de CPF (se fornecido)
            if (cpf) {
                const cpfCheck = await db.query(
                    'SELECT id FROM users WHERE cpf = $1 AND id != $2',
                    [cpf, id]
                );
                if (cpfCheck.rows.length > 0) {
                    return res.status(400).json({ success: false, error: 'Este CPF já está em uso por outro usuário.' });
                }
            }

            // Se está tentando alterar senha, validar senha antiga
            if (newPassword) {
                if (!oldPassword) {
                    return res.status(400).json({ success: false, error: 'Senha antiga é obrigatória para alterar a senha' });
                }

                // Buscar usuário atual para validar senha antiga
                const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [id]);
                if (userResult.rows.length === 0) {
                    return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
                }

                const isOldPasswordValid = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);
                if (!isOldPasswordValid) {
                    return res.status(400).json({ success: false, error: 'Senha antiga incorreta' });
                }

                // Criptografar nova senha
                const salt = await bcrypt.genSalt(10);
                const password_hash = await bcrypt.hash(newPassword, salt);

                // Atualizar com nova senha
                const result = await db.query(`
                UPDATE users SET
            username = $1,
                first_name = $2,
                last_name = $3,
                email = $4,
                phone = $5,
                cpf = $6,
                registration_date = $7,
                role = $8,
                status = $9,
                avatar_url = $10,
                address_street = $11,
                address_number = $12,
                address_complement = $13,
                address_district = $14,
                address_city = $15,
                address_state = $16,
                address_zip = $17,
                permissions = $18,
                name = $19,
                password_hash = $20,
                updated_at = NOW()
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

                if (result.rows.length === 0) {
                    return res.status(404).json({ success: false, error: 'Membro não encontrado' });
                }

                res.json({ success: true, member: result.rows[0], message: 'Senha alterada com sucesso' });
            } else {
                // Atualizar SEM alterar senha
                const result = await db.query(`
                UPDATE users SET
            username = $1,
                first_name = $2,
                last_name = $3,
                email = $4,
                phone = $5,
                cpf = $6,
                registration_date = $7,
                role = $8,
                status = $9,
                avatar_url = $10,
                address_street = $11,
                address_number = $12,
                address_complement = $13,
                address_district = $14,
                address_city = $15,
                address_state = $16,
                address_zip = $17,
                permissions = $18,
                name = $19,
                updated_at = NOW()
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

                if (result.rows.length === 0) {
                    return res.status(404).json({ success: false, error: 'Membro não encontrado' });
                }

                res.json({ success: true, member: result.rows[0] });
            }
        } catch (err) {
            console.error('Error updating team member:', err);
            if (err.code === '23505') {
                return res.status(400).json({ success: false, error: 'Dados duplicados (email, username ou CPF) detectados.' });
            }
            res.status(500).json({ success: false, error: 'Database error: ' + err.message });
        }
    };

    /**
     * Delete a team member (soft delete - set status to inactive)
     */
    const deleteTeamMember = async (req, res) => {
        const { id } = req.params;

        try {
            const result = await db.query(`
            UPDATE users SET status = 'inactive', updated_at = NOW()
            WHERE id = $1
            RETURNING id
                `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Membro não encontrado' });
            }

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
