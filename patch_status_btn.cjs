const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const searchStr = `        {status === 'open' && (
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded text-xs font-bold transition-colors border border-red-700/50"
          >
            <PowerOff className="w-3 h-3 mr-2" />
            Disconnect
          </button>
        )}`;

const replaceStr = `        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold transition-colors border border-slate-700"
          >
            Cek Status
          </button>
          {status === 'open' && (
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded text-xs font-bold transition-colors border border-red-700/50"
            >
              <PowerOff className="w-3 h-3 mr-2" />
              Disconnect
            </button>
          )}
        </div>`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync('src/pages/Settings.tsx', content);
