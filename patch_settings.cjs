const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const handleResetAllFunc = `  const handleResetData = async () => {`;
const handleResetAttsFunc = `  const handleResetAttendances = async () => {
    if (confirm('PERINGATAN: Ini akan menghapus HANYA data absensi. Pengaturan dan data karyawan tidak akan dihapus. Apakah Anda yakin?')) {
      try {
        await axios.post('/api/data/reset-attendances');
        alert('Data absensi berhasil dihapus');
      } catch (err) {
        alert('Gagal menghapus data absensi');
      }
    }
  };

  const handleResetData = async () => {`;

code = code.replace(handleResetAllFunc, handleResetAttsFunc);

const buttonsBlock = `                  <button
                    onClick={handleClearLogs}
                    className="px-4 py-2 bg-amber-900/50 hover:bg-amber-800/50 text-amber-400 rounded text-sm font-bold transition-colors border border-amber-700/50"
                  >
                    Hapus Log Lama (&gt;30 Hari)
                  </button>
                  <button
                    onClick={handleResetData}`;

const newButtonsBlock = `                  <button
                    onClick={handleClearLogs}
                    className="px-4 py-2 bg-amber-900/50 hover:bg-amber-800/50 text-amber-400 rounded text-sm font-bold transition-colors border border-amber-700/50"
                  >
                    Hapus Log Lama (&gt;30 Hari)
                  </button>
                  <button
                    onClick={handleResetAttendances}
                    className="px-4 py-2 bg-rose-900/50 hover:bg-rose-800/50 text-rose-400 rounded text-sm font-bold transition-colors border border-rose-700/50"
                  >
                    Hapus Data Absensi Saja
                  </button>
                  <button
                    onClick={handleResetData}`;

code = code.replace(buttonsBlock, newButtonsBlock);

fs.writeFileSync('src/pages/Settings.tsx', code);
