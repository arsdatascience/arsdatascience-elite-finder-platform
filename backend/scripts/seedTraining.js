require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const seedTraining = async () => {
    const client = await pool.connect();
    try {
        console.log('Iniciando seed de módulos de treinamento...');
        await client.query('BEGIN');

        const modules = [
            // Colaboradores (Team)
            {
                title: 'Fundamentos de Google Ads',
                description: 'Aprenda os conceitos básicos de campanhas de pesquisa e display.',
                duration: 45,
                order_index: 1,
                video_url: 'https://www.youtube.com/watch?v=example1',
                audience: 'team'
            },
            {
                title: 'Meta Ads Avançado',
                description: 'Estratégias avançadas de segmentação e retargeting no Facebook e Instagram.',
                duration: 60,
                order_index: 2,
                video_url: 'https://www.youtube.com/watch?v=example2',
                audience: 'team'
            },
            {
                title: 'Automação de Marketing',
                description: 'Criação de fluxos de automação para nutrição de leads.',
                duration: 90,
                order_index: 3,
                video_url: 'https://www.youtube.com/watch?v=example3',
                audience: 'team'
            },
            // Clientes (Client)
            {
                title: 'Técnicas Avançadas de Vendas',
                description: 'Domine a arte de fechar negócios com técnicas comprovadas de persuasão e negociação.',
                duration: 45,
                order_index: 1,
                video_url: 'https://www.youtube.com/watch?v=example4',
                audience: 'client'
            },
            {
                title: 'Excelência no Atendimento (SAC)',
                description: 'Como transformar reclamações em fidelidade e encantar clientes em cada interação.',
                duration: 60,
                order_index: 2,
                video_url: 'https://www.youtube.com/watch?v=example5',
                audience: 'client'
            },
            {
                title: 'Gestão de CRM e Pipeline',
                description: 'Maximize o uso do seu CRM para organizar leads e aumentar a conversão.',
                duration: 90,
                order_index: 3,
                video_url: 'https://www.youtube.com/watch?v=example6',
                audience: 'client'
            }
        ];

        for (const module of modules) {
            // Verificar se já existe para evitar duplicatas
            const check = await client.query('SELECT id FROM training_modules WHERE title = $1', [module.title]);
            if (check.rows.length === 0) {
                await client.query(
                    'INSERT INTO training_modules (title, description, duration, order_index, video_url, audience) VALUES ($1, $2, $3, $4, $5, $6)',
                    [module.title, module.description, module.duration, module.order_index, module.video_url, module.audience]
                );
                console.log(`Módulo criado: ${module.title} (${module.audience})`);
            } else {
                // Atualizar audience se já existir
                await client.query(
                    'UPDATE training_modules SET audience = $1 WHERE title = $2',
                    [module.audience, module.title]
                );
                console.log(`Módulo atualizado: ${module.title}`);
            }
        }

        await client.query('COMMIT');
        console.log('Seed de treinamento concluído com sucesso!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao fazer seed de treinamento:', error);
    } finally {
        client.release();
        pool.end();
    }
};

seedTraining();
