# 🚀 Elite Finder Platform v1.0

O **Elite Finder** é uma plataforma "All-in-One" de nível empresarial para gestão de marketing digital, automação de vendas, CRM e criação de conteúdo impulsionada por Inteligência Artificial. Projetada para agências e profissionais de marketing que buscam centralizar suas operações e escalar resultados.

---

## 🌟 Funcionalidades Principais

### 🎨 AI Creative Studio (Geração de Imagens)
Um estúdio completo para criação de ativos visuais de alta performance.
- **Múltiplos Modelos de IA**: Suporte integrado para **Flux Schnell/Dev**, **DALL-E 3** e **Gemini Flash Image**.
- **Templates de Prompt Inteligentes**: Biblioteca com mais de **110 templates** organizados por nicho (Saúde, Tech, Varejo, etc.) e sistema para criar e salvar seus próprios templates.
- **Ferramentas de Edição Avançada**:
  - **Editor Integrado**: Recorte, filtros, ajustes de cor e desenho livre.
  - **Upscale**: Aumento de resolução de imagens com IA.
  - **Remoção de Fundo**: Extração automática de fundo para criação de produtos e stickers.
  - **Variações**: Gere versões alternativas de qualquer imagem criada.
- **Facilitadores de Produtividade**:
  - **Tradução Automática**: Traduza prompts do Português para Inglês (e vice-versa) com um clique.
  - **Histórico de Prompts**: Reutilize seus melhores prompts facilmente.
  - **Formatos Personalizados**: Escolha entre formatos padrão (1:1, 16:9, 9:16) ou defina dimensões personalizadas.
- **Analytics de IA**: Dashboard dedicado para monitorar custos, consumo de créditos e modelos mais utilizados.

### 📊 Dashboard & Business Intelligence
- **Visão Unificada**: KPIs em tempo real de todas as campanhas e canais.
- **Funil de Vendas**: Acompanhamento visual da jornada do cliente.
- **Relatórios**: Gráficos de desempenho, conversões por origem e ROI.

### 🤖 Automação de Marketing
- **Workflows Visuais**: Criação de fluxos de automação com gatilhos e ações.
- **Integrações**: Conexão com plataformas de anúncios (Google Ads, Meta Ads) e CRMs.

### 👥 CRM & Gestão de Clientes
- **Gestão de Leads**: Pipeline de vendas, status e qualificação.
- **Perfil de Clientes**: Histórico completo de interações e dados.

### 📱 Social Media Management
- **Agendamento de Posts**: Planejamento e publicação de conteúdo.
- **Gestão de Mídia**: Biblioteca de ativos digitais.

### 🏢 Gestão Administrativa
- **Controle de Equipe**: Gestão de usuários, papéis e permissões.
- **Configurações do Sistema**: Personalização da plataforma.

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** com TypeScript
- **Vite** (Build Tool)
- **Tailwind CSS** (Estilização)
- **Lucide React** (Ícones)
- **Recharts** (Visualização de Dados)
- **Framer Motion** (Animações)

### Backend
- **Node.js** & **Express**
- **PostgreSQL** (Banco de Dados)
- **OpenAI API** (DALL-E, GPT)
- **Google Generative AI** (Gemini)
- **Replicate API** (Flux Models)

---

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js (v18+)
- PostgreSQL
- Chaves de API (OpenAI, Google, Replicate)

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/elite-finder-appv1.git
   cd elite-finder-appv1
   ```

2. **Configuração do Backend**
   ```bash
   cd backend
   npm install
   
   # Crie um arquivo .env na pasta backend com as seguintes variáveis:
   # PORT=3001
   # DATABASE_URL=postgresql://user:pass@localhost:5432/elite_finder
   # OPENAI_API_KEY=sk-...
   # GOOGLE_API_KEY=...
   # REPLICATE_API_TOKEN=...
   # JWT_SECRET=sua_chave_secreta
   
   # Execute as migrações do banco de dados (o servidor faz isso automaticamente ao iniciar)
   npm start
   ```

3. **Configuração do Frontend**
   ```bash
   cd frontend
   npm install
   
   # Crie um arquivo .env na pasta frontend (opcional, defaults configurados):
   # VITE_API_URL=http://localhost:3001/api
   
   npm run dev
   ```

4. **Acesso**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`

---

## 📂 Estrutura do Projeto

```
elite-finder-appv1/
├── backend/
│   ├── migrations/       # Scripts SQL para estrutura do banco
│   ├── routes/           # Rotas da API (se separado)
│   ├── server.js         # Ponto de entrada e configuração do Express
│   ├── imageGenerationController.js # Lógica de IA
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes React reutilizáveis
│   │   │   ├── image-generation/ # Módulos do AI Studio
│   │   │   └── ...
│   │   ├── services/     # Clientes de API (Axios)
│   │   ├── lib/          # Utilitários e constantes (ex: templates)
│   │   └── types/        # Definições de tipos TypeScript
│   └── ...
└── ...
```

---

## 📄 Licença

Este projeto é proprietário e desenvolvido para uso exclusivo da **Elite Creative Studio**.
