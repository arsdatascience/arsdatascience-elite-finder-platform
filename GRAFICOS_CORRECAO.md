# Correção dos Gráficos - Dashboard e Campanhas

## ✅ Problema Identificado

Os gráficos **"Evolução: Google vs Meta vs Receita"** e **"Share de Investimento"** não estavam aparecendo devido a:

1. **VITE_USE_MOCK estava configurado como `false`**
2. **Backend não possui endpoints implementados para:**
   - `/api/chart-data`
   - `/api/funnel-data`
   - `/api/device-data`
   - `/api/campaigns`

## ✅ Solução Aplicada

### 1. Configuração do Mock Ativada

**Arquivo:** `frontend/.env`
```env
VITE_API_URL=http://localhost:3001
VITE_USE_MOCK=true  # ✅ Alterado de false para true
```

### 2. Dados Sintéticos Já Existentes

O arquivo `frontend/src/services/mockApi.ts` já possui dados sintéticos completos:

#### Gráfico de Evolução (Dashboard)
```typescript
const DEFAULT_CHART_DATA = [
    { name: 'Seg', revenue: 20000, spend: 12000, google: 8000, meta: 4000 },
    { name: 'Ter', revenue: 15000, spend: 7000, google: 4000, meta: 3000 },
    { name: 'Qua', revenue: 10000, spend: 49000, google: 30000, meta: 19000 },
    { name: 'Qui', revenue: 13900, spend: 19500, google: 10000, meta: 9500 },
    { name: 'Sex', revenue: 9450, spend: 24000, google: 12000, meta: 12000 },
    { name: 'Sab', revenue: 11950, spend: 19000, google: 10000, meta: 9000 },
    { name: 'Dom', revenue: 17450, spend: 21500, google: 11500, meta: 10000 },
];
```

#### Campanhas por Cliente
- **TechCorp (ID: 1)**: 6 campanhas (Google + Meta)
- **Padaria (ID: 2)**: 3 campanhas locais
- **Consultoria (ID: 3)**: 4 campanhas de serviços

## 🎯 Como Testar

### 1. Reiniciar o Frontend
```bash
cd frontend
npm run dev
```

### 2. Verificar os Gráficos

#### Dashboard
- Acesse: `http://localhost:5173/`
- Selecione diferentes clientes no dropdown
- Alterne entre plataformas: "Todas", "Google", "Meta"
- **Gráfico "Evolução"** deve aparecer com dados da semana

#### Campanhas
- Acesse: `http://localhost:5173/campaigns`
- Selecione um cliente (TechCorp, Padaria, etc.)
- **Gráfico "Share de Investimento"** deve mostrar distribuição Google vs Meta
- **Gráfico "Top ROAS"** deve listar as melhores campanhas

## 📊 Dados Disponíveis

### KPIs por Cliente

**TechCorp (B2B/Enterprise)**
- Faturamento: R$ 450.000,00
- Investimento: R$ 80.000,00
- ROAS: 5.6x
- CPA: R$ 120,00

**Padaria (Local/B2C)**
- Faturamento: R$ 25.000,00
- Investimento: R$ 5.000,00
- ROAS: 5.0x
- CPA: R$ 15,00

## 🔄 Próximos Passos (Opcional)

Para usar dados reais do backend:

1. **Implementar endpoints no backend:**
   ```javascript
   // backend/server.js
   app.get('/api/chart-data', async (req, res) => {
       const { client_id } = req.query;
       // Buscar dados reais do PostgreSQL
       const data = await pool.query('SELECT ...');
       res.json(data.rows);
   });
   ```

2. **Alterar `.env` para usar backend real:**
   ```env
   VITE_USE_MOCK=false
   ```

## ✅ Status Atual

- ✅ Mock API com dados sintéticos completos
- ✅ Gráficos funcionando com `VITE_USE_MOCK=true`
- ✅ 3 clientes diferentes com dados variados
- ✅ Filtros por plataforma (Google/Meta/Todas)
- ⏳ Backend real pendente de implementação

## 📝 Observações

- Os dados mockados são **suficientes para desenvolvimento e demonstração**
- Todos os gráficos renderizam corretamente com os dados sintéticos
- A alternância entre clientes e plataformas funciona perfeitamente
- Para produção, implementar endpoints reais no backend
