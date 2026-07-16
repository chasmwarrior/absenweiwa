const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

content = content.replace(/grid grid-cols-2 gap-4/g, "grid grid-cols-1 md:grid-cols-2 gap-4");

fs.writeFileSync('src/pages/Settings.tsx', content);
