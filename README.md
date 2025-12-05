# Elite Finder 2.0 🚀

**Plataforma de Inteligência Artificial para Marketing, Vendas e Gestão Financeira.**

O Elite Finder é um ecossistema "Simbiótico" onde CRM, Marketing, Projetos e Financeiro operam como um único organismo inteligente, automatizando decisões e otimizando resultados.

---

## 🏗️ Arquitetura de Sistema e Integrações (Omnichannel)

O sistema opera em uma arquitetura de microsserviços modular, garantindo fluidez, escala e interconectividade entre todos os dados.

### 1. Núcleo de Dados (Data Core)
*   **PostgreSQL (Railway):** Armazena dados relacionais críticos (Clientes, Projetos, Metadados de Arquivos, Financeiro). Garante integridade referencial.
*   **Redis (Railway):** 
    *   **Cache de Alta Performance:** Dashboard e Analytics carregam em <100ms.
    *   **Fila de Processamento (BullMQ):** Gerencia tarefas pesadas (envio em massa de WhatsApp, processamento de IA) sem travar a interface do usuário.
*   **Qdrant (Vector DB):** Memória de Longo Prazo da IA (RAG). Armazena estratégias de marketing, manuais e histórico, permitindo que a IA "lembre" do contexto da empresa.
*   **S3 Compatible Storage (Railway/AWS):** Armazenamento de Assets (Imagens, Vídeos, Documentos). O banco guarda apenas o link público, garantindo leveza.

### 2. Fluxo Omnichannel (Data Flow)
O sistema implementa um loop de dados contínuo validado:
1.  **Entrada:** Mensagem recebida via WhatsApp/Social.
2.  **Processamento:** Job criado no Redis (BullMQ).
3.  **Inteligência:** IA analisa sentimento e intenção (OpenAI/Anthropic) consultando o Qdrant (RAG).
4.  **Ação:** Atualiza Score do Lead no PostgreSQL e notifica o UI via WebSocket em tempo real.

---

## 🌟 Módulos Implementados

### ✅ Fase 1: Gestão Corporativa (Project & Portfolio)
*   **Centro de Projetos:** Visão holística de todos os projetos em andamento, prazos e orçamentos.
*   **Kanban de Tarefas:** Quadro visual Drag-and-Drop para gestão ágil de entregas.
*   **Gestão de Carga de Trabalho:** Visualização de tarefas por membro da equipe para evitar gargalos.

### ✅ Fase 2: Operações e Conhecimento
*   **Biblioteca Digital (Asset Library):**
    *   Upload inteligente direto para nuvem (S3).
    *   Organização hierárquica por pastas.
    *   Busca global de arquivos.
*   **Central de Aprovações (Approval Workflow):**
    *   **Links Públicos Seguros:** Clientes aprovam peças sem precisar de login e senha.
    *   **Histórico de Revisão:** Detalhes de quem aprovou, rejeitou ou pediu alterações e quando.
    *   **Integração Social:** Postagens agendadas geram automaticamente pedidos de aprovação.

### 🧠 Inteligência Artificial (Symbiosis Core)
*   **Smart Lead Mover:** Move leads no Kanban automaticamente baseado na análise de conversas.
*   **Financial Advisor:** Chatbot com acesso em tempo real ao fluxo de caixa.
*   **Content Loop:** Gera pautas de conteúdo baseadas nas dores dos clientes.

---

## 🛠️ Stack Tecnológica

*   **Frontend:** React, TypeScript, TailwindCSS, Framer Motion, `@dnd-kit` (Kanban), `Recharts` (Analytics).
*   **Backend:** Node.js, Express, `bullmq` (Filas), `ioredis` (Cache), `pg` (Postgres).
*   **Infraestrutura:** Docker Ready, Deploy via Railway/Vercel.
*   **IA Models:** OpenAI (GPT-4o), Google (Gemini 2.0 Flash), Anthropic (Claude 3.5 Sonnet).

---

## 🚀 Como Iniciar

1.  **Instalação:**
    ```bash
    npm install
    # (Execute na raiz para instalar dependências de scripts, ou nas pastas backend/frontend individualmente)
    ```

2.  **Configuração:**
    Crie um arquivo `.env` na pasta `backend/` com as credenciais de Banco, Redis, S3 e APIs de IA.

3.  **Execução:**
    ```bash
    # Backend (Porta 3001)
    cd backend && npm run dev
    
    # Frontend (Porta 5173)
    cd frontend && npm run dev
    ```

4.  **Acesso:**
    Abra `http://localhost:5173`.

---

## 📄 Licença
Proprietário - Todos os direitos reservados.
