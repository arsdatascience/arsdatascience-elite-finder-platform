# Guia de Importação de Workflows no n8n

Este guia explica como importar os arquivos `.json` gerados para dentro do seu painel do n8n e ativar as automações.

## 📂 Localização dos Arquivos
Os arquivos de workflow estão salvos na pasta `docs/` do seu projeto:
1.  `docs/n8n_workflow_consultor_roi.json` (Consultor Financeiro Autônomo)
2.  `docs/n8n_workflow_copywriter_sniper.json` (Gerador de Copywriting)

---

## 🛠️ Passo a Passo para Importação

### 1. Copiar o Conteúdo do JSON
1.  Abra o arquivo `.json` desejado no seu editor de código (VS Code).
2.  Selecione todo o conteúdo (`Ctrl + A`).
3.  Copie (`Ctrl + C`).

### 2. Importar no n8n
1.  Acesse seu painel n8n: [https://arsdatascience-n8n.aiiam.com.br](https://arsdatascience-n8n.aiiam.com.br)
2.  Faça login com suas credenciais.
3.  No menu lateral esquerdo, clique em **Workflows**.
4.  Clique no botão **Add Workflow** (canto superior direito).
5.  Na tela do novo workflow (em branco), clique no ícone de **três pontinhos (...)** no canto superior direito.
6.  Selecione a opção **Import from File** (ou "Import from Clipboard" se preferir colar direto).
7.  Cole o conteúdo JSON ou selecione o arquivo.
8.  O desenho do fluxo aparecerá na tela automaticamente.

### 3. Configurar Credenciais (Apenas na primeira vez)
Alguns nós podem aparecer com um alerta vermelho 🔴 indicando falta de credenciais.

*   **Para o nó "Análise IA (GPT-4)":**
    1.  Dê dois cliques no nó.
    2.  Em "Credential for OpenAI API", selecione **Create New**.
    3.  Cole sua `OPENAI_API_KEY` (que começa com `sk-proj-...`).
    4.  Salve.

*   **Para o nó "Enviar Alerta (Email)":**
    1.  Dê dois cliques no nó.
    2.  Em "Credential for SMTP", selecione **Create New**.
    3.  Preencha com os dados do Gmail que você forneceu:
        *   **User:** `arsdatascience@gmail.com`
        *   **Password:** `ukvhjvjuhbjedzf` (App Password)
        *   **Host:** `smtp.gmail.com`
        *   **Port:** `465`
        *   **SSL/TLS:** True
    4.  Salve.

### 4. Ativar o Workflow
1.  Clique no botão **Save** (ícone de disquete) no topo.
2.  Mude a chave **Active** (no topo direito) de `Inactive` para `Active` (ficará verde).

---

## ✅ Testando se Funcionou

### Teste do Consultor de ROI:
1.  Com o workflow aberto, clique no botão **Execute Workflow** (parte inferior).
2.  Aguarde alguns segundos.
3.  Verifique seu email (`arsdatascience@gmail.com`). Você deve receber um relatório financeiro gerado pela IA.

### Teste do Copywriter Sniper:
1.  Após ativar, clique no nó **Webhook** para ver a URL de teste.
2.  Você pode enviar uma requisição POST para essa URL com o corpo JSON:
    ```json
    {
      "topic": "Lançamento de Curso de Marketing",
      "platform": "instagram"
    }
    ```
3.  O n8n vai processar e devolver o texto do anúncio.
