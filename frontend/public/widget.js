(function (window) {
    const EliteAgent = function () {
        this.config = {};
        this.isOpen = false;
        this.messages = [];
        this.init = function (config) {
            this.config = config;
            this.createWidget();
        };

        this.createWidget = function () {
            // Create container
            const container = document.createElement('div');
            container.id = 'elite-agent-widget';
            container.style.position = 'fixed';
            container.style.bottom = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

            // Create toggle button
            const button = document.createElement('button');
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            `;
            button.style.backgroundColor = this.config.primaryColor || '#3B82F6';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '50%';
            button.style.width = '60px';
            button.style.height = '60px';
            button.style.cursor = 'pointer';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.onclick = () => this.toggleChat();

            // Create chat window (hidden by default)
            const chatWindow = document.createElement('div');
            chatWindow.id = 'elite-agent-window';
            chatWindow.style.display = 'none';
            chatWindow.style.position = 'absolute';
            chatWindow.style.bottom = '80px';
            chatWindow.style.right = '0';
            chatWindow.style.width = '350px';
            chatWindow.style.height = '500px';
            chatWindow.style.backgroundColor = 'white';
            chatWindow.style.borderRadius = '12px';
            chatWindow.style.boxShadow = '0 5px 20px rgba(0,0,0,0.2)';
            chatWindow.style.flexDirection = 'column';
            chatWindow.style.overflow = 'hidden';

            // Header
            const header = document.createElement('div');
            header.style.backgroundColor = this.config.primaryColor || '#3B82F6';
            header.style.color = 'white';
            header.style.padding = '16px';
            header.style.fontWeight = 'bold';
            header.innerText = 'Atendimento Virtual';
            chatWindow.appendChild(header);

            // Messages area
            const messagesArea = document.createElement('div');
            messagesArea.id = 'elite-agent-messages';
            messagesArea.style.flex = '1';
            messagesArea.style.padding = '16px';
            messagesArea.style.overflowY = 'auto';
            messagesArea.style.backgroundColor = '#f9fafb';
            chatWindow.appendChild(messagesArea);

            // Input area
            const inputArea = document.createElement('div');
            inputArea.style.padding = '16px';
            inputArea.style.borderTop = '1px solid #e5e7eb';
            inputArea.style.display = 'flex';
            inputArea.style.gap = '8px';

            const input = document.createElement('input');
            input.placeholder = 'Digite sua mensagem...';
            input.style.flex = '1';
            input.style.padding = '8px 12px';
            input.style.borderRadius = '20px';
            input.style.border = '1px solid #d1d5db';
            input.style.outline = 'none';
            input.onkeypress = (e) => {
                if (e.key === 'Enter') this.sendMessage(input.value);
            };

            const sendBtn = document.createElement('button');
            sendBtn.innerText = '➤';
            sendBtn.style.background = 'none';
            sendBtn.style.border = 'none';
            sendBtn.style.color = this.config.primaryColor || '#3B82F6';
            sendBtn.style.cursor = 'pointer';
            sendBtn.onclick = () => this.sendMessage(input.value);

            inputArea.appendChild(input);
            inputArea.appendChild(sendBtn);
            chatWindow.appendChild(inputArea);

            container.appendChild(chatWindow);
            container.appendChild(button);
            document.body.appendChild(container);

            // Add initial message
            this.addMessage('Olá! Como posso ajudar você hoje?', 'agent');
        };

        this.toggleChat = function () {
            this.isOpen = !this.isOpen;
            const chatWindow = document.getElementById('elite-agent-window');
            if (chatWindow) {
                chatWindow.style.display = this.isOpen ? 'flex' : 'none';
            }
        };

        this.addMessage = function (text, sender) {
            const messagesArea = document.getElementById('elite-agent-messages');
            const msgDiv = document.createElement('div');
            msgDiv.style.marginBottom = '12px';
            msgDiv.style.display = 'flex';
            msgDiv.style.justifyContent = sender === 'user' ? 'flex-end' : 'flex-start';

            const bubble = document.createElement('div');
            bubble.style.maxWidth = '80%';
            bubble.style.padding = '8px 12px';
            bubble.style.borderRadius = '12px';
            bubble.style.fontSize = '14px';
            bubble.style.lineHeight = '1.4';

            if (sender === 'user') {
                bubble.style.backgroundColor = this.config.primaryColor || '#3B82F6';
                bubble.style.color = 'white';
                bubble.style.borderBottomRightRadius = '2px';
            } else {
                bubble.style.backgroundColor = 'white';
                bubble.style.color = '#1f2937';
                bubble.style.border = '1px solid #e5e7eb';
                bubble.style.borderBottomLeftRadius = '2px';
            }

            bubble.innerText = text;
            msgDiv.appendChild(bubble);
            messagesArea.appendChild(msgDiv);
            messagesArea.scrollTop = messagesArea.scrollHeight;
        };

        this.sendMessage = function (text) {
            if (!text.trim()) return;

            const input = document.querySelector('#elite-agent-window input');
            if (input) input.value = '';

            this.addMessage(text, 'user');

            // Simulate API call
            // In production, this would call the backend API
            setTimeout(() => {
                this.addMessage('Obrigado pela mensagem! Esta é uma resposta automática de demonstração do widget.', 'agent');
            }, 1000);
        };
    };

    window.eliteAgent = new EliteAgent();
})(window);
