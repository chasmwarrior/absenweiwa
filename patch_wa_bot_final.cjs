const fs = require('fs');
let content = fs.readFileSync('src/api/wa-bot.ts', 'utf8');

const regex = /sock\.ev\.on\('connection\.update', async \(update: any\) => \{[\s\S]*?\}\);/;

const replacement = `sock.ev.on('connection.update', async (update: any) => {
            const { connection, lastDisconnect, qr } = update;
                
            if (qr) {
                qrCodeDataUrl = await qrcode.toDataURL(qr);
                connectionStatus = 'connecting';
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                connectionStatus = 'close';
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
                    setTimeout(() => initWABot(), 3000);
                } else {
                    // Logged out, delete auth info
                    if (fs.existsSync('baileys_auth_info')) {
                        fs.rmSync('baileys_auth_info', { recursive: true, force: true });
                    }
                    initWABot(); // Restart to get new QR
                }
            } else if (connection === 'open') {
                console.log('WhatsApp Bot is Online!');
                connectionStatus = 'open';
                qrCodeDataUrl = null;
            }
        });`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/api/wa-bot.ts', content);
