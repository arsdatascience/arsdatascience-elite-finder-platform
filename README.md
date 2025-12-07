# Elite Finder 2.0 🚀

**Plataforma de Inteligência Artificial para Marketing, Vendas e Gestão Financeira.**

O Elite Finder é um ecossistema "Simbiótico" onde CRM, Marketing, Projetos e Financeiro operam como um único organismo inteligente, automatizando decisões e otimizando resultados.

---

## 🏗️ Arquitetura de Sistema e Integrações (Omnichannel)

O sistema opera em uma arquitetura de microsserviços modular, garantindo fluidez, escala e interconectividade.

### 1. Núcleo de Dados (Dual-Database Architecture)
*   **Data Core (PostgreSQL):** Dados sensíveis e estruturais (Clientes, Auth, Tenants).
*   **Maglev Ops (PostgreSQL):** Dados operacionais de alta frequência (Projetos, Tasks, Financeiro, Assets, Serviços).
    *   *Benefício:* Garante que operações pesadas de relatório ou gestão não afetem o login ou a segurança dos clientes.
*   **Redis (Railway):** Cache de Alta Performance (<100ms) e Fila de Processamento (BullMQ).
*   **Qdrant (Vector DB):** Memória de Longo Prazo da IA (RAG).
*   **S3 Compatible Storage:** Armazenamento seguro de Assets.

### 2. Fluxo Omnichannel (Data Flow)
O sistema implementa um loop de dados contínuo validado:
1.  **Entrada:** Mensagem recebida via WhatsApp/Social.
2.  **Processamento:** Job criado no Redis (BullMQ).
3.  **Inteligência:** IA analisa sentimento e intenção (OpenAI/Anthropic) consultando o Qdrant (RAG).
4.  **Ação:** Atualiza Score do Lead e move cards no Flight Control em tempo real.

---

## 🌟 Módulos Implementados

### ✅ Fase 1: Gestão Corporativa (Flight Control)
*   **Centro de Projetos (Maglev):** Visão holística de todos os projetos em andamento, prazos e orçamentos.
*   **Kanban 3.0:** Quadro visual Drag-and-Drop para gestão ágil de entregas.
*   **Gestão de Carga de Trabalho:** Visualização de tarefas por membro da equipe.

### ✅ Fase 2: Operações e Conhecimento
*   **SOP Manager:** Gestão de Procedimentos Operacionais Padrão integrados às tarefas.
*   **Biblioteca Digital (Asset Library):** Upload inteligente e gestão de arquivos com link público.
*   **Central de Aprovações:** Workflow de aprovação com clientes (Tokenized Links).

### ✅ Fase 3: Financeiro e Serviços
*   **Módulo Financeiro:** Controle de Transações, Categorias e ROI de projetos.
*   **Service Catalog:** Gestão de portfólio de serviços e precificação.

### 🧠 Inteligência Artificial (Symbiosis Core)
*   **Smart Lead Mover:** Move leads no Kanban automaticamente conforme conversa.
*   **Elite Assistant:** Chatbot contextual com acesso a manuais e dados financeiros.
*   **Content Loop:** Geração de conteúdo baseada em logs de suporte.

---

## 🛠️ Stack Tecnológica

*   **Frontend:** React, TypeScript, TailwindCSS, Framer Motion, `@dnd-kit` (Kanban).
*   **Backend:** Node.js, Express, `bullmq` (Filas), `ioredis` (Cache), `pg` (Postgres Multi-Pool).
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
