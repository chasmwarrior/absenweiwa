const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const searchDiagnostics = `  const checkDiagnostics = async () => {
    try {
      const waRes = await axios.get('/api/bot/status').catch(() => ({ data: { status: 'error' } }));
      setSysStatus({
        wa: waRes.data.status,
        db: 'ok' // Since we can load the page, DB is likely ok.
      });
    } catch (e) {
      setSysStatus({ wa: 'error', db: 'error' });
    }
  };`;

const replaceDiagnostics = `  const [evoStatus, setEvoStatus] = useState<string>('checking');
  
  const checkDiagnostics = async () => {
    try {
      const waRes = await axios.get('/api/bot/status').catch(() => ({ data: { status: 'error' } }));
      const evoRes = await axios.get('/api/evolution/ping').catch(() => ({ data: { status: 'error' } }));
      
      setSysStatus({
        wa: waRes.data.status,
        db: 'ok'
      });
      setEvoStatus(evoRes.data.status);
    } catch (e) {
      setSysStatus({ wa: 'error', db: 'error' });
      setEvoStatus('error');
    }
  };`;

const searchJSX = `      {/* Diagnostics Panel */}
      {sysStatus.wa !== 'open' && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-amber-400">Peringatan: WhatsApp Bot Tidak Aktif</h3>
            <p className="text-xs text-amber-500/70 mt-1">Bot absensi belum terhubung atau sedang offline. Karyawan tidak dapat melakukan absen.</p>
          </div>
          <button
            onClick={() => window.location.href='/settings'}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold transition-colors"
          >
            Quick Install / Setup
          </button>
        </div>
      )}`;

const replaceJSX = `      {/* System Setup / Diagnostics Panel */}
      {(sysStatus.wa !== 'open' || evoStatus !== 'connected') && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-5">
          <div className="flex items-start">
             <div className="flex-shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5 text-amber-500" />
             </div>
             <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">System Setup Required</h3>
                <p className="text-xs text-amber-500/80 mt-1 mb-3">Beberapa service backend belum siap. Ikuti panduan konfigurasi berikut untuk memulai.</p>
                
                <div className="space-y-3">
                   <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                      <div className="flex items-center">
                         <div className={\`w-2 h-2 rounded-full mr-3 \${evoStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'}\`}></div>
                         <div>
                            <div className="text-xs font-bold text-slate-200 uppercase">1. Evolution API Connection</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{evoStatus === 'connected' ? 'Terhubung dengan backend.' : 'Container Evolution API tidak berjalan atau tidak dapat diakses.'}</div>
                         </div>
                      </div>
                      {evoStatus !== 'connected' && (
                         <div className="text-[10px] font-mono bg-slate-800 text-amber-300 px-2 py-1 rounded border border-amber-500/30">docker-compose up -d</div>
                      )}
                   </div>
                   
                   <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                      <div className="flex items-center">
                         <div className={\`w-2 h-2 rounded-full mr-3 \${sysStatus.wa === 'open' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'}\`}></div>
                         <div>
                            <div className="text-xs font-bold text-slate-200 uppercase">2. WhatsApp Bot Session</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{sysStatus.wa === 'open' ? 'Sesi WhatsApp aktif.' : 'Bot belum di-scan atau sesi terputus.'}</div>
                         </div>
                      </div>
                      {sysStatus.wa !== 'open' && (
                         <button onClick={() => window.location.href='/settings'} className="text-[10px] uppercase font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition-colors">
                            Scan QR
                         </button>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}`;

const newContent = content.replace(searchDiagnostics, replaceDiagnostics).replace(searchJSX, replaceJSX);
fs.writeFileSync('src/pages/Dashboard.tsx', newContent);
