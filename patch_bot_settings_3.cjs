const fs = require('fs');
let code = fs.readFileSync('src/pages/BotSettings.tsx', 'utf8');

const regex = /<div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">[\s\S]*?<h2 className="text-xs font-bold text-slate-400 uppercase">Pengaturan Format Pesan & Perintah<\/h2>[\s\S]*?<label className="block text-xs uppercase font-bold text-slate-400 mb-1">Perintah Info Stats<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;

code = code.replace(regex, '');

fs.writeFileSync('src/pages/BotSettings.tsx', code);
