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
                `${firstName} ${lastName}`,
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
                `${firstName} ${lastName}`,
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
            // Verificar se o erro é porque está tentando usar o mesmo email/username (não é erro)
            const currentUser = await db.query('SELECT email, username FROM users WHERE id = $1', [id]);
            if (currentUser.rows.length > 0) {
                const isSameEmail = currentUser.rows[0].email === email;
                const isSameUsername = currentUser.rows[0].username === username;

                if (isSameEmail && isSameUsername) {
                    // É o mesmo usuário, não é erro
                    return res.status(400).json({ success: false, error: 'Nenhuma alteração detectada' });
                }
            }
            return res.status(400).json({ success: false, error: 'Email ou username já utilizado por outro usuário' });
        }
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

module.exports = updateTeamMember;
