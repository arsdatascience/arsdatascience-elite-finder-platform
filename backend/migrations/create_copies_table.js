const db = require('./db');

const createCopiesTable = async () => {
    try {
        await db.query(`
      CREATE TABLE IF NOT EXISTS saved_copies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        topic TEXT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        tone VARCHAR(50),
        content JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Tabela saved_copies criada com sucesso!');
    } catch (error) {
        console.error('Erro ao criar tabela saved_copies:', error);
    }
};

createCopiesTable();
