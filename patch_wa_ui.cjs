const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const searchStr = `      {status === 'connecting' && qrCode && (
        <div className="flex justify-center items-center w-full my-4">
           <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-full max-w-[300px] aspect-square flex items-center justify-center">
             <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
           </div>
        </div>
      )}`;

const replaceStr = `      {status === 'connecting' && qrCode && (
        <div className="flex justify-center items-center w-full my-4">
           <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-full max-w-[300px] aspect-square flex items-center justify-center">
             <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
           </div>
        </div>
      )}
      {status === 'qr_expired' && (
        <div className="flex flex-col justify-center items-center w-full my-4 p-6 bg-slate-800 rounded-xl border border-slate-700">
           <QrCode className="w-12 h-12 text-slate-500 mb-3" />
           <p className="text-sm font-bold text-slate-300 mb-2">Barcode Kadaluarsa</p>
           <p className="text-xs text-slate-400 mb-4 text-center">Silakan refresh untuk mendapatkan barcode baru.</p>
           <button
             onClick={async () => {
               setStatus('loading');
               try {
                 await axios.post('/api/bot/refresh');
                 fetchStatus();
               } catch (err) {
                 alert('Gagal refresh barcode');
               }
             }}
             className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors"
           >
             Refresh Barcode
           </button>
        </div>
      )}`;

content = content.replace(searchStr, replaceStr);

const statusSearch = `            Status: <span className={status === 'open' ? 'text-emerald-400' : 'text-amber-400'}>{status}</span>`;
const statusReplace = `            Status: <span className={status === 'open' ? 'text-emerald-400' : status === 'qr_expired' ? 'text-rose-400' : 'text-amber-400'}>{status}</span>`;
content = content.replace(statusSearch, statusReplace);

const pSearch = `{status === 'open' ? 'Bot terhubung dan berjalan normal.' : 'Scan QR code untuk menghubungkan WhatsApp.'}`;
const pReplace = `{status === 'open' ? 'Bot terhubung dan berjalan normal.' : status === 'qr_expired' ? 'Barcode telah kadaluarsa.' : 'Scan QR code untuk menghubungkan WhatsApp.'}`;
content = content.replace(pSearch, pReplace);

// Remove interval in WhatsAppBotSetup to see if it fixes the blinking issue
// We will change it to not use setInterval, or to use a longer interval
const intervalSearch = `    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);`;
const intervalReplace = `    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);`;
// actually maybe we keep it, but it might be causing flickering if fetchStatus fails or sets 'error'.

fs.writeFileSync('src/pages/Settings.tsx', content);
