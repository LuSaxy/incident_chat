import type { Session } from '../types';

const STORAGE_KEY = 'n8n_chat_sessions';

export const storage = {
    getSessions: (): Session[] => {
        try {
            const item = localStorage.getItem(STORAGE_KEY);
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error('Storage Read Error:', error);
            return [];
        }
    },

    saveSession: (session: Session) => {
        if (session.isEphemeral) return; // Don't save ephemeral sessions

        const sessions = storage.getSessions();
        const index = sessions.findIndex(s => s.id === session.id);

        if (index >= 0) {
            sessions[index] = session;
        } else {
            sessions.push(session);
        }

        // Sort by most recent
        sessions.sort((a, b) => b.updatedAt - a.updatedAt);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    },

    deleteSession: (sessionId: string) => {
        const sessions = storage.getSessions().filter(s => s.id !== sessionId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
};
