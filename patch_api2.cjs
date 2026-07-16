const fs = require('fs');
let content = fs.readFileSync('src/api/api.ts', 'utf8');

content = content.replace(
  "const { sendWhatsAppMessage } = await import('./wa-bot.js');",
  "const { sendWhatsAppMessage } = await import('../services/WhatsAppService.js');"
);

fs.writeFileSync('src/api/api.ts', content);
