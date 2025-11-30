const db = require('../database');

const checkLimit = (resourceType) => {
    return async (req, res, next) => {
        const userId = req.user ? req.user.id : null;

        // Se for admin, bypass limits
        if (req.user && req.user.role === 'admin') return next();

        if (!userId) {
            // Se a rota exige limite, exige autenticação.
            // Se for chamada sem auth (ex: rota pública), o middleware de auth deve vir antes.
            // Se chegou aqui sem user, é erro de configuração de rota.
            console.warn('⚠️ checkLimit chamado sem usuário autenticado.');
            return res.status(401).json({ error: 'Authentication required for usage limits' });
        }

        try {
            // 1. Buscar plano do usuário
            const userRes = await db.query(`
                SELECT u.plan_id, p.limits 
                FROM users u 
                LEFT JOIN plans p ON u.plan_id = p.id 
                WHERE u.id = $1
            `, [userId]);

            const userPlan = userRes.rows[0];
            // Fallback seguro se não tiver plano associado
            const limits = userPlan?.limits || { social_posts_per_day: 3, ai_generations_per_day: 5 };

            // 2. Verificar uso atual
            if (resourceType === 'social_post') {
                const limit = limits.social_posts_per_day || 0;

                const usageRes = await db.query(`
                    SELECT COUNT(*) as count 
                    FROM social_posts 
                    WHERE user_id = $1
                    AND created_at > NOW() - INTERVAL '1 day'
                `, [userId]);

                const usage = parseInt(usageRes.rows[0].count);

                if (usage >= limit) {
                    return res.status(403).json({
                        error: 'Limit reached',
                        message: `Você atingiu o limite diário de ${limit} posts. Faça upgrade para o plano Pro.`
                    });
                }
            }
            // Adicionar outros recursos aqui (ai_generation, team_members, etc)

            next();
        } catch (error) {
            console.error('Rate limit check error:', error);
            next();
        }
    };
};

module.exports = checkLimit;
