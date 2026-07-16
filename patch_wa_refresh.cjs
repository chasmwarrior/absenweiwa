const fs = require('fs');
let content = fs.readFileSync('src/api/wa-bot.ts', 'utf8');

const searchStr = `waBotRouter.post('/refresh', async (req, res) => {
    if (connectionStatus === 'qr_expired' || connectionStatus === 'close') {
        initWABot();
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Not in expired/close state' });
    }
});`;

const replaceStr = `waBotRouter.post('/refresh', async (req, res) => {
    if (sock) {
        try { sock.logout(); } catch (e) {}
    }
    if (fs.existsSync('baileys_auth_info')) {
        fs.rmSync('baileys_auth_info', { recursive: true, force: true });
    }
    connectionStatus = 'close';
    qrCodeDataUrl = null;
    
    initWABot();
    res.json({ success: true });
});`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync('src/api/wa-bot.ts', content);
