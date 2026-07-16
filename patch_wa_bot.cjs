const fs = require('fs');
let content = fs.readFileSync('src/api/wa-bot.ts', 'utf8');

const searchStr = `                if (shouldReconnect) {
                    initWABot();
                } else {`;
const replaceStr = `                if (shouldReconnect) {
                    if (lastDisconnect?.error && lastDisconnect.error.message === 'QR refs attempts ended') {
                        if (fs.existsSync('baileys_auth_info')) {
                            fs.rmSync('baileys_auth_info', { recursive: true, force: true });
                        }
                    }
                    setTimeout(() => initWABot(), 3000);
                } else {`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('src/api/wa-bot.ts', content);
