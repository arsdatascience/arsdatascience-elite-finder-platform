# Checklist de Atualização para marketinghub.aiiam.com.br

Para que o login no iframe funcione no novo domínio, atualize o `docker-compose.yml` no servidor:

## 1. Variáveis de Ambiente do n8n

```yaml
environment:
  - N8N_CORS_ORIGIN=https://marketinghub.aiiam.com.br,https://elitefinder.vercel.app,https://*.vercel.app,http://localhost:5173
  - N8N_SECURE_COOKIE=true
  - N8N_COOKIE_SAMESITE=none
```

## 2. Labels do Traefik (CSP e CORS)

Localize e atualize estas linhas nas `labels`:

```yaml
labels:
  # Permite que o marketinghub carregue o n8n em iframe
  - "traefik.http.middlewares.n8n-csp.headers.contentsecuritypolicy=frame-ancestors 'self' https://marketinghub.aiiam.com.br https://elitefinder.vercel.app https://*.vercel.app http://localhost:5173"
  
  # Permite requisições CORS do marketinghub (se estiver usando o middleware n8n-cors)
  - "traefik.http.middlewares.n8n-cors.headers.accesscontrolalloworiginlist=https://marketinghub.aiiam.com.br,https://elitefinder.vercel.app,https://*.vercel.app,http://localhost:5173"
  
  # Se tiver o header customframeoptionsvalue, atualize ou remova (recomendado remover pois é obsoleto)
  # - "traefik.http.middlewares.n8n-iframe.headers.customframeoptionsvalue=ALLOW-FROM https://marketinghub.aiiam.com.br"
```

## 3. Aplicar Mudanças

Rode no terminal do servidor:
```bash
docker-compose up -d
```

Depois, acesse **https://marketinghub.aiiam.com.br** e teste o login na Automação.
