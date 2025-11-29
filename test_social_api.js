const axios = require('axios');

async function testApi() {
    try {
        const urls = [
            'https://elite-finder-backend-production.up.railway.app',
            'https://elite-finder-backend.up.railway.app',
            'http://localhost:3001'
        ];

        for (const baseUrl of urls) {
            console.log(`\n--- Testando Base URL: ${baseUrl} ---`);
            try {
                const res = await axios.get(`${baseUrl}/api/clients`);
                console.log(`[SUCESSO] ${baseUrl}/api/clients: Status ${res.status}, Items: ${res.data.length}`);
                
                // Se funcionou, testar social
                try {
                    const resSocial = await axios.get(`${baseUrl}/api/social/posts`);
                    console.log(`[SUCESSO] ${baseUrl}/api/social/posts: Status ${resSocial.status}, Items: ${resSocial.data.length}`);
                    const campaigns = resSocial.data.filter(i => i.type === 'campaign');
                    console.log(`Campanhas encontradas: ${campaigns.length}`);
                } catch (errSocial) {
                    console.error(`[ERRO] ${baseUrl}/api/social/posts: ${errSocial.message}`);
                    if (errSocial.response) console.error(errSocial.response.data);
                }

            } catch (err) {
                console.error(`[FALHA] ${baseUrl}/api/clients: ${err.message}`);
            }
        }

    } catch (error) {
        console.error('Erro fatal:', error);
    }
}

testApi();
