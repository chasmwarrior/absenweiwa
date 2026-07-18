const fs = require('fs');
let code = fs.readFileSync('src/pages/BotSettings.tsx', 'utf8');

// 1. Remove Wajib Kirim Lokasi checkboxes
code = code.replace(
    /<label className="flex items-center space-x-3 cursor-pointer">\s*<input\s*type="checkbox"\s*checked=\{templates\.features\?\.require_location_check_in \?\? true\}\s*onChange=\{\(e\) => setTemplates\(\{ \.\.\.templates, features: \{ \.\.\.templates\.features, require_location_check_in: e\.target\.checked \} \}\)\}\s*className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700"\s*\/>\s*<span className="text-sm font-bold text-slate-300">Wajib Kirim Lokasi saat Check-In<\/span>\s*<\/label>/,
    ''
);

code = code.replace(
    /<label className="flex items-center space-x-3 cursor-pointer">\s*<input\s*type="checkbox"\s*checked=\{templates\.features\?\.require_location_check_out \?\? true\}\s*onChange=\{\(e\) => setTemplates\(\{ \.\.\.templates, features: \{ \.\.\.templates\.features, require_location_check_out: e\.target\.checked \} \}\)\}\s*className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700"\s*\/>\s*<span className="text-sm font-bold text-slate-300">Wajib Kirim Lokasi saat Check-Out<\/span>\s*<\/label>/,
    ''
);

// 2. Remove Pengaturan Format block safely using a specific multi-line regex that stops correctly
const regex = /<div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">\s*<div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900\/50">\s*<div className="flex items-center">\s*<MessageSquare className="w-4 h-4 text-emerald-400 mr-2" \/>\s*<h2 className="text-xs font-bold text-slate-400 uppercase">Pengaturan Format Pesan & Perintah<\/h2>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
code = code.replace(regex, '');

fs.writeFileSync('src/pages/BotSettings.tsx', code);
