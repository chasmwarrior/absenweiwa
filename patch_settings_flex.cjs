const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// For WhatsAppBotSetup
content = content.replace(
  '<div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex items-center justify-between">',
  '<div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">'
);

// For EvolutionApiSetup
content = content.replace(
  '<div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex items-center justify-between mb-4">',
  '<div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">'
);

fs.writeFileSync('src/pages/Settings.tsx', content);
