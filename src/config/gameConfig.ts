export const gameConfig = {
    // Game Settings
    sfxEnabled: true,
    startSpeed: 8,
    gravity: 0.6,
    jumpForce: -10,
    spawnRate: 1200, // ms between spawns (approx)

    // Content Generation Mode: 'random' | 'sequential'
    spawnMode: 'sequential',

    // Obstacles (Jump over these)
    // Format: "Label" or { label: "Label", type: "visual_type" }
    obstacles: [
        { label: "WIP", type: "fire" },
        { label: "Topic Lag", type: "dynamite" },
        { label: "Reconciliation", type: "bomb" },
        { label: "Remittance", type: "fire" },
        { label: "Manual Work", type: "bomb" },
        { label: "Legacy Code", type: "toxic" },
        { label: "Timeout", type: "fire" },
        { label: "404 Error", type: "bomb" }
    ],

    // Enemies (Shoot these)
    enemies: [
        { label: "Marius", type: "monkey" }, // Throws items
        { label: "Mike", type: "drone" },
        { label: "Nick", type: "drone" },
        { label: "Bug Report", type: "drone" },
        { label: "Critical Sev1", type: "monkey" }
    ],

    // Background Scenery (Passive)
    backgrounds: [
        "Chase",
        "Bambora",
        "Tap",
        "Stripe",
        "Adyen",
        "PayPal"
    ],

    // Messages
    colors: {
        hero: '#00ff00',      // Retro Green
        obstacle: '#ff0000',  // Red
        enemy: '#ff00ff',     // Magenta  
        text: '#00ff00'       // Green text
    }
};
