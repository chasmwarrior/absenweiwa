const fs = require('fs');
let code = fs.readFileSync('src/pages/BotSettings.tsx', 'utf8');

const regex = /<div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">\s*<div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900\/50">\s*<div className="flex items-center">\s*<MessageSquare className="w-4 h-4 text-emerald-400 mr-2" \/>\s*<h2 className="text-xs font-bold text-slate-400 uppercase">Pengaturan Format Pesan & Perintah<\/h2>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

code = code.replace(regex, '');

// Also clean up any trailing empty divs if they exist
code = code.replace(/<div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">[\s\S]*?Pengaturan Format Pesan & Perintah[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '');

fs.writeFileSync('src/pages/BotSettings.tsx', code);
