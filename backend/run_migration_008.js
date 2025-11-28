require('dotenv').config(); // Carregar variáveis de ambiente
const pool = require('./database');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', '008_add_ai_meta_params.sql'), 'utf8');
        console.log('Executando migração 008...');
        await pool.query(sql);
        console.log('Migração 008 concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro na migração:', error);
        process.exit(1);
    }
};

runMigration();
