const fs = require('fs');
const content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
const searchStr = `{status === 'connecting' && qrCode && (
        <div className="bg-white p-2 rounded-lg">
           <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
        </div>
      )}`;
const replaceStr = `{status === 'connecting' && qrCode && (
        <div className="flex justify-center items-center w-full my-4">
           <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-full max-w-[300px] aspect-square flex items-center justify-center">
             <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
           </div>
        </div>
      )}`;
fs.writeFileSync('src/pages/Settings.tsx', content.replace(searchStr, replaceStr));
