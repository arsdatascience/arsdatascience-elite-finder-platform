# Deploy n8n no Railway

Para fazer o deploy do n8n usando este repositório no Railway:

1. **Novo Projeto**: No Railway, clique em "New Project" -> "Deploy from GitHub repo".
2. **Selecionar Repositório**: Escolha o repositório `elite-finder-appv1`.
3. **Configurar Root Directory**:
   - Vá em `Settings` -> `Root Directory`
   - Defina como: `/n8n`
   - Isso fará o Railway usar o `Dockerfile` que criamos nesta pasta.

4. **Variables**:
   - Vá na aba `Variables` e adicione as seguintes (copiadas do seu stack atual):

| Variável | Valor | Observação |
|----------|-------|------------|
| `N8N_HOST` | `arsdatascience-n8n.aiiam.com.br` | Domínio customizado (configure em Settings -> Domains) |
| `N8N_PROTOCOL` | `https` | |
| `N8N_PORT` | `5678` | |
| `WEBHOOK_URL` | `https://arsdatascience-n8n.aiiam.com.br` | Use o mesmo domínio principal |
| `GENERIC_TIMEZONE` | `America/Sao_Paulo` | |
| `TZ` | `America/Sao_Paulo` | |
| `N8N_DEFAULT_LOCALE` | `pt_BR` | |
| `DB_TYPE` | `postgresdb` | |
| `DB_POSTGRESDB_HOST` | `crossover.proxy.rlwy.net` | |
| `DB_POSTGRESDB_PORT` | `59957` | |
| `DB_POSTGRESDB_DATABASE` | `railway` | |
| `DB_POSTGRESDB_SCHEMA` | `n8n_workflows` | Importante para isolamento |
| `DB_POSTGRESDB_USER` | `postgres` | |
| `DB_POSTGRESDB_PASSWORD` | `aYLfhaDtABXovCxhPjBOFObCYQTgMvfZ` | |
| `N8N_BASIC_AUTH_ACTIVE` | `true` | |
| `N8N_BASIC_AUTH_USER` | `admin` | |
| `N8N_BASIC_AUTH_PASSWORD` | `ArsN8n@2025!Secure` | |
| `N8N_ENCRYPTION_KEY` | `f96fbf92bcec8a3f0c126656b6a6059287a44d2f2eef495f348922ff17bfe9d3` | **CRÍTICO: Não perca isso ou perderá as credenciais salvas** |
| `N8N_CORS_ORIGIN` | `https://marketinghub.aiiam.com.br,https://elitefinder.vercel.app,https://*.vercel.app,https://elite-finder.up.railway.app,https://*.up.railway.app` | Permitir Embed |
| `N8N_SECURE_COOKIE` | `true` | |
| `N8N_COOKIE_SAMESITE` | `none` | Necessário para iframe |
| `N8N_RUNNERS_ENABLED` | `true` | |
| `N8N_GIT_NODE_DISABLE_BARE_REPOS` | `true` | |

5. **Volume (Persistência)**:
   - Vá na aba `Volumes`.
   - Clique em "Add Volume".
   - Mount Path: `/home/node/.n8n`
   - Isso garante que seus arquivos (chaves ssh, uploads locais) não sumam no restart.

6. **Domínio**:
   - Vá em `Settings` -> `Networking` -> `Public Networking`.
   - Adicione o domínio customizado `arsdatascience-n8n.aiiam.com.br`.
