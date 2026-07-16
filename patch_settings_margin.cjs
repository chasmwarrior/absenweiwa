const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const searchStr = `      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
         <div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900/50">
           <h2 className="text-xs font-bold text-slate-400 uppercase">System Installation & Maintenance</h2>`;

const replaceStr = `      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col mt-8">
         <div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900/50">
           <h2 className="text-xs font-bold text-slate-400 uppercase">System Installation & Maintenance</h2>`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync('src/pages/Settings.tsx', content);
