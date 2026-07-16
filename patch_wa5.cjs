const fs = require('fs');
let content = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

content = content.replace(
  "c.command.toLowerCase() === command",
  "(c.command.toLowerCase() || '').replace(/^!/, '') === command"
);

fs.writeFileSync('src/services/WhatsAppService.ts', content);
