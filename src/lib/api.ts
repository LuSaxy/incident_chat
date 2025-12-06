import type { Message } from '../types';

const WEBHOOK_URL = 'https://n8n.services.ssssss.sssss.net/webhook/hybrid-chat';

export async function sendMessageToN8N(
    message: string,
    sessionId: string,
    history: Message[]
): Promise<string> {
    const payload = {
        message,
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

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return typeof data === 'string' ? data : (data.response || data.message || JSON.stringify(data));
        } else {
            return await response.text();
        }
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
