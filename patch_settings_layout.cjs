const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const searchStr = `    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex items-center justify-between">
      <div className="flex items-center space-x-4">`;

const replaceStr = `    <div className="space-y-4 mb-4">
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center space-x-4">`;

const searchStr2 = `      {status === 'open' && (
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded text-xs font-bold transition-colors border border-red-700/50"
        >
          <PowerOff className="w-3 h-3 mr-2" />
          Disconnect
        </button>
      )}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">`;

const replaceStr2 = `        {status === 'open' && (
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded text-xs font-bold transition-colors border border-red-700/50"
          >
            <PowerOff className="w-3 h-3 mr-2" />
            Disconnect
          </button>
        )}
      </div>

      {status === 'connecting' && qrCode && (
        <div className="flex justify-center items-center w-full my-4">
           <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-full max-w-[300px] aspect-square flex items-center justify-center">
             <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
           </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">`;

const searchStr3ToRemove = `      {status === 'connecting' && qrCode && (
        <div className="flex justify-center items-center w-full my-4">
           <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-full max-w-[300px] aspect-square flex items-center justify-center">
             <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
           </div>
        </div>
      )}`;

content = content.replace(searchStr, replaceStr);
content = content.replace(searchStr3ToRemove, ''); // Remove the first occurrence
content = content.replace(searchStr2, replaceStr2);

fs.writeFileSync('src/pages/Settings.tsx', content);
