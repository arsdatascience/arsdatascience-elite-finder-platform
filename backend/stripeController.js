const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

// MAPA DE PREÇOS (Substituir pelos Price IDs reais do Stripe Dashboard)
// Ex: price_1Pqy...
const PLAN_PRICES = {
    'Pro': process.env.STRIPE_PRICE_PRO || 'price_fake_pro',
    'Enterprise': process.env.STRIPE_PRICE_ENTERPRISE || 'price_fake_enterprise'
};

const createCheckoutSession = async (req, res) => {
    const { planName } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Se não tiver chave configurada, simular sucesso para teste (Dev Mode)
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'mock_key') {
        console.log('⚠️ MOCK STRIPE: Simulando checkout para', planName);
        // Em dev, vamos atualizar direto para testar a UI
        try {
            const planRes = await db.query('SELECT id FROM plans WHERE name = $1', [planName]);
            if (planRes.rows.length > 0) {
                await db.query('UPDATE users SET plan_id = $1 WHERE id = $2', [planRes.rows[0].id, userId]);
            }
            return res.json({ url: `${process.env.FRONTEND_URL || 'https://marketinghub.aiiam.com.br'}/settings?payment=success_mock` });
        } catch (e) {
            return res.status(500).json({ error: 'Erro no mock de pagamento' });
        }
    }

    if (!PLAN_PRICES[planName]) {
        return res.status(400).json({ error: 'Plano inválido ou não configurado' });
    }

    let priceId = PLAN_PRICES[planName];

    // Correção automática: Se for um Product ID (prod_), buscar o Price ID correspondente
    if (priceId.startsWith('prod_')) {
        try {
            console.log(`⚠️ Detectado Product ID (${priceId}) em vez de Price ID. Buscando preço...`);
            const prices = await stripe.prices.list({
                product: priceId,
                active: true,
                limit: 1,
            });

            if (prices.data.length > 0) {
                priceId = prices.data[0].id;
                console.log(`✅ Preço encontrado: ${priceId}`);
            } else {
                throw new Error('Nenhum preço ativo encontrado para este produto.');
            }
        } catch (err) {
            console.error('Erro ao buscar preço do produto:', err);
            return res.status(500).json({ error: 'Erro de configuração do Stripe: Preço não encontrado para o produto.' });
        }
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL || 'https://marketinghub.aiiam.com.br'}/settings?payment=success`,
            cancel_url: `${process.env.FRONTEND_URL || 'https://marketinghub.aiiam.com.br'}/settings?payment=canceled`,
            customer_email: userEmail,
            metadata: {
                userId: userId.toString(),
                planName: planName
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        res.status(500).json({ error: 'Erro ao criar sessão de pagamento: ' + error.message });
    }
};

const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const planName = session.metadata.planName;

        console.log(`💰 Pagamento recebido de User ${userId} para plano ${planName}`);

        try {
            // Atualizar plano do usuário
            const planRes = await db.query('SELECT id FROM plans WHERE name = $1', [planName]);
            if (planRes.rows.length > 0) {
                const planId = planRes.rows[0].id;
                await db.query('UPDATE users SET plan_id = $1, updated_at = NOW() WHERE id = $2', [planId, userId]);
                console.log('✅ Plano do usuário atualizado com sucesso.');
            }
        } catch (dbErr) {
            console.error('Erro ao atualizar banco após pagamento:', dbErr);
        }
    }

    res.json({ received: true });
};

module.exports = {
    createCheckoutSession,
    handleWebhook
};
