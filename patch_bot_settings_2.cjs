const fs = require('fs');
let code = fs.readFileSync('src/pages/BotSettings.tsx', 'utf8');

const regex = /<div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mt-6">\s*<div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900\/50">\s*<div className="flex items-center">\s*<MessageSquare className="w-4 h-4 text-emerald-400 mr-2" \/>\s*<h2 className="text-xs font-bold text-slate-400 uppercase">Pengaturan Format Pesan & Perintah<\/h2>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;

code = code.replace(regex, '');

fs.writeFileSync('src/pages/BotSettings.tsx', code);
