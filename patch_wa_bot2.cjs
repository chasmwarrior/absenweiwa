const fs = require('fs');
let content = fs.readFileSync('src/api/wa-bot.ts', 'utf8');

const searchStr = `                if (shouldReconnect) {
                    if (lastDisconnect?.error && lastDisconnect.error.message === 'QR refs attempts ended') {
                        if (fs.existsSync('baileys_auth_info')) {
                            fs.rmSync('baileys_auth_info', { recursive: true, force: true });
                        }
                    }
                    setTimeout(() => initWABot(), 3000);
                } else {`;
const replaceStr = `                if (shouldReconnect) {
                    if (lastDisconnect?.error && lastDisconnect.error.message === 'QR refs attempts ended') {
                        if (fs.existsSync('baileys_auth_info')) {
                            fs.rmSync('baileys_auth_info', { recursive: true, force: true });
                        }
                        connectionStatus = 'qr_expired';
                        return; // Stop reconnecting, let user refresh manually
                    }
                    setTimeout(() => initWABot(), 3000);
                } else {`;

content = content.replace(searchStr, replaceStr);

const addEndpointStr = `waBotRouter.post('/logout', async (req, res) => {`;
const newEndpointStr = `waBotRouter.post('/refresh', async (req, res) => {
    if (connectionStatus === 'qr_expired' || connectionStatus === 'close') {
        initWABot();
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Not in expired/close state' });
    }
});

waBotRouter.post('/logout', async (req, res) => {`;

content = content.replace(addEndpointStr, newEndpointStr);

fs.writeFileSync('src/api/wa-bot.ts', content);
