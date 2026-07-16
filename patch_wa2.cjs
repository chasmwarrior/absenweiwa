const fs = require('fs');
let content = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

content = content.replace(
  "import { settings, users, attendances } from '../db/schema.js';",
  "import { settings, users, attendances, phoneNumberRequests } from '../db/schema.js';"
);

content = content.replace("const { phoneNumberRequests } = require('../db/schema.js');", "");

fs.writeFileSync('src/services/WhatsAppService.ts', content);
