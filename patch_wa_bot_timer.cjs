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
        <div className="flex flex-col justify-center items-center w-full my-4">
           <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-full max-w-[300px] aspect-square flex items-center justify-center mb-3">
             <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
           </div>
           <p className="text-xs font-bold text-amber-400 uppercase">Kedaluwarsa dalam: {timeLeft}s</p>
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
             className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold transition-colors uppercase"
           >
             Refresh
           </button>
        </div>
      )}`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync('src/pages/Settings.tsx', content);
