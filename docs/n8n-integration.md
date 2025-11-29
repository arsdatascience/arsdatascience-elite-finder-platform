# Integração AIIAM Backend <-> N8N

Este documento descreve a arquitetura de integração robusta entre o backend do Elite Finder (AIIAM) e o N8N.

## 🏗️ Arquitetura

A integração é baseada em eventos assíncronos com garantia de entrega.

1. **Trigger**: O backend gera um evento (ex: `USER_CREATED`).
2. **Queue**: O evento é colocado na fila Redis `n8n-workflows` (via Bull).
3. **Worker**: Um worker processa a fila e chama o `WebhookService`.
4. **Webhook**: O serviço faz uma requisição HTTP POST para o N8N.
5. **Resiliência**:
   - **Retry**: Se falhar, tenta novamente com backoff exponencial (até 3x).
   - **Circuit Breaker**: Se houver muitas falhas, abre o circuito para proteger o sistema.
   - **DLQ**: Falhas permanentes são logadas (futuro: Dead Letter Queue).

## 🔒 Segurança

- **API Key**: Todos os webhooks devem enviar o header `X-N8N-API-KEY`.
- **Rate Limit**: Proteção contra abuso (100 req/min por IP).
- **Validação**: Payloads são validados com Joi antes de processar.

## 🛠️ Configuração

Variáveis de ambiente necessárias no `.env`:

```env
# N8N
N8N_WEBHOOK_URL=https://webhookn8n.aiiam.com.br
N8N_WEBHOOK_API_KEY=sua_chave_secreta_aqui
N8N_MAX_RETRIES=3
N8N_RETRY_DELAY=1000

# Redis (Queue)
REDIS_URL=redis://localhost:6379
N8N_QUEUE_CONCURRENCY=10

# Monitoring
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

## 📊 Observabilidade

- **Logs**: `backend/logs/n8n-combined.log` (formato JSON).
- **Métricas**: Disponíveis em `/metrics` (formato Prometheus).
- **Dashboard API**: Status da fila em `/api/admin/n8n/stats`.

## 🚨 Troubleshooting

### Erro: "Circuit Breaker is OPEN"
Significa que o N8N falhou consecutivamente 5 vezes.
**Ação**: Verifique se o N8N está online. O circuito tentará fechar automaticamente após 1 minuto.

### Erro: "Job falhou definitivamente"
Verifique os logs em `backend/logs/n8n-error.log`. Pode ser erro de validação ou timeout.

### Fila acumulando
Aumente `N8N_QUEUE_CONCURRENCY` se o worker não estiver dando conta, ou verifique a latência do N8N.
