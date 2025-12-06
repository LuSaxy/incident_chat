import { ref, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { Session, Message } from '../types';
import { storage } from '../lib/storage';
import { sendMessageToN8N } from '../lib/api';

export function useChat() {
    const sessions = ref<Session[]>([]);
    const currentSession = ref<Session | null>(null);
    const isLoading = ref(false);
    const isTyping = ref(false);

    // Load available sessions on mount
    onMounted(() => {
        sessions.value = storage.getSessions();
    });

    const createSession = (incidentId?: string) => {
        const isEphemeral = !incidentId;
        const sessionId = incidentId || uuidv4();

        // Check if session already exists (only for persistent)
        if (!isEphemeral) {
            const existing = storage.getSessions().find(s => s.id === sessionId);
            if (existing) {
                currentSession.value = existing;
                return;
            }
        }

        const newSession: Session = {
            id: sessionId,
            isEphemeral,
            title: isEphemeral ? 'Guest Chat' : `Incident ${incidentId}`,
            updatedAt: Date.now(),
            messages: [{
                id: uuidv4(),
                content: "Hey Best Bro! I'm FinOps Bro, your incident resolution agent. What needs fixing?",
                sender: 'bot',
                timestamp: new Date().toISOString()
            }]
        };

        currentSession.value = newSession;
        if (!isEphemeral) {
            storage.saveSession(newSession);
            sessions.value = storage.getSessions();
        }
    };

    const switchSession = (sessionId: string) => {
        const session = sessions.value.find(s => s.id === sessionId);
        if (session) {
            currentSession.value = session;
        }
    };

    const sendMessage = async (content: string) => {
        if (!currentSession.value || !content.trim()) return;

        const userMsg: Message = {
            id: uuidv4(),
            content,
            sender: 'user',
            timestamp: new Date().toISOString()
        };

        // Optimistic update
        const updatedSession = {
            ...currentSession.value,
            updatedAt: Date.now(),
            messages: [...currentSession.value.messages, userMsg]
        };

        currentSession.value = updatedSession;
        if (!updatedSession.isEphemeral) {
            storage.saveSession(updatedSession);
            sessions.value = storage.getSessions();
        }

        isTyping.value = true;
        isLoading.value = true;

        try {
            // Optimistic bot message (Loading state)
            const botMsg: Message = {
                id: uuidv4(),
                content: '...', // Placeholder
                sender: 'bot',
                timestamp: new Date().toISOString()
            };

            const initialSession = {
                ...updatedSession,
                updatedAt: Date.now(),
                messages: [...updatedSession.messages, botMsg]
            };
            currentSession.value = initialSession;

            // Fetch response (Non-streaming)
            const responseText = await sendMessageToN8N(content, updatedSession.id, updatedSession.messages);

            // Update bot message with real content
            if (currentSession.value) {
                const msgs: Message[] = [...currentSession.value.messages];
                // Replace the last message (placeholder) with real content
                const lastMsg = { ...msgs[msgs.length - 1], content: responseText };
                msgs[msgs.length - 1] = lastMsg;

                currentSession.value = {
                    ...currentSession.value,
                    messages: msgs
                };
            }

            // Save final session state
            if (!updatedSession.isEphemeral && currentSession.value) {
                storage.saveSession(currentSession.value);
                sessions.value = storage.getSessions();
            }

        } catch (error) {
            console.error('Failed to send message:', error);

            // Revert optimistic update or show error
            // ideally we'd remove the optimistic user message or add an error flag
            // For now just stop loading

            const errorMsg: Message = {
                id: uuidv4(),
                content: "Sorry, I encountered an error connecting to the server.",
                sender: 'bot',
                timestamp: new Date().toISOString()
            };

            const errorSession = {
                ...updatedSession,
                messages: [...updatedSession.messages, errorMsg]
            };
            currentSession.value = errorSession;
            if (!errorSession.isEphemeral) {
                storage.saveSession(errorSession);
                sessions.value = storage.getSessions();
            }
        } finally {
            isTyping.value = false;
            isLoading.value = false;
        }
    };

    return {
        sessions,
        currentSession,
        isLoading,
        isTyping,
        createSession,
        switchSession,
        sendMessage
    };
}
