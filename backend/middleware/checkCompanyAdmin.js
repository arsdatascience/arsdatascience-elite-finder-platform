const checkCompanyAdmin = (req, res, next) => {
    // Allows super_admin, super_user, and admin
    if (req.user && (
        req.user.role === 'super_admin' ||
        req.user.role === 'Super Admin' ||
        req.user.role === 'super_user' ||
        req.user.role === 'admin' ||
        req.user.role === 'Admin'
    )) {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado. Apenas Administradores.' });
    }
};

module.exports = checkCompanyAdmin;
