import type { Message } from '../types';

import { chatConfig } from '../config/chatConfig';

const WEBHOOK_URL = chatConfig.webhookUrl;

// Helper to construct payload
const createPayload = (message: string, sessionId: string, history: Message[]) => ({
    chatInput: message,
    timestamp: new Date().toISOString(),
    sessionId,
    history: history.slice(-10).map(m => ({
        content: m.content,
        sender: m.sender,
        timestamp: m.timestamp
    }))
});

export async function sendMessageToN8NPromise(
    message: string,
    sessionId: string,
    history: Message[]
): Promise<string> {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createPayload(message, sessionId, history)),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (typeof data === 'string') return data;
        if (data.output) return data.output;
        if (data.text) return data.text;
        if (data.response) return data.response;
        if (data.message) return data.message;

        return JSON.stringify(data);
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function* streamMessageFromN8N(
    message: string,
    sessionId: string,
    history: Message[]
): AsyncGenerator<string> {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createPayload(message, sessionId, history)),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        if (!response.body) throw new Error('Response body is null');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // N8N Streaming Robust Parser
            // Handle concatenated JSON objects: {"type":"begin"}{"type":"token"}...

            let boundaryIndex = -1;

            while (true) {
                // Find start of object
                const start = buffer.indexOf('{');
                if (start === -1) {
                    // No JSON start found, if buffer is getting huge it might be raw text
                    if (buffer.length > 50 && !buffer.includes('{')) {
                        yield buffer;
                        buffer = '';
                    }
                    break;
                }

                // If we have text *before* the JSON, yield that first (mixed mode?)
                if (start > 0) {
                    const prefix = buffer.slice(0, start);
                    if (prefix.trim()) {
                        yield prefix;
                    }
                    buffer = buffer.slice(start);
                }

                // Now buffer starts with '{'. Find the balancing closing brace.
                let braceCount = 0;
                let end = -1;
                let inString = false;
                let escape = false;

                for (let i = 0; i < buffer.length; i++) {
                    const char = buffer[i];

                    if (escape) {
                        escape = false;
                        continue;
                    }

                    if (char === '\\') {
                        escape = true;
                        continue;
                    }

                    if (char === '"') {
                        inString = !inString;
                        continue;
                    }

                    if (!inString) {
                        if (char === '{') {
                            braceCount++;
                        } else if (char === '}') {
                            braceCount--;
                            if (braceCount === 0) {
                                end = i;
                                break;
                            }
                        }
                    }
                }

                if (end !== -1) {
                    // We found a complete JSON object
                    const jsonStr = buffer.slice(0, end + 1);
                    buffer = buffer.slice(end + 1); // Advance buffer

                    try {
                        const data = JSON.parse(jsonStr);

                        // Handle various n8n formats
                        if (data.type === 'token' && data.data) {
                            yield data.data;
                        } else if (data.type === 'item' && data.content) {
                            yield data.content;
                        } else if (data.output) {
                            yield data.output;
                        }

                        // Ignore 'begin', 'end', or unknowns without polluting console
                    } catch (e) {
                        // Failed to parse what looked like an object -> yield raw
                        yield jsonStr;
                    }
                } else {
                    // We have an opening brace but no matching closing brace YET.
                    // Wait for more chunks.
                    break;
                }
            }

        } // Close outer loop

    } catch (error) {
        console.error('Stream Error:', error);
        throw error;
    }
}
