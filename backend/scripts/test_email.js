const nodemailer = require('nodemailer');

const user = 'arsdatascience@gmail.com';
const pass = 'ukvhjvjuhbjedzf'.trim();

console.log(`📧 Configurando teste (Porta 587) para: ${user}`);

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Porta alterada
    secure: false, // STARTTLS
    auth: {
        user: user,
        pass: pass
    }
});

async function sendTestEmail() {
    try {
        console.log('🔄 Tentando autenticar e enviar via porta 587...');
        const info = await transporter.sendMail({
            from: `"Teste Elite Finder" <${user}>`,
            to: user,
            subject: 'Teste de Validação SMTP (Porta 587)',
            text: 'Teste de envio via porta 587.',
            html: '<b>Teste de envio via porta 587.</b>'
        });

        console.log('✅ SUCESSO! Email enviado.');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ FALHA DE AUTENTICAÇÃO OU ENVIO:');
        console.error(error.message);
    }
}

sendTestEmail();
