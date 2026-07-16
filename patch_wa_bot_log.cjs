const fs = require('fs');
let content = fs.readFileSync('src/api/wa-bot.ts', 'utf8');

const searchStr = `                console.log('WhatsApp connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
                connectionStatus = 'close';
                qrCodeDataUrl = null;
                
                if (shouldReconnect) {
                    if (lastDisconnect?.error && lastDisconnect.error.message === 'QR refs attempts ended') {`;

const replaceStr = `                connectionStatus = 'close';
                qrCodeDataUrl = null;
                
                if (shouldReconnect) {
                    const isQRExpired = lastDisconnect?.error && 
                        (lastDisconnect.error.message === 'QR refs attempts ended' || 
                         String(lastDisconnect.error).includes('QR refs attempts ended'));
                         
                    if (isQRExpired) {
                        console.log('WhatsApp QR Code expired. Waiting for user to refresh.');
                        if (fs.existsSync('baileys_auth_info')) {
                            fs.rmSync('baileys_auth_info', { recursive: true, force: true });
                        }
                        connectionStatus = 'qr_expired';
                        return; // Stop reconnecting, let user refresh manually
                    }
                    console.log('WhatsApp connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('src/api/wa-bot.ts', content);
