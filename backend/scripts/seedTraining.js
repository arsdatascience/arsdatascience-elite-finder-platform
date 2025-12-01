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

        // Limpar módulos existentes (opcional, cuidado em produção)
        // await client.query('DELETE FROM training_modules');

        const modules = [
            {
                title: 'Técnicas Avançadas de Vendas',
                description: 'Domine a arte de fechar negócios com técnicas comprovadas de persuasão e negociação.',
                duration: 45,
                order_index: 1,
                video_url: 'https://www.youtube.com/watch?v=example1' // Placeholder
            },
            {
                title: 'Excelência no Atendimento (SAC)',
                description: 'Como transformar reclamações em fidelidade e encantar clientes em cada interação.',
                duration: 60,
                order_index: 2,
                video_url: 'https://www.youtube.com/watch?v=example2' // Placeholder
            },
            {
                title: 'Gestão de CRM e Pipeline',
                description: 'Maximize o uso do seu CRM para organizar leads e aumentar a conversão.',
                duration: 90,
                order_index: 3,
                video_url: 'https://www.youtube.com/watch?v=example3' // Placeholder
            }
        ];

        for (const module of modules) {
            // Verificar se já existe para evitar duplicatas
            const check = await client.query('SELECT id FROM training_modules WHERE title = $1', [module.title]);
            if (check.rows.length === 0) {
                await client.query(
                    'INSERT INTO training_modules (title, description, duration, order_index, video_url) VALUES ($1, $2, $3, $4, $5)',
                    [module.title, module.description, module.duration, module.order_index, module.video_url]
                );
                console.log(`Módulo criado: ${module.title}`);
            } else {
                console.log(`Módulo já existe: ${module.title}`);
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
