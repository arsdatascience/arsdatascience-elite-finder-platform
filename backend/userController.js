const db = require('./db');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { encrypt, decrypt } = require('./utils/crypto');
const { getTenantScope } = require('./utils/tenantSecurity');

const JWT_SECRET = process.env.JWT_SECRET || 'elite-secret-key-change-me';

const storageService = require('./services/storageService');

// Multer configuration - Use Memory Storage for S3
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

// ... (SMTP config remains same)

const updateAvatar = async (req, res) => {
    const { id } = req.params;
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    try {
        // Upload to S3
        const avatarUrl = await storageService.uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'avatars'
        );

        await db.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatarUrl, id]);
        res.json({ success: true, avatarUrl });
    } catch (err) {
        console.error('Error updating avatar:', err);
        res.status(500).json({ success: false, error: 'Failed to upload avatar' });
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

        const token = jwt.sign({
            id: user.id,
            role: user.role,
            tenant_id: user.tenant_id
        }, JWT_SECRET, { expiresIn: '1d' });

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
 * Self-registration endpoint
 * POST /api/auth/register
 * Creates new user with 'user' role (not admin)
 */
const register = async (req, res) => {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
        return res.status(400).json({
            error: 'Nome, email e senha são obrigatórios',
            fields: { name: !name, email: !email, password: !password }
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email inválido' });
    }

    try {
        // Check if email already exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate username from email
        const username = email.split('@')[0] + '_' + Date.now().toString(36).slice(-4);

        // Insert user with role 'user' (NOT admin)
        const result = await db.query(`
            INSERT INTO users (name, email, password_hash, username, phone, role, status, created_at)
            VALUES ($1, $2, $3, $4, $5, 'user', 'active', NOW())
            RETURNING id, name, email, role, created_at
        `, [name, email, passwordHash, username, phone || null]);

        const newUser = result.rows[0];

        // Generate JWT token so user is logged in immediately
        const token = jwt.sign({
            id: newUser.id,
            role: newUser.role,
            tenant_id: null // New users don't have tenant yet
        }, JWT_SECRET, { expiresIn: '1d' });

        console.log(`✅ New user registered: ${email} (ID: ${newUser.id})`);

        res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso!',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (err) {
        console.error('Registration Error:', err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Email ou username já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
};

const getTeamMembers = async (req, res) => {
    const userId = req.user.id;
    try {
        // Buscar tenant_id do usuário logado
        const userRes = await db.query('SELECT tenant_id, role FROM users WHERE id = $1', [userId]);
        const currentUser = userRes.rows[0];

        let query = `
            SELECT 
                id, username, first_name, last_name, email, phone, cpf,
                registration_date, role, status, avatar_url,
                address_street, address_number, address_complement,
                address_district, address_city, address_state, address_zip,
                permissions, created_at, updated_at
            FROM users
            WHERE status != 'deleted'
        `;
        const params = [];

        // Se não for super_admin, filtrar pelo tenant
        const { isSuperAdmin, tenantId } = getTenantScope(req);

        // if (!isSuperAdmin) {
        //    if (!tenantId) {
        //        return res.json({ success: true, members: [] }); // Usuário sem tenant não vê ninguém
        //    }
        //    query += ` AND tenant_id = $1`;
        //    params.push(tenantId);
        // }

        query += ` ORDER BY created_at DESC`;

        const result = await db.query(query, params);
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
    const creatorId = req.user.id; // ID de quem está criando
    const {
        avatarUrl, username, firstName, lastName, email, phone, cpf,
        registrationDate, role, status, address, permissions
    } = req.body;

    if (!username || !firstName || !lastName || !email) {
        return res.status(400).json({ success: false, error: 'Campos obrigatórios faltando' });
    }

    try {
        // Buscar tenant_id do criador
        const creatorRes = await db.query('SELECT tenant_id FROM users WHERE id = $1', [creatorId]);
        const tenantId = creatorRes.rows[0]?.tenant_id;

        const defaultPassword = 'Elite@2024';
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(defaultPassword, salt);

        const result = await db.query(`
            INSERT INTO users(
                    username, first_name, last_name, email, phone, cpf,
                    registration_date, role, status, password_hash, avatar_url,
                    address_street, address_number, address_complement,
                    address_district, address_city, address_state, address_zip,
                    permissions, name, tenant_id
                ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
            `${firstName} ${lastName} `,
            tenantId // Atribuir ao mesmo tenant
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
    const updates = req.body;

    try {
        console.log(`[UPDATE USER] ID: ${id}`);
        console.log('[UPDATE USER] Updates:', JSON.stringify(updates, null, 2));

        // 1. Fetch current user data
        const currentUserRes = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (currentUserRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Membro não encontrado' });
        }
        const currentUser = currentUserRes.rows[0];

        // 2. Prepare dynamic update fields
        const fieldsToUpdate = [];
        const values = [];
        let paramIndex = 1;

        const addField = (col, val) => {
            if (val !== undefined) {
                fieldsToUpdate.push(`${col} = $${paramIndex++}`);
                values.push(val);
            }
        };

        // 3. Check duplicates ONLY if critical fields are changing
        // Email
        if (updates.email && updates.email !== currentUser.email) {
            const check = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [updates.email, id]);
            if (check.rows.length > 0) return res.status(400).json({ success: false, error: 'Email já está em uso.' });
            addField('email', updates.email);
        }

        // Username
        if (updates.username && updates.username !== currentUser.username) {
            const check = await db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [updates.username, id]);
            if (check.rows.length > 0) return res.status(400).json({ success: false, error: 'Username já está em uso.' });
            addField('username', updates.username);
        }

        // CPF
        if (updates.cpf && updates.cpf !== currentUser.cpf) {
            const check = await db.query('SELECT id FROM users WHERE cpf = $1 AND id != $2', [updates.cpf, id]);
            if (check.rows.length > 0) return res.status(400).json({ success: false, error: 'CPF já está em uso.' });
            addField('cpf', updates.cpf);
        }

        // Other fields
        if (updates.firstName || updates.lastName) {
            const fName = updates.firstName || currentUser.first_name;
            const lName = updates.lastName || currentUser.last_name;
            addField('first_name', fName);
            addField('last_name', lName);
            addField('name', `${fName} ${lName}`);
        }

        addField('phone', updates.phone);
        addField('registration_date', updates.registrationDate);
        addField('role', updates.role);
        addField('status', updates.status);
        addField('avatar_url', updates.avatarUrl);

        if (updates.address) {
            addField('address_street', updates.address.street);
            addField('address_number', updates.address.number);
            addField('address_complement', updates.address.complement);
            addField('address_district', updates.address.district);
            addField('address_city', updates.address.city);
            addField('address_state', updates.address.state);
            addField('address_zip', updates.address.zip);
        }

        if (updates.tenant_id !== undefined) {
            const tId = updates.tenant_id === '' ? null : parseInt(updates.tenant_id);
            addField('tenant_id', tId);
        }

        if (updates.permissions) {
            addField('permissions', JSON.stringify(updates.permissions));
        }

        // Password Logic
        if (updates.newPassword) {
            const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'Super Admin';

            if (!isAdmin) {
                if (!updates.oldPassword) return res.status(400).json({ success: false, error: 'Senha antiga obrigatória.' });
                const isValid = await bcrypt.compare(updates.oldPassword, currentUser.password_hash);
                if (!isValid) return res.status(400).json({ success: false, error: 'Senha antiga incorreta.' });
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(updates.newPassword, salt);
            addField('password_hash', hash);
        }

        addField('updated_at', new Date());

        if (fieldsToUpdate.length === 0) {
            console.log('[UPDATE USER] No fields to update.');
            return res.json({ success: true, member: currentUser, message: 'Nada a atualizar' });
        }

        console.log('[UPDATE USER] Executing Query Fields:', fieldsToUpdate);

        // Execute Update
        const query = `
            UPDATE users 
            SET ${fieldsToUpdate.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, username, first_name, last_name, email, phone, cpf, role, status, updated_at
        `;
        values.push(id);

        const result = await db.query(query, values);
        res.json({ success: true, member: result.rows[0], message: 'Usuário atualizado com sucesso' });

    } catch (err) {
        console.error('Error updating team member:', err);
        if (err.code === '23505') return res.status(400).json({ success: false, error: 'Dados duplicados (db constraint).' });
        res.status(500).json({ success: false, error: 'Database error: ' + err.message });
    }
};

const deleteTeamMember = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`UPDATE users SET status = 'deleted', updated_at = NOW() WHERE id = $1 RETURNING id`, [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Membro não encontrado' });
        res.json({ success: true, message: 'Membro removido com sucesso' });
    } catch (err) {
        console.error('Error deleting team member:', err);
        res.status(500).json({ success: false, error: 'Database error: ' + err.message });
    }
};

const updateApiKeys = async (req, res) => {
    const { id } = req.params;
    const { openai_key, gemini_key, anthropic_key } = req.body;

    try {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (openai_key !== undefined) {
            updates.push(`openai_key = $${paramCount++}`);
            values.push(openai_key ? encrypt(openai_key) : null);
        }
        if (gemini_key !== undefined) {
            updates.push(`gemini_key = $${paramCount++}`);
            values.push(gemini_key ? encrypt(gemini_key) : null);
        }
        if (anthropic_key !== undefined) {
            updates.push(`anthropic_key = $${paramCount++}`);
            values.push(anthropic_key ? encrypt(anthropic_key) : null);
        }

        if (updates.length === 0) return res.json({ success: true });

        values.push(id);
        const query = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`;

        await db.query(query, values);
        res.json({ success: true, message: 'Chaves de API atualizadas com segurança.' });
    } catch (err) {
        console.error('Error updating API keys:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const getApiKeys = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT openai_key, gemini_key, anthropic_key FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

        const keys = result.rows[0];
        // Retornar chaves descriptografadas para o frontend (necessário para ferramentas de IA client-side)
        // TODO: Migrar chamadas para o backend e voltar a mascarar
        res.json({
            success: true,
            keys: {
                openai: keys.openai_key ? decrypt(keys.openai_key) : '',
                gemini: keys.gemini_key ? decrypt(keys.gemini_key) : '',
                anthropic: keys.anthropic_key ? decrypt(keys.anthropic_key) : ''
            }
        });
    } catch (err) {
        console.error('Error fetching API keys:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

const createUser = createTeamMember;

const getUserUsage = async (req, res) => {
    const userId = req.user.id;
    try {
        // 1. Buscar plano e limites
        const userRes = await db.query(`
            SELECT u.plan_id, p.name as plan_name, p.limits 
            FROM users u 
            LEFT JOIN plans p ON u.plan_id = p.id 
            WHERE u.id = $1
        `, [userId]);

        const userPlan = userRes.rows[0];
        const limits = userPlan?.limits || { social_posts_per_day: 3, ai_generations_per_day: 5 };
        const planName = userPlan?.plan_name || 'Free';

        // 2. Calcular uso (Posts nas últimas 24h)
        const postsRes = await db.query(`
            SELECT COUNT(*) as count 
            FROM social_posts 
            WHERE user_id = $1 
            AND created_at > NOW() - INTERVAL '1 day'
        `, [userId]);

        const postsUsage = parseInt(postsRes.rows[0].count);

        // 3. Calcular uso (IA - Mockado por enquanto)
        const aiUsage = 0;

        res.json({
            plan: planName,
            limits,
            usage: {
                social_posts: postsUsage,
                ai_generations: aiUsage
            }
        });

    } catch (error) {
        console.error('Error fetching user usage:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    upload,
    updateAvatar,
    createUser,
    login,
    register,
    getTeamMembers,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    forgotPassword,
    resetPasswordConfirm,
    updateApiKeys,
    getApiKeys,
    getUserUsage
};
