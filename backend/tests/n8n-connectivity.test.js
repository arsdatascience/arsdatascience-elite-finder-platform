const axios = require('axios');
const WebhookService = require('../services/webhookService');

// Mock do Axios
jest.mock('axios');

describe('N8N Connectivity & Resilience', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Configurações de teste
        process.env.N8N_MAX_RETRIES = '3';
        process.env.N8N_RETRY_DELAY = '10'; // Rápido para testes
    });

    test('Deve disparar webhook com sucesso (200 OK)', async () => {
        axios.post.mockResolvedValue({ status: 200 });

        // Usamos _sendWithRetry diretamente para poder aguardar a Promise no teste
        await WebhookService._sendWithRetry('http://mock-url', 'USER_CREATED', { id: 1 }, {});

        expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('Deve tentar novamente (retry) em caso de falha de rede', async () => {
        // Falha na primeira tentativa, sucesso na segunda
        axios.post
            .mockRejectedValueOnce(new Error('Network Error'))
            .mockResolvedValueOnce({ status: 200 });

        await WebhookService._sendWithRetry('http://mock-url', 'TEST_EVENT', {}, {});

        expect(axios.post).toHaveBeenCalledTimes(2);
    });

    test('Deve respeitar o número máximo de retries', async () => {
        // Falha sempre
        axios.post.mockRejectedValue(new Error('Persistent Error'));

        await WebhookService._sendWithRetry('http://mock-url', 'TEST_EVENT', {}, {});

        // Deve tentar exatamente N8N_MAX_RETRIES vezes
        expect(axios.post).toHaveBeenCalledTimes(3);
    });
});
