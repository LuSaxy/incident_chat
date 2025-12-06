// Debug: Test if JavaScript is loading
console.log('===== CHAT.JS LOADING =====');
console.log('Current time:', new Date().toISOString());

class ChatBot {
    constructor() {
        console.log('===== CHATBOT CONSTRUCTOR STARTING =====');
        // Configuration - Update this with your N8N webhook URL
        this.config = {
            n8nWebhookUrl: 'https://n8n.services.ssssss.sssss.net/webhook/hybrid-chat',
            maxRetries: 3,
            retryDelay: 1000,
            requestTimeout: 300000
        };

        // DOM elements
        this.messagesContainer = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.newSessionButton = document.getElementById('new-session-button');
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusText = document.getElementById('status-text');
        this.charCount = document.getElementById('char-count');

        // State
        this.isWaiting = false;
        this.messageHistory = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCharCount();
        this.loadConfig();

        // Debug: Check if button exists
        console.log('Button element:', this.newSessionButton);
        console.log('Button found:', !!this.newSessionButton);
    }

    loadConfig() {
        // Try to load config from localStorage or use defaults
        const savedConfig = localStorage.getItem('n8n-chat-config');
        if (savedConfig) {
            try {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            } catch (e) {
                console.warn('Failed to load saved config:', e);
            }
        }

        // URL should work by default for local N8N, but allow override
        console.log('Using webhook URL:', this.config.n8nWebhookUrl);
    }

