const fs = require('fs');
let code = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

const messageQueueBlock = `
const messageQueue: { jid: string, text: string }[] = [];
let isProcessingQueue = false;

async function processMessageQueue() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;
    while (messageQueue.length > 0) {
        const msg = messageQueue.shift();
        if (msg && sock && connectionStatus === 'open') {
            try {
                await sock.sendMessage(msg.jid, { text: msg.text });
            } catch (err) {
                console.error("Failed to send WA message:", err);
            }
            // Delay 1-3 seconds randomly to avoid WhatsApp unofficial API spam detection
            const delay = Math.floor(Math.random() * 2000) + 1000;
            await new Promise(r => setTimeout(r, delay));
        } else if (!sock || connectionStatus !== 'open') {
            console.warn("Cannot send message, WA is not connected. Message dropped from queue.");
        }
    }
    isProcessingQueue = false;
}

export async function sendWhatsAppMessage(jid: string, text: string) {
    messageQueue.push({ jid, text });
    processMessageQueue();
}`;

code = code.replace(
    /export async function sendWhatsAppMessage\(jid: string, text: string\) \{[\s\S]*?\}\n/,
    messageQueueBlock + '\n'
);

fs.writeFileSync('src/services/WhatsAppService.ts', code);
