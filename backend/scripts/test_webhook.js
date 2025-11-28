const WebhookService = require('../services/webhookService');

// Simula um evento para testar a integração com n8n
async function test() {
    console.log('🚀 Testando disparo de Webhook para n8n...');
    console.log('ℹ️  Certifique-se de ter configurado a variável N8N_WEBHOOK_USER_CREATED no .env ou Railway.');

    const mockUser = {
        id: 999,
        name: 'Teste Webhook',
        email: 'teste@webhook.com',
        role: 'user',
        created_at: new Date().toISOString()
    };

    try {
        await WebhookService.trigger('USER_CREATED', mockUser);
        console.log('✅ Disparo iniciado. Verifique o console do n8n para ver se o dado chegou.');
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

test();
