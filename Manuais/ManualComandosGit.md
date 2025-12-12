# Manual de Comandos Git 🛠️

Este guia contém os comandos essenciais para gerenciar o versionamento do projeto e realizar deployments no Vercel/Railway.

## 🚀 Fluxo de Trabalho Diário (Básico)

Sempre que você terminar uma tarefa ou quiser salvar seu progresso, siga estes 4 passos:

### 1. Verificar Status
Mostra quais arquivos foram modificados, deletados ou criados.
```bash
git status
```
*   **Vermelho:** Arquivos modificados mas não preparados.
*   **Verde:** Arquivos prontos para serem salvos (staged).

### 2. Adicionar Arquivos
Prepara todos os arquivos modificados para o próximo "save".
```bash
git add .
```
> O ponto `.` significa "todos os arquivos na pasta atual".

### 3. Salvar (Commit)
Salva as alterações no seu histórico local com uma mensagem explicando o que foi feito.
```bash
git commit -m "Escreva aqui uma mensagem curta e descritiva"
```
*   Exemplo: `git commit -m "Adiciona botão de salvar histórico"`
*   Exemplo: `git commit -m "Corrige bug no login"`

### 4. Enviar (Push / Deploy)
Envia suas alterações locais para o servidor (GitHub). **Isso dispara automaticamente o build no Vercel e Railway.**
```bash
git push origin main
```

---

## 🔄 Revertendo e Corrigindo Problemas

### Baixar atualizações (Pull)
Se houver mudanças no servidor que você não tem localmente (ex: trabalho em equipe), você precisa baixar antes de enviar.
```bash
git pull origin main
```
> Dica Pro: Use `git pull --rebase origin main` para manter um histórico mais limpo.

### Ver Histórico
Mostra a lista dos últimos saves (commits).
```bash
git log
```
> Aperte `q` para sair da lista.

### Desfazer alterações não salvas
Se você editou um arquivo e quer voltar como ele estava antes (cuidado: apaga o trabalho não salvo).
```bash
git checkout -- nome-do-arquivo
```
Ou para desfazer tudo na pasta atual:
```bash
git checkout .
```

### Cancelar um Commit (mas manter arquivos)
Se você deu `commit` mas percebeu que esqueceu algo e quer voltar atrás no "save" (mantendo as edições nos arquivos).
```bash
git reset --soft HEAD~1
```

---

## 🔥 Comandos Avançados (Use com Cuidado)

### Forçar Envio (Force Push)
Use APENAS se o `git push` normal falhar devido a conflitos de histórico e você tiver CERTEZA que sua versão local é a correta e definitiva. Isso apaga o histórico do servidor que for diferente do seu.
```bash
git push -f origin main
```

### Resetar TUDO para o estado do Servidor
Se você fez muitas mudanças erradas e quer simplesmente apagar tudo localmente e baixar a versão exata que está no GitHub. **Isso apaga todo seu trabalho não salvo.**
```bash
git fetch origin
git reset --hard origin/main
```

---

## 📂 Diretórios e Ignorados

O arquivo `.gitignore` define o que NÃO deve subir para o GitHub (como `node_modules`, `.env`, arquivos de sistema do Windows/Mac). Nunca force o envio desses arquivos manualmente.
