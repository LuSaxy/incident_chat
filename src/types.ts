export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: string;
}

export interface Session {
    id: string;
    isEphemeral: boolean;
    title: string;
    updatedAt: number;
    messages: Message[];
}

export interface ChatState {
    sessions: Session[];
    currentSessionId: string | null;
    isLoading: boolean;
    isTyping: boolean;
}
