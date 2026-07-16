const fs = require('fs');
let content = fs.readFileSync('src/api/wa-bot.ts', 'utf8');

const searchStr = `                    console.log('WhatsApp connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
    
                        if (fs.existsSync('baileys_auth_info')) {
                            fs.rmSync('baileys_auth_info', { recursive: true, force: true });
                        }
                        connectionStatus = 'qr_expired';
                        return; // Stop reconnecting, let user refresh manually
                    }
                    setTimeout(() => initWABot(), 3000);
                } else {`;

const replaceStr = `                    console.log('WhatsApp connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
                    setTimeout(() => initWABot(), 3000);
                } else {`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('src/api/wa-bot.ts', content);