    promptForWebhookUrl() {
        const defaultUrl = 'https://n8n.services.zzzzz.net/webhook/hybrid-chat';
        const url = prompt('Please enter your N8N webhook URL for the chat bot:', defaultUrl);
        if (url && url.trim()) {
            this.config.n8nWebhookUrl = url.trim();
            localStorage.setItem('n8n-chat-config', JSON.stringify(this.config));
            this.updateStatus('connected', 'Connected');
        } else {
            this.updateStatus('disconnected', 'No webhook URL configured');
        }
    }

    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.handleSend());

        // New session button click - try to find it again if not found
        let newSessionButton = this.newSessionButton || document.getElementById('new-session-button');
        if (newSessionButton) {
            newSessionButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('New Session button clicked!');
                this.startNewSession();
            });
            console.log('New Session button event listener attached');
            this.newSessionButton = newSessionButton; // Store reference
        } else {
            console.error('New Session button not found!');
            // Try again after a short delay
            setTimeout(() => {
                newSessionButton = document.getElementById('new-session-button');
                if (newSessionButton) {
                    newSessionButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log('New Session button clicked (delayed)!');
                        this.startNewSession();
                    });
                    console.log('New Session button event listener attached (delayed)');
                    this.newSessionButton = newSessionButton;
                } else {
                    console.error('New Session button still not found after delay!');
                }
            }, 100);
        }

        // Enter key press
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        // Character count update
        this.messageInput.addEventListener('input', () => this.updateCharCount());

        // Auto-resize input (optional enhancement)
        this.messageInput.addEventListener('input', () => this.autoResizeInput());
    }

    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = count;

        if (count > 900) {
            this.charCount.className = 'text-red-500 font-medium';
        } else if (count > 800) {
            this.charCount.className = 'text-yellow-500';
        } else {
            this.charCount.className = '';
        }
    }

    autoResizeInput() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async handleSend() {
        const message = this.messageInput.value.trim();
        if (!message || this.isWaiting) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.updateCharCount();
        this.autoResizeInput();

        // Show typing indicator
        this.setWaiting(true);
        const typingId = this.showTypingIndicator();

        try {
            const response = await this.sendToN8N(message);
            this.removeTypingIndicator(typingId);
            this.addMessage(response, 'bot');
            this.updateStatus('connected', 'Connected');
        } catch (error) {
            this.removeTypingIndicator(typingId);
            this.handleError(error);
        } finally {
            this.setWaiting(false);
        }
    }

    async sendToN8N(message) {
        const payload = {
            message: message,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            history: this.messageHistory.slice(-10) // Send last 10 messages for context
        };

        let lastError;

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);

                const response = await fetch(this.config.n8nWebhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                // Handle both text and JSON responses
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    // Handle different JSON response formats
                    if (typeof data === 'string') {
                        return data;
                    } else if (data.response) {
                        return data.response;
                    } else if (data.message) {
                        return data.message;
                    } else {
                        return JSON.stringify(data);
                    }
                } else {
                    // Handle plain text response
                    return await response.text();
                }

            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed:`, error.message);

                if (attempt < this.config.maxRetries) {
                    await this.delay(this.config.retryDelay * attempt);
                }
            }
        }

        throw lastError;
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

        const isUser = sender === 'user';
        const bubbleClass = isUser
            ? 'bg-blue-500 text-white'
            : 'bg-white border border-gray-200';

        messageDiv.innerHTML = `
            <div class="message-bubble ${bubbleClass} p-3 rounded-lg shadow-sm">
                ${isUser ? '' : `
                    <div class="flex items-start space-x-2">
                        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            🤖
                        </div>
                        <div class="flex-1">
                `}
                    <p class="${isUser ? 'text-white' : 'text-gray-800'}">${this.formatMessage(content)}</p>
                    <div class="text-xs ${isUser ? 'text-blue-100' : 'text-gray-500'} mt-1">
                        ${new Date().toLocaleTimeString()}
                    </div>
                ${isUser ? '' : `
                        </div>
                    </div>
                `}
            </div>
        `;

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Store in history
        this.messageHistory.push({
            content: content,
            sender: sender,
            timestamp: new Date().toISOString()
        });
    }

    formatMessage(content) {
        // Basic formatting for markdown-like syntax
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = 'chat-message flex justify-start';
        typingDiv.innerHTML = `
            <div class="message-bubble bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div class="flex items-start space-x-2">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        🤖
                    </div>
                    <div class="flex items-center space-x-1 typing-indicator">
                        <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        return typingId;
    }

    removeTypingIndicator(typingId) {
        const typingDiv = document.getElementById(typingId);
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    setWaiting(waiting) {
        this.isWaiting = waiting;
        this.sendButton.disabled = waiting;
        this.messageInput.disabled = waiting;

        if (waiting) {
            this.sendButton.textContent = 'Sending...';
        } else {
            this.sendButton.textContent = 'Send';
        }
    }

    handleError(error) {
        console.error('Chat error:', error);

        let errorMessage = 'Sorry, something went wrong. ';

        if (error.name === 'AbortError') {
            errorMessage += 'The request timed out. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Unable to connect to the chat service. Please check your connection.';
        } else {
            errorMessage += error.message || 'Please try again.';
        }

        this.addMessage(errorMessage, 'bot');
        this.updateStatus('error', 'Connection Error');
    }

    updateStatus(status, text) {
        this.statusText.textContent = text;

        const colors = {
            connected: 'bg-green-400',
            disconnected: 'bg-yellow-400',
            error: 'bg-red-400'
        };

        this.statusIndicator.className = `w-3 h-3 rounded-full ${colors[status] || 'bg-gray-400'}`;
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    startNewSession() {
        console.log('startNewSession method called');
        // Confirm with user before clearing the session
        if (confirm('Start a new chat session? This will clear the current conversation.')) {
            console.log('User confirmed new session');
            // Remove the old session ID to force creation of a new one
            localStorage.removeItem('n8n-chat-session');

            // Clear the message history
            this.messageHistory = [];

            // Clear the chat messages from the UI
            console.log('Clearing chat messages...');
            this.clearChatMessages();

            // Add the welcome message back
            console.log('Adding welcome message...');
            this.addWelcomeMessage();

            // Clear the input field
            this.messageInput.value = '';
            this.updateCharCount();
            this.autoResizeInput();

            console.log('New session started with ID:', this.getSessionId());
        } else {
            console.log('User cancelled new session');
        }
    }

    clearChatMessages() {
        console.log('clearChatMessages called');
        console.log('Messages container:', this.messagesContainer);
        console.log('Messages container children before clear:', this.messagesContainer.children.length);
        // Remove all chat messages except keep the container
        this.messagesContainer.innerHTML = '';
        console.log('Messages container children after clear:', this.messagesContainer.children.length);
    }

    addWelcomeMessage() {
        console.log('addWelcomeMessage called');
        // Add the welcome message back
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'chat-message flex justify-start';
        welcomeDiv.innerHTML = `
            <div class="message-bubble bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div class="flex items-start space-x-2">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        🤖
                    </div>
                    <div>
                        <p class="text-gray-800">Hey there! I'm your AI assistant powered by ssss. What can I help you with today?</p>
                    </div>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(welcomeDiv);
        console.log('Welcome message added. Total children now:', this.messagesContainer.children.length);
    }

    getSessionId() {
        let sessionId = localStorage.getItem('n8n-chat-session');
        if (!sessionId) {
            sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('n8n-chat-session', sessionId);
        }
        return sessionId;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('===== DOM CONTENT LOADED =====');
    console.log('Creating ChatBot instance...');
    window.chatBot = new ChatBot();
    console.log('ChatBot instance created:', window.chatBot);
});

// Add some global utilities for debugging
window.chatUtils = {
    clearHistory: () => {
        localStorage.removeItem('n8n-chat-session');
        localStorage.removeItem('n8n-chat-config');
        location.reload();
    },

    setWebhookUrl: (url) => {
        const config = JSON.parse(localStorage.getItem('n8n-chat-config') || '{}');
        config.n8nWebhookUrl = url;
        localStorage.setItem('n8n-chat-config', JSON.stringify(config));
        location.reload();
    },

    // Test function to manually trigger new session
    testNewSession: () => {
        console.log('Testing new session manually...');
        if (window.chatBot) {
            window.chatBot.startNewSession();
        } else {
            console.error('ChatBot instance not found');
        }
    },

    // Test function to check button
    checkButton: () => {
        const button = document.getElementById('new-session-button');
        console.log('Button element:', button);
        console.log('Button click handler:', button.onclick);
        if (button) {
            console.log('Button found, attempting click...');
            button.click();
        } else {
            console.error('Button not found');
        }
    }
};
