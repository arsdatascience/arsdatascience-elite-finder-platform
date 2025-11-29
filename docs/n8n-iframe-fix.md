# Correção de Login no Iframe do n8n

Os erros `401 Unauthorized` e `Cannot read properties of undefined` indicam que o navegador está bloqueando os cookies de sessão do n8n por segurança, pois ele está rodando dentro de um iframe em outro domínio.

Para corrigir, você precisa configurar as seguintes Variáveis de Ambiente no seu serviço n8n no Railway:

## 1. Variáveis Obrigatórias

Adicione estas variáveis e **reinicie o serviço**:

```env
# Permite que o cookie seja enviado em conexões seguras (HTTPS)
N8N_SECURE_COOKIE=true

# Permite que o cookie seja usado em iframes de outros domínios (Cross-Site)
N8N_SAME_SITE_COOKIE=none
```

## 2. Verificação Adicional

Certifique-se também de que estas variáveis (que você já deve ter) estão corretas:

```env
# Deve ser a URL exata onde o n8n está acessível
N8N_EDITOR_BASE_URL=https://arsdatascience-n8n.aiiam.com.br

# Domínio do n8n
N8N_DOMAIN_NAME=arsdatascience-n8n.aiiam.com.br

# Configuração de Segurança para permitir o Iframe
# Substitua elitefinder.vercel.app pelo domínio do seu frontend se for diferente
N8N_HAVE_OWN_CONTEXT=true
```

## Por que isso acontece?

Navegadores modernos (Chrome, Safari) bloqueiam cookies de terceiros (Third-Party Cookies) por padrão, a menos que eles sejam explicitamente marcados como `Secure` e `SameSite=None`. Sem essas flags, o n8n tenta logar, o servidor responde com o cookie, mas o navegador **descarta** o cookie. Na próxima requisição, o n8n acha que você não está logado (401).
