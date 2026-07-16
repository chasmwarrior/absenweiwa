const fs = require('fs');
let content = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

content = content.replace(
  "di link berikut:\\n${appUrl}\`);",
  "di link berikut:\\n${appUrl}/register\`);"
);

fs.writeFileSync('src/services/WhatsAppService.ts', content);
