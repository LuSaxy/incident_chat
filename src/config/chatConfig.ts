export const chatConfig = {
    // The n8n webhook URL for the chat backend
    webhookUrl: 'replace me with your webhook URL',

    // Feature flag for experimental streaming chat
    // true = use streamMessageFromN8N (AsyncGenerator)
    // false = use sendMessageToN8NPromise (Promise)
    useStreaming: true,
};
