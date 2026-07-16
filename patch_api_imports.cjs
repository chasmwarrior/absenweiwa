const fs = require('fs');
let content = fs.readFileSync('src/api/api.ts', 'utf8');

content = content.replace(
  "import { settings, users, attendances, locations } from '../db/schema.js';",
  "import { settings, users, attendances, locations, phoneNumberRequests } from '../db/schema.js';"
);

fs.writeFileSync('src/api/api.ts', content);
