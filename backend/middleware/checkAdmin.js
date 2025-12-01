const checkAdmin = (req, res, next) => {
    // Agora restrito apenas a super_admin
    if (req.user && (req.user.role === 'super_admin' || req.user.role === 'Super Admin')) {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado. Apenas Super Administradores.' });
    }
};

module.exports = checkAdmin;
