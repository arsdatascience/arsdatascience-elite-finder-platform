# Módulo de Geração de Imagens com IA - Elite Finder

Este documento descreve as funcionalidades, arquitetura e uso do módulo de Geração de Imagens com IA implementado no Elite Finder.

## 1. Visão Geral

O módulo de Geração de Imagens permite que os usuários criem ativos visuais de alta qualidade diretamente na plataforma, utilizando modelos de IA de última geração (Flux Schnell e SDXL Lightning). O sistema inclui funcionalidades completas de gerenciamento, edição e análise de uso.

## 2. Funcionalidades Principais

### 2.1 Geração de Imagens (Text-to-Image)
- **Prompting**: Interface para descrição detalhada da imagem desejada.
- **Modelos**:
  - `flux-schnell`: Modelo ultra-rápido para gerações ágeis (padrão).
  - `sdxl-lightning`: Modelo equilibrado para alta qualidade.
- **Formatos**:
  - Quadrado (1:1) - 1024x1024
  - Paisagem (16:9) - 1344x768
  - Retrato (9:16) - 768x1344
  - Foto (3:2) - 1216x832

### 2.2 Configurações Avançadas
- **Prompt Negativo**: Exclusão de elementos indesejados.
- **Steps (Passos)**: Controle de qualidade vs. velocidade (1-50).
- **Guidance Scale**: Controle de fidelidade ao prompt (1-20).
- **Seed**: Controle de reprodutibilidade (Semente aleatória ou fixa).
- **Batch Size**: Geração de múltiplas imagens simultaneamente (1-4).

### 2.3 Ferramentas de Pós-Processamento
- **Upscale**: Aumento da resolução da imagem.
- **Variações**: Geração de novas versões baseadas em uma imagem existente.
- **Remover Fundo**: Remoção automática do fundo da imagem.
- **Editor**: Editor integrado para ajustes finos (crop, filtros, anotações).

### 2.4 Galeria e Histórico
- **Galeria Recente**: Visualização rápida das últimas gerações.
- **Histórico de Prompts**: Reutilização de prompts anteriores.
- **Lightbox**: Visualização em tela cheia com opções de download e exclusão.

### 2.5 Analytics (Novo!)
- **Dashboard**: Visão geral do consumo e atividade.
- **Métricas**:
  - Total de imagens geradas.
  - Custo estimado (créditos).
  - Distribuição de uso por modelo.
  - Gráfico de atividade diária (últimos 30 dias).

## 3. Arquitetura Técnica

### Frontend (`frontend/src/components/image-generation`)
- **`ImageGenerationPage.tsx`**: Componente principal e orquestrador.
- **`AnalyticsDashboard.tsx`**: Modal de visualização de dados de uso (Recharts).
- **`ImageEditor.tsx`**: Wrapper para edição de imagens.
- **`VariationsGenerator.tsx`**, **`ImageUpscaler.tsx`**, **`BackgroundRemover.tsx`**: Componentes de ferramentas específicas.
- **`apiClient.ts`**: Camada de serviço atualizada com métodos para `generate`, `analytics`, `tools`, etc.

### Backend (`backend/`)
- **`imageGenerationController.js`**:
  - `generateImage`: Orquestra chamadas para APIs de IA (Replicate/Stability).
  - `getAnalytics`: Agrega dados de uso do banco de dados PostgreSQL.
  - Integração com Cloudinary para armazenamento de ativos.
- **Rotas**:
  - `POST /api/images/generate`
  - `GET /api/images/analytics`
  - `POST /api/images/variations`
  - `POST /api/images/upscale`
  - `POST /api/images/remove-bg`

## 4. Como Testar

1. **Acesse a página de Geração**: Navegue até a rota `/image-generation` ou clique no menu correspondente.
2. **Gere uma Imagem**:
   - Digite um prompt (ex: "A futuristic city with flying cars, cyberpunk style").
   - Clique em "Gerar Imagem".
3. **Teste Ferramentas**:
   - Clique na imagem gerada.
   - Use os botões "Upscale", "Variações" ou "Remover Fundo".
4. **Verifique Analytics**:
   - Clique no botão "Analytics" no topo da página.
   - Confirme se os contadores refletem a geração que você acabou de fazer.

## 5. Próximos Passos (Sugestões)

- Implementação de sistema de cobrança real de créditos (Stripe integration).
- Adição de mais modelos (DALL-E 3, Midjourney API se disponível).
- Galeria pública/comunitária.
