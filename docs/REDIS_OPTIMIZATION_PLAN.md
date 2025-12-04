# Plano de Otimização com Redis

## Por que adicionar Redis?
Embora o PostgreSQL seja excelente para armazenar dados persistentes (Users, Leads, Vendas), ele não é o ideal para dados voláteis ou de acesso ultra-rápido. O Redis entra como uma camada de **Cache** e **Processamento de Fila** para turbinar a aplicação.

## Benefícios Imediatos

### 1. Cache de Dashboard (Aceleração de 10x)
*   **Problema:** Toda vez que um usuário abre o Dashboard, o sistema recalcula KPIs, ROI e Gráficos varrendo milhares de linhas no Postgres.
*   **Solução com Redis:** Calculamos uma vez, salvamos no Redis por 5 minutos.
*   **Resultado:** O Dashboard carrega em milissegundos, sem tocar no banco de dados.

### 2. Filas de Processamento (BullMQ)
*   **Problema:** Atualmente usamos a tabela `jobs` no Postgres. Isso gera "locks" e pode deixar o banco lento se tivermos muitos disparos de WhatsApp ou E-mail.
*   **Solução com Redis:** Usar a biblioteca `Bull` ou `BullMQ` conectada ao Redis.
*   **Resultado:** Processamento de milhares de jobs por segundo sem afetar a performance do site principal.

### 3. Rate Limiting Distribuído
*   **Problema:** Se escalarmos para 2 ou mais servidores, o rate limiter de memória atual não funciona bem.
*   **Solução:** O Redis centraliza a contagem de requisições.
*   **Resultado:** Proteção robusta contra ataques DDoS ou abuso de API, mesmo com múltiplos servidores.

## Plano de Implementação

1.  **Adicionar Redis no Railway:**
    *   Criar serviço Redis no projeto Railway.
    *   Obter `REDIS_URL`.

2.  **Instalar Dependências:**
    *   `npm install ioredis bullmq`

3.  **Atualizar Backend:**
    *   Criar `redisClient.js`.
    *   Atualizar `dashboardController.js` para ler/gravar cache.
    *   Migrar `jobProcessor.js` para usar filas do Redis.

## Veredito
**Sim, você deve adicionar o Redis.** É o passo natural para transformar um MVP em um produto SaaS escalável e profissional.
