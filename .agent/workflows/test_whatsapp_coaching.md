---
description: How to test the WhatsApp Sales Coaching Integration
---

# Testing WhatsApp Sales Coaching

This workflow describes how to test the real-time integration between WhatsApp (simulated via Postman/cURL), the backend AI analysis, and the frontend Teleprompter.

## Prerequisites
1.  Ensure the backend is running (`npm run dev` in `backend`).
2.  Ensure the frontend is running (`npm run dev` in `frontend`).
3.  Ensure you have a valid JWT token (login to the app and copy from LocalStorage or Network tab).

## Step 0: Configure Integration (Database)
Before sending messages, you need to configure the WhatsApp integration in the database.

**For EvolutionAPI:**
Run this SQL command in your database:
```sql
INSERT INTO integrations (user_id, platform, status, config, access_token)
VALUES (1, 'evolution_api', 'connected', '{"instanceUrl": "https://api.seu-evolution.com", "instanceName": "minha-instancia"}', 'SUA_API_KEY_AQUI');
```

**For Official WhatsApp Cloud API:**
Run this SQL command:
```sql
INSERT INTO integrations (user_id, platform, status, config, access_token)
VALUES (1, 'whatsapp', 'connected', '{"phone_number_id": "SEU_PHONE_ID_AQUI"}', 'SEU_ACCESS_TOKEN_AQUI');
```

## Step 1: Open the Sales Coaching Interface
1.  Navigate to `http://localhost:5173/sales-coaching`.
2.  You should see the "WhatsApp Live" header and the "Teleprompter" on the right.

## Step 2: Simulate an Incoming WhatsApp Message
Use Postman or cURL to send a POST request to the webhook endpoint.

**Endpoint:** `POST http://localhost:3001/webhooks/whatsapp`

**Headers:**
- `Content-Type: application/json`

**Body (JSON):**
```json
{
  "instance": "elite-finder-instance",
  "data": {
    "key": {
      "remoteJid": "5511999998888@s.whatsapp.net",
      "fromMe": false
    },
    "pushName": "João Silva",
    "message": {
      "conversation": "Olá, gostaria de saber mais sobre o plano Premium. Achei um pouco caro."
    }
  }
}
```

## Step 3: Verify Real-time Updates
1.  **Frontend Chat:** The message "Olá, gostaria de saber mais sobre o plano Premium. Achei um pouco caro." should appear instantly in the chat window with a "WA" tag.
2.  **Teleprompter:**
    *   The "Análise em Tempo Real" card should show a spinner ("Analisando intenção...").
    *   After a few seconds, it should update with:
        *   **Sentiment:** Skeptical (or similar)
        *   **Objections:** Price (Preço)
        *   **Coach Whisper:** Something like "Ele está preocupado com o valor. Foque no ROI."
        *   **Suggested Action:** A specific question or argument to handle the price objection.

## Step 4: Simulate Agent Response (Optional)
Currently, the frontend "Send" button sends a message to the backend analysis endpoint but doesn't actually send to WhatsApp API (mocked). You can type a response in the UI to see it appear in the chat history for context.

## Troubleshooting
-   **No message appears:** Check the browser console for Socket.io connection errors. Check the backend console for "WhatsApp Message from..." logs.
-   **No AI Analysis:** Check the backend console for OpenAI API errors. Ensure your API key is valid.
