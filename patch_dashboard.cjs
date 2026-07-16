const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
const search = '      {/* Recent Attendances */}';
const replacement = `      {/* Chart */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase">Statistik Kehadiran 7 Hari Terakhir</h2>
        <DashboardChart attendances={attendances} />
      </div>

      {/* Recent Attendances */}`;
const newContent = content.replace(search, replacement);
fs.writeFileSync('src/pages/Dashboard.tsx', newContent);
