# 🚀 Elite Finder Platform - Manual Completo

Bem-vindo à documentação oficial da **Elite Finder Platform**. Este documento detalha todas as funcionalidades, módulos e ferramentas disponíveis no sistema.

---

## 📚 Índice

1. [Visão Geral](#-visão-geral)
2. [Dashboard & Analytics](#-dashboard--analytics)
3. [CRM & Gestão de Clientes](#-crm--gestão-de-clientes)
4. [Automação de Marketing](#-automação-de-marketing)
5. [AI Creative Studio (Geração de Imagens)](#-ai-creative-studio)
6. [Social Media Management](#-social-media-management)
7. [Gestão de Equipe & Configurações](#-gestão-de-equipe--configurações)
8. [Instalação Técnica](#-instalação-técnica)

---

## 🌟 Visão Geral

O Elite Finder é uma solução "All-in-One" que centraliza operações de agências digitais. Ele elimina a necessidade de múltiplas ferramentas desconexas, integrando CRM, Automação, IA e Analytics em uma única interface coesa.

---

## 📊 Dashboard & Analytics

O centro de comando da sua operação. Aqui você tem uma visão panorâmica do desempenho do negócio.

### Funcionalidades Principais:
- **KPIs em Tempo Real**: Monitore métricas vitais como *Total de Leads*, *Custo por Lead (CPL)*, *Taxa de Conversão* e *ROI*.
- **Filtros Inteligentes**: Visualize dados por período (Hoje, 7 dias, 30 dias) ou por cliente específico.
- **Gráficos de Tendência**:
  - *Evolução de Leads*: Linha do tempo mostrando a aquisição de leads.
  - *Origem de Tráfego*: Gráfico de pizza detalhando canais (Google, Meta, Orgânico).
- **Funil de Vendas Visual**: Acompanhe a jornada do cliente desde a visita até o fechamento.

---

## 👥 CRM & Gestão de Clientes

Gerencie o relacionamento com seus clientes e leads de forma estruturada.

### Funcionalidades:
- **Lista de Clientes**: Cadastro completo de empresas/clientes com dados de contato, setor e status.
- **Pipeline de Leads**:
  - Visualização em Lista ou Kanban (em breve).
  - Status personalizáveis (Novo, Qualificado, Proposta, Fechado).
- **Histórico de Interações**: Registro automático de atividades e notas manuais.
- **Integração com WhatsApp**: (Módulo Beta) Inicie conversas diretamente do CRM.

---

## 🤖 Automação de Marketing

Crie máquinas de vendas que trabalham 24/7.

### Funcionalidades:
- **Construtor de Workflows**: Interface visual "Drag-and-Drop" para criar sequências lógicas.
- **Gatilhos (Triggers)**:
  - *Novo Lead Cadastrado*
  - *Tag Adicionada*
  - *Status Alterado*
- **Ações**:
  - *Enviar Email*
  - *Enviar Mensagem WhatsApp*
  - *Aguardar (Delay)*
  - *Atribuir a Vendedor*
- **Templates de Automação**: Fluxos pré-configurados para *Boas-vindas*, *Recuperação de Carrinho* e *Nutrição*.

---

## 🎨 AI Creative Studio

Um estúdio de design completo impulsionado por Inteligência Artificial Generativa.

### 1. Geração de Imagens (Text-to-Image)
Transforme texto em imagens de alta qualidade.
- **Modelos Suportados**:
  - **Flux Schnell**: Geração ultra-rápida (padrão).
  - **Flux Dev**: Alta fidelidade e detalhes.
  - **DALL-E 3**: Melhor compreensão de prompts complexos.
  - **Gemini Flash**: Opção versátil do Google.
- **Configurações Avançadas**: Controle total sobre *Steps*, *Guidance Scale*, *Seed* e *Batch Size*.

### 2. Biblioteca de Templates
Não comece do zero. Use nossos templates otimizados.
- **Categorias**: Saúde, Tech, Varejo, Moda, Arquitetura, etc.
- **Templates Personalizados**: Crie e salve seus próprios estilos de prompt para manter a consistência da marca.
- **Seletor Visual**: Navegue por exemplos visuais antes de aplicar.

### 3. Ferramentas de Edição & Pós-Processamento
- **Editor Integrado**: Corte, ajuste cores, aplique filtros e desenhe sobre a imagem.
- **Upscale (4x)**: Aumente a resolução das imagens sem perder qualidade.
- **Remoção de Fundo**: Isole objetos e pessoas com um clique.
- **Variações**: Crie versões alternativas de uma imagem existente mantendo a composição.

### 4. Facilitadores
- **Tradução Automática**: Escreva em português e traduza para inglês (melhor compreendido pelas IAs) com um clique.
- **Histórico**: Acesso rápido às últimas 50 gerações.
- **Analytics de IA**: Dashboard de consumo de créditos e modelos mais usados.

---

## 📱 Social Media Management

Planeje e distribua conteúdo em escala.

### Funcionalidades:
- **Calendário Editorial**: Visão mensal e semanal das publicações.
- **Agendamento Multi-plataforma**: (Em desenvolvimento) Instagram, Facebook, LinkedIn.
- **Biblioteca de Mídia**: Armazenamento centralizado de imagens e vídeos.
- **Status de Aprovação**: Fluxo de revisão entre agência e cliente.

---

## 🏢 Gestão de Equipe & Configurações

Controle quem acessa o quê.

- **Gestão de Usuários**: Convide membros da equipe.
- **Papéis e Permissões**:
  - *Admin*: Acesso total.
  - *Editor*: Pode criar conteúdo, mas não altera configurações.
  - *Visualizador*: Apenas leitura (ideal para clientes).
- **White Label**: Personalize a plataforma com sua logo e cores (Configurações > Aparência).

---

## 🛠️ Instalação Técnica

### Requisitos
- Node.js v18+
- PostgreSQL 14+
- Chaves de API: OpenAI, Google (Gemini), Replicate.

### Comandos Rápidos

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Para documentação técnica detalhada de API e Banco de Dados, consulte a pasta `/docs`.
