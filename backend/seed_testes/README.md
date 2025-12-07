# 🌱 Seeds de Dados Sintéticos - Elite Finder

Este diretório contém seeds com dados sintéticos para demonstração e testes do potencial analítico da plataforma Elite Finder.

## 📊 Verticais de Negócio

| Arquivo | Vertical | Descrição |
|---------|----------|-----------|
| `seed_ecommerce.js` | 🛒 E-Commerce | Loja virtual de moda/eletrônicos B2C |
| `seed_estetica.js` | 💆 Clínica de Estética | Clínica de estética/spa/beleza |
| `seed_varejo.js` | 🏪 Varejo | Rede de lojas varejo B2B/B2C |
| `seed_bens_consumo.js` | 📦 Bens de Consumo | Indústria CPG/FMCG |
| `seed_tecnologia.js` | 💻 Tecnologia/Serviços | Empresa SaaS/Tech B2B |

## 🚀 Como Usar

### Executar Todos os Seeds
```bash
cd backend
node seed_testes/run_all_seeds.js
```

### Executar Seed Individual
```bash
cd backend
node seed_testes/seed_ecommerce.js
node seed_testes/seed_estetica.js
node seed_testes/seed_varejo.js
node seed_testes/seed_bens_consumo.js
node seed_testes/seed_tecnologia.js
```

## 📋 Dados Gerados por Seed

Cada seed popula as seguintes tabelas:

| Tabela | Qtd por Seed | Total (5 seeds) |
|--------|--------------|-----------------|
| `tenants` | 1 | 5 |
| `clients` | 12 | 60 |
| `leads` | 12-15 | ~65 |
| `financial_transactions` | 22-25 | ~115 |
| `device_stats` | 3 | 15 |
| `social_posts` | 7 | 35 |

## 🎨 Exemplos de Dados

### E-Commerce
- Clientes B2C com diferentes origens (Google Ads, Instagram, Facebook, TikTok)
- Leads com interesse em produtos específicos (roupas, eletrônicos, acessórios)
- Transações de vendas online e custos de marketing digital
- Posts para Instagram, Facebook, TikTok

### Clínica de Estética
- Pacientes com histórico de tratamentos
- Leads interessados em procedimentos (Botox, Harmonização, Laser)
- Receitas de procedimentos estéticos individuais
- Custos com insumos, equipamentos, aluguel

### Varejo
- Mix de clientes B2B (distribuidores) e B2C (consumidores)
- Leads de redes de supermercados e atacadistas
- Vendas em loja física, e-commerce e Black Friday
- Custos de estoque, logística, folha

### Bens de Consumo (CPG)
- Clientes grandes varejistas (Carrefour, Atacadão, Assaí)
- Leads Key Account com valores altos
- Faturamento B2B por nota fiscal
- Custos industriais, trade marketing, logística

### Tecnologia/Serviços
- Clientes Enterprise (bancos, seguradoras, hospitais)
- Leads para projetos de transformação digital
- Receita recorrente (MRR) + projetos one-time
- Custos de cloud, time de desenvolvimento, marketing

## 📈 Análises Possíveis

Com estes dados, é possível demonstrar:

1. **Dashboard de Vendas**
   - Faturamento por período
   - Ticket médio por vertical
   - Conversão de leads por canal

2. **Análise de Leads**
   - Pipeline por status (new, contacted, qualified, negotiating, won, lost)
   - Taxa de conversão por fonte
   - Valor potencial do funil

3. **Análise Financeira**
   - Receitas vs Despesas
   - Margem por cliente
   - Projeção de fluxo de caixa

4. **Performance de Marketing**
   - ROI por canal
   - Device stats (mobile vs desktop)
   - Engajamento social

5. **Métricas SaaS (para vertical Tech)**
   - MRR / ARR
   - Churn potencial
   - Customer Lifetime Value

## ⚙️ Requisitos

- Node.js 18+
- Conexão com banco PostgreSQL configurada (via `database.js`)
- Variáveis de ambiente configuradas

## ⚠️ Observações

- Os seeds usam `ON CONFLICT DO NOTHING` para evitar duplicatas
- Dados são completamente sintéticos (nomes, emails, CNPJs fictícios)
- IDs de clientes e transações são gerados automaticamente
- Datas concentradas em novembro/dezembro 2024
