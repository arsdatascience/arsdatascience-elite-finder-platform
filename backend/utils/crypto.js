const crypto = require('crypto');

// Algoritmo de criptografia
const ALGORITHM = 'aes-256-cbc';

// Chave secreta (deve estar no .env e ter 32 bytes)
// Se não existir, usa um fallback (APENAS PARA DEV/TESTE - NÃO SEGURO PARA PROD)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    : crypto.scryptSync('elite-finder-secret-fallback', 'salt', 32);

const IV_LENGTH = 16; // Para AES, sempre 16

/**
 * Criptografa um texto
 * @param {string} text - Texto para criptografar
 * @returns {string} - Texto criptografado em formato hex (iv:content)
 */
function encrypt(text) {
    if (!text) return null;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Descriptografa um texto
 * @param {string} text - Texto criptografado (iv:content)
 * @returns {string} - Texto original
 */
function decrypt(text) {
    if (!text) return null;

    try {
        const textParts = text.split(':');

        // Se não tiver o formato correto (ex: tokens antigos não criptografados), retorna o original ou erro
        if (textParts.length < 2) {
            // Tenta retornar como está (migração gradual) ou null
            // Para segurança, melhor assumir que tudo deve estar criptografado.
            // Mas para evitar quebrar dados legados durante a migração:
            return text;
        }

        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        console.error('Erro na descriptografia:', error.message);
        return null; // Ou lançar erro
    }
}

module.exports = { encrypt, decrypt };
