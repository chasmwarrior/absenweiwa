const fs = require('fs');
let code = fs.readFileSync('src/pages/BotSettings.tsx', 'utf8');

const locationSettings = `              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={templates.features?.require_location_check_in ?? true}
                  onChange={(e) => setTemplates({ ...templates, features: { ...templates.features, require_location_check_in: e.target.checked } })}
                  className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700"
                />
                <span className="text-sm font-bold text-slate-300">Wajib Kirim Lokasi saat Check-In</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={templates.features?.require_location_check_out ?? true}
                  onChange={(e) => setTemplates({ ...templates, features: { ...templates.features, require_location_check_out: e.target.checked } })}
                  className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700"
                />
                <span className="text-sm font-bold text-slate-300">Wajib Kirim Lokasi saat Check-Out</span>
              </label>`;

code = code.replace(locationSettings, '');

const oldFormatSettings = `<div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                Pengaturan Format Pesan & Perintah
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Perintah Absen Masuk</label>
                  <input type="text" value={templates.commands?.check_in || ''} onChange={(e) => setTemplates({...templates, commands: {...templates.commands, check_in: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Perintah Absen Pulang</label>
                  <input type="text" value={templates.commands?.check_out || ''} onChange={(e) => setTemplates({...templates, commands: {...templates.commands, check_out: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Perintah Izin/Libur</label>
                  <input type="text" value={templates.commands?.leave || ''} onChange={(e) => setTemplates({...templates, commands: {...templates.commands, leave: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Perintah Batal Izin/Libur</label>
                  <input type="text" value={templates.commands?.cancel_leave || ''} onChange={(e) => setTemplates({...templates, commands: {...templates.commands, cancel_leave: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Perintah Info Stats</label>
                  <input type="text" value={templates.commands?.info || ''} onChange={(e) => setTemplates({...templates, commands: {...templates.commands, info: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Perintah Bantuan</label>
                  <input type="text" value={templates.commands?.help || ''} onChange={(e) => setTemplates({...templates, commands: {...templates.commands, help: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
            </div>
          </div>`;

// Check if oldFormatSettings exists and delete it
if (code.includes('Pengaturan Format Pesan & Perintah')) {
    // A bit risky to regex massive block, let's just grep string and delete
    const lines = code.split('\n');
    let newLines = [];
    let skipping = false;
    for (const line of lines) {
        if (line.includes('Pengaturan Format Pesan & Perintah')) {
            skipping = true;
            newLines.pop(); // remove previous div wrapper opening
            newLines.pop(); // remove div container opening
            continue;
        }
        if (skipping) {
            if (line.includes('</div>') && lines[newLines.length+5] && lines[newLines.length+5].includes('Fitur Otomatis')) {
                 skipping = false;
                 // wait, this is too hard to parse manually.
            }
            continue;
        }
        newLines.push(line);
    }
}

// Safer replacement for Pengaturan Format Pesan & Perintah block using regex that spans multiple lines:
code = code.replace(/<div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">\s*<div className="px-6 py-4 border-b border-slate-700 bg-slate-900\/50">\s*<h2 className="text-lg font-semibold text-white flex items-center">\s*<MessageSquare className="w-5 h-5 mr-2 text-blue-400" \/>\s*Pengaturan Format Pesan & Perintah\s*<\/h2>\s*<\/div>\s*<div className="p-6 space-y-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '');

fs.writeFileSync('src/pages/BotSettings.tsx', code);
