const fs = require('fs');
let content = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

// Insert lastMessageTimes globally
if (!content.includes('const lastMessageTimes = new Map')) {
    content = content.replace(
        "export const waBotRouter",
        "const lastMessageTimes = new Map<string, number>();\nconst SPAM_THRESHOLD_MS = 2500;\n\nexport const waBotRouter"
    );
}

fs.writeFileSync('src/services/WhatsAppService.ts', content);
