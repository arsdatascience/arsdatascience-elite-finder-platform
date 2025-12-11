# Corrigindo o Erro de Iframe (X-Frame-Options) com Cloudflare

O erro `Refused to display ... because it set 'X-Frame-Options' to 'sameorigin'` acontece porque o n8n bloqueia ser colocado em sites externos por padrão, e o Railway não nos deixa remover esse bloqueio facilmente via código.

Como você já usa o Cloudflare, a solução mais profissional e robusta é configurar uma regra lá para remover esse cabeçalho.

## Passo 1: Ativar o Proxy (Nuvem Laranja) ☁️
1. No painel do Cloudflare, vá em **DNS**.
2. Encontre o CNAME `arsdatascience-n8n`.
3. Edite e mude o Status do Proxy para **Proxied** (Nuvem Laranja).
4. Salve.

## Passo 2: Ajustar SSL (Importante!) 🔒
1. Vá em **SSL/TLS** no menu lateral.
2. Mude o modo de encriptação para **Full (Strict)**.
   *Isso evita o erro de "Too Many Redirects", pois o Railway já usa HTTPS.*

## Passo 3: Criar Regra de Transformação (A Mágica) 🪄
1. No menu lateral, vá em **Rules** -> **Transform Rules**.
2. Clique na aba **Modify Response Header**.
3. Clique em **Create rule**.
4. **Rule Name**: `Fix N8N Iframe`
5. **If incoming request matches**:
   - Field: `Hostname`
   - Operator: `equals`
   - Value: `arsdatascience-n8n.aiiam.com.br`
6. **Then modify response header...**:
   - Choose: **Remove**
   - Header name: `X-Frame-Options`
7. Clique em **Deploy**.

## Passo 4 (Opcional): Adicionar CSP
Se ainda der erro, adicione uma segunda ação na mesma regra acima:
- Choose: **Set dynamic**
- Header name: `Content-Security-Policy`
- Value: `'frame-ancestors 'self' https://marketinghub.aiiam.com.br https://*.vercel.app'`

Agora o Cloudflare vai interceptar a resposta do n8n e remover o bloqueio antes de chegar no seu navegador! 🚀
