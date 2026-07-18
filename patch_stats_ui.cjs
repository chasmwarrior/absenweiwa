const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeStats.tsx', 'utf8');

const renderOld = `  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Memuat Data...</div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">Data karyawan tidak ditemukan.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header Profile */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 shadow-sm">`;

const renderNew = `  if (loading && !isPinVerified && !needsSetup) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (!isPinVerified) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-8 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-6 border border-slate-700 shadow-inner">
                <Lock className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{needsSetup ? 'Buat PIN Baru' : 'Akses Terkunci'}</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                {needsSetup ? 'Buat PIN 4-6 angka untuk mengamankan data absensi Anda.' : 'Masukkan PIN untuk melihat dashboard statistik Anda.'}
            </p>
            <form onSubmit={handlePinSubmit} className="space-y-6 text-left">
                <div>
                    <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={inputPin}
                        onChange={(e) => setInputPin(e.target.value)}
                        placeholder="••••"
                        className="w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all text-center text-3xl tracking-[0.5em] font-mono shadow-inner"
                        required
                    />
                </div>
                {pinError && <p className="text-rose-400 text-sm text-center font-medium bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">{pinError}</p>}
                <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold transition-colors uppercase text-sm tracking-widest shadow-lg shadow-indigo-500/20" disabled={loading}>
                    {loading ? 'Memproses...' : (needsSetup ? 'Simpan PIN' : 'Buka Dashboard')}
                </button>
            </form>
          </div>
        </div>
      );
  }

  if (!data) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">Data karyawan tidak ditemukan.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header Profile */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 shadow-sm">`;

code = code.replace(renderOld, renderNew);
fs.writeFileSync('src/pages/EmployeeStats.tsx', code);
