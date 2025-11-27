# Templates de Agentes - Elite Finder

## Visão Geral

Este sistema fornece templates pré-configurados para criação rápida de agentes especializados. Cada template inclui configurações de IA, parâmetros personalizáveis e estruturas de conhecimento otimizadas.

## Templates Disponíveis

### 1. 🎯 Agente de Vendas (`sales_agent`)
**Categoria**: Sales  
**Especialização**: Nível 3

**Características:**
- Estratégias de vendas personalizáveis (Consultiva, Solução, Transacional, Relacionamento)
- Tratamento de objeções pré-configurado (Preço, Concorrência, Timing)
- Sistema de qualificação de leads
- Abordagem inicial customizável

**Parâmetros Principais:**
- `target_market`: Definição do mercado alvo
- `sales_strategy`: Estratégia de vendas a utilizar
- `opening_approach`: Mensagem inicial
- `objection_handling_*`: Scripts para tratamento de objeções
- `qualification_questions`: Perguntas de qualificação

**Configuração de IA:**
- Temperatura: 0.7 (Criativo mas focado)
- Response Mode: Balanced
- RAG: Habilitado com chunking semântico

---

### 2. 📞 SAC - Atendimento ao Cliente (`customer_service`)
**Categoria**: Support  
**Especialização**: Nível 2

**Características:**
- Suporte 24/7 configurável
- Políticas de atendimento personalizáveis
- Sistema de escalação inteligente
- Políticas de reembolso configuráveis

**Parâmetros Principais:**
- `support_availability`: Disponibilidade do suporte (24/7, Comercial, Estendido)
- `greeting_message`: Mensagem de boas-vindas
- `service_policy`: Política de atendimento
- `escalation_threshold`: Critério para escalar atendimento
- `refund_policy`: Política de reembolso
- `max_response_time`: Tempo máximo de resposta

**Configuração de IA:**
- Temperatura: 0.5 (Mais conservador e preciso)
- Response Mode: Concise
- RAG: Habilitado com chunking adaptativo

---

### 3. 🔧 Suporte Técnico (`technical_support`)
**Categoria**: Technical  
**Especialização**: Nível 4

**Características:**
- Suporte multi-nível (Tier 1, 2, 3)
- Base de conhecimento técnico
- Ferramentas de diagnóstico
- Documentação de stack tecnológico

**Parâmetros Principais:**
- `support_tier`: Nível de suporte (Tier 1/2/3)
- `tech_stack`: Tecnologias suportadas
- `knowledge_base_url`: URL da documentação
- `diagnostic_tools`: Ferramentas disponíveis
- `common_issues`: Problemas frequentes
- `response_format`: Formato de resposta (Passo a passo, Quick fix, Diagnóstico)

**Configuração de IA:**
- Temperatura: 0.3 (Muito preciso e técnico)
- Response Mode: Detailed
- RAG: Habilitado com chunking recursivo e reranking

---

### 4. 📊 Agente CRM (`crm_agent`)
**Categoria**: Automation  
**Especialização**: Nível 3

**Características:**
- Gerenciamento de leads com pontuação BANT
- Pipeline de vendas configurável
- Automação de follow-up
- Integração com CRMs externos

**Parâmetros Principais:**
- `lead_scoring_criteria`: Critérios de pontuação (BANT)
- `lead_qualification`: Perguntas de qualificação
- `opportunity_stages`: Estágios do pipeline
- `auto_follow_up`: Follow-up automático
- `follow_up_interval`: Intervalo entre follow-ups
- `workflow_triggers`: Gatilhos de automação
- `data_analysis_metrics`: Métricas de análise

**Configuração de IA:**
- Temperatura: 0.6 (Balanceado)
- Response Mode: Balanced
- RAG: Habilitado com chunking semântico

---

## Como Usar

### 1. Listar Templates Disponíveis
```bash
GET /api/templates
```

**Resposta:**
```json
[
  {
    "id": 1,
    "template_id": "sales_agent",
    "template_name": "Agente de Vendas",
    "template_description": "Agente especializado em vendas...",
    "category": "sales",
    "is_active": true
  }
]
```

### 2. Visualizar Detalhes de um Template
```bash
GET /api/templates/sales_agent
```

### 3. Criar Agente a Partir de Template
```bash
POST /api/templates/sales_agent/instantiate

Body:
{
  "customizations": {
    "identity": {
      "name": "Vendedor Premium"
    },
    "parameters": {
      "target_market": "E-commerce B2C",
      "sales_strategy": "relationship",
      "opening_approach": "Olá! Sou seu consultor de vendas..."
    }
  }
}
```

### 4. Obter Parâmetros de um Agente
```bash
GET /api/templates/agents/123/parameters
```

### 5. Atualizar Parâmetro
```bash
PUT /api/templates/agents/123/parameters/target_market

Body:
{
  "value": "SaaS B2B Enterprise"
}
```

---

## Estrutura de Parâmetros

Cada parâmetro tem a seguinte estrutura:

```javascript
{
  key: 'parameter_name',          // Identificador único
  label: 'Nome Amigável',         // Label para UI
  type: 'text',                   // text, textarea, select, number, boolean
  category: 'group_name',         // Categoria/grupo
  defaultValue: 'valor',          // Valor padrão
  helperText: 'Ajuda...',        // Texto de ajuda
  required: true,                 // Se é obrigatório
  displayOrder: 1,                // Ordem de exibição
  validation: {                   // Regras de validação
    min: 0,
    max: 100
  },
  options: [                      // Para campos select
    { value: 'opt1', label: 'Opção 1' }
  ]
}
```

---

## Executar Migração e Seed

### 1. Executar migração (criar tabelas)
```bash
cd backend
node run_migration_006.js
```

### 2. Popular templates
```bash
node seed_templates.js
```

---

## Personalização de Templates

Para criar um novo template:

1. Edite `backend/config/agentTemplates.js`
2. Adicione novo template seguindo a estrutura existente
3. Execute `node seed_templates.js`

---

## Boas Práticas

- **Use nomes descritivos** para parâmetros
- **Agrupe parâmetros** relacionados na mesma categoria
- **Forneça valores padrão** sensatos
- **Adicione helper text** para parâmetros complexos
- **Defina validações** quando necessário
- **Mantenha a temperature adequada** ao caso de uso

---

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/templates` | Listar todos os templates |
| GET | `/api/templates/:id` | Detalhes de um template |
| POST | `/api/templates/:id/instantiate` | Criar agente do template |
| GET | `/api/templates/agents/:id/parameters` | Parâmetros do agente |
| PUT | `/api/templates/agents/:id/parameters/:key` | Atualizar parâmetro |

---

## Troubleshooting

**Erro: Template não encontrado**
- Verifique se executou o seed: `node seed_templates.js`

**Agente criado mas sem parâmetros**
- Verifique se a migração 006 foi executada

**Parâmetro não está aparecendo**
- Verifique se o `displayOrder` está configurado
- Confirme se `is_visible` não está como `false`
