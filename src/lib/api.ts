import type { Message } from '../types';

// const WEBHOOK_URL = 'https://n8n.services.ssssss.sssss.net/webhook/hybrid-chat';
const WEBHOOK_URL = 'http://localhost:5678/webhook/23b8/chat';

export async function sendMessageToN8N(
    message: string,
    sessionId: string,
    history: Message[]
): Promise<string> {
    const payload = {
        chatInput: message, // n8n default field name
        timestamp: new Date().toISOString(),
        sessionId,
        history: history.slice(-10).map(m => ({
            content: m.content,
            sender: m.sender,
            timestamp: m.timestamp
        }))
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Smart parsing for n8n AI Agent responses
        if (typeof data === 'string') return data;
        if (data.output) return data.output; // Standard AI Agent output
        if (data.text) return data.text;
        if (data.response) return data.response;
        if (data.message) return data.message;

        return JSON.stringify(data);

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
