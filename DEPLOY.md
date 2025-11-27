# Guia de Deploy - Elite Finder

Este guia descreve os passos para realizar o deploy da aplicação Elite Finder.

## 1. Backend (Railway)

O backend é uma aplicação Node.js com PostgreSQL.

### Pré-requisitos
- Conta no [Railway](https://railway.app/)
- Repositório GitHub conectado

### Passos
1. **Novo Projeto**: No Railway, clique em "New Project" > "Deploy from GitHub repo" e selecione o repositório `elite-finder-platform`.
2. **Variáveis de Ambiente**: Adicione as seguintes variáveis:
   - `PORT`: `3001`
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: (Será gerada automaticamente se você adicionar um plugin PostgreSQL, veja abaixo)
   - `OPENAI_API_KEY`: Sua chave da OpenAI
   - `GEMINI_API_KEY`: Sua chave do Google Gemini
   - `FRONTEND_URL`: A URL do seu frontend no Vercel (ex: `https://elite-finder-frontend.vercel.app`) - *Adicione após o deploy do frontend*
3. **Banco de Dados**:
   - No projeto do Railway, clique em "New" > "Database" > "PostgreSQL".
   - O Railway irá criar e conectar automaticamente a variável `DATABASE_URL`.
4. **Build & Deploy**: O Railway detectará o `Dockerfile` na pasta `backend` ou a raiz.
   - **Importante**: Configure o "Root Directory" nas configurações do serviço para `backend` se o Railway não detectar automaticamente.
   - O comando de start é `node server.js`.

## 2. Frontend (Vercel)

O frontend é uma aplicação React (Vite).

### Pré-requisitos
- Conta na [Vercel](https://vercel.com/)
- Repositório GitHub conectado

### Passos
1. **Novo Projeto**: Na Vercel, clique em "Add New..." > "Project" e importe o repositório `elite-finder-platform`.
2. **Configurações de Build**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (Clique em "Edit" e selecione a pasta `frontend`)
   - **Build Command**: `npm run build` (Padrão)
   - **Output Directory**: `dist` (Padrão)
3. **Variáveis de Ambiente**:
   - `VITE_API_URL`: A URL do seu backend no Railway (ex: `https://elite-finder-backend-production.up.railway.app`) - *Pegue essa URL no painel do Railway*
   - `VITE_USE_MOCK`: `false` (Para usar o backend real)
4. **Deploy**: Clique em "Deploy".

## 3. Pós-Deploy

1. **Atualizar URL do Frontend no Backend**:
   - Volte ao Railway e atualize a variável `FRONTEND_URL` com a URL final do Vercel.
   - O Railway irá redeployar automaticamente.

2. **Verificar Conexão**:
   - Acesse o frontend.
   - Tente fazer login (se o banco estiver vazio, crie um usuário via API ou insira manualmente no banco).
   - Verifique se os dados estão carregando (Dashboard, Campanhas, etc.).

## Solução de Problemas Comuns

- **Erro de CORS**: Verifique se `FRONTEND_URL` no backend corresponde exatamente à URL do frontend (sem barra no final, geralmente).
- **Erro de Conexão com Banco**: Verifique se `DATABASE_URL` está correta no Railway.
- **Tela Branca no Frontend**: Verifique o console do navegador. Se for erro 404 em rotas, verifique se `vercel.json` está na raiz do frontend.
