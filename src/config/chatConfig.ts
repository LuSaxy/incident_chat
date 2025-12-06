export const chatConfig = {
    // The n8n webhook URL for the chat backend
    webhookUrl: 'http://localhost:5678/webhook/3b8/chat',

    // Feature flag for experimental streaming chat
    // true = use streamMessageFromN8N (AsyncGenerator)
    // false = use sendMessageToN8NPromise (Promise)
    useStreaming: true,
};
