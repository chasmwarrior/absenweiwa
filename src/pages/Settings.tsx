import React from "react";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, QrCode, PowerOff, RefreshCw, Clock } from 'lucide-react';
import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';

function WhatsAppBotSetup() {
  const { status, qrCode, fetchStatus, reconnect } = useWhatsAppStatus();
  const [timeLeft, setTimeLeft] = React.useState<number>(0);

  React.useEffect(() => {
    if (status === 'connecting' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, status]);

  React.useEffect(() => {
    if (status === 'connecting' && timeLeft === 0) {
      setTimeLeft(40);
    }
  }, [status]);

  const handleLogout = async () => {
    if (!confirm('Yakin ingin memutuskan koneksi bot WhatsApp ini?')) return;
    try {
      await axios.post('/api/bot/logout');
      fetchStatus();
    } catch (err) {
      alert('Gagal memutuskan koneksi');
    }
  };

  return (
    <div className="space-y-4 mb-4">
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
        {status === 'open' ? (
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="w-3 h-3 bg-emerald-500 rounded-full "></span>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <QrCode className="w-6 h-6 text-slate-400" />
          </div>
        )}
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase">
            Status: <span className={status === 'open' ? 'text-emerald-400' : status === 'qr_expired' ? 'text-rose-400' : 'text-amber-400'}>{status === 'open' ? 'Connected' : status === 'close' ? 'Disconnected' : status === 'connecting' ? 'Scanning QR' : status}</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            {status === 'open' ? 'Bot terhubung dan berjalan normal.' : status === 'qr_expired' ? 'Barcode telah kadaluarsa. Klik Reconnect.' : 'Scan QR code untuk menghubungkan WhatsApp.'}
          </p>
        </div>
      </div>
      
        <div className="flex items-center gap-2">
          <button
            onClick={reconnect}
            className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors shadow"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Reconnect
          </button>
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
        </div>
      </div>
      {(status === 'connecting' || status === 'loading') && qrCode && (
        <div className="bg-slate-900 p-6 rounded-lg flex flex-col items-center justify-center border border-slate-700">
          <h4 className="text-sm font-bold text-slate-200 mb-4">Scan QR Code</h4>
          <div className="bg-white p-4 rounded-lg">
            <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center">
             <Clock className="w-4 h-4 mr-1" /> QR code expired in {timeLeft}s
          </p>
        </div>
      )}
    </div>
  );
}



export default function Settings() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      let data = res.data;
      if (!data.branding) {
        data.branding = { app_name: 'Sistem Absensi', logo_url: '' };
      }
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const [newPassword, setNewPassword] = useState('');

  const handleSave = async () => {
    try {
      await axios.post('/api/settings', settings);
      alert('Pengaturan berhasil disimpan');
      // Dispatch event to update layout branding immediately
      window.dispatchEvent(new Event('branding-updated'));
    } catch (err) {
      alert('Gagal menyimpan pengaturan');
    }
  };

  const handleClearLogs = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus data absensi lebih dari 30 hari yang lalu?')) {
      try {
        await axios.post('/api/data/clear-logs');
        alert('Log lama berhasil dihapus');
      } catch (err) {
        alert('Gagal menghapus log');
      }
    }
  };

  const handleResetData = async () => {
    if (confirm('PERINGATAN: Ini akan menghapus SEMUA data absensi, lokasi, dan pengaturan (kecuali admin). Apakah Anda sangat yakin?')) {
      try {
        await axios.post('/api/data/reset-all');
        alert('Semua data berhasil di-reset');
        fetchSettings();
      } catch (err) {
        alert('Gagal mereset data');
      }
    }
  };

  const handleExportDatabase = () => {
    window.open('/api/data/export', '_blank');
  };

  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      await axios.post('/api/admin/change-password', { password: newPassword });
      alert('Password admin berhasil diubah');
      setNewPassword('');
    } catch (err) {
      alert('Gagal mengubah password');
    }
  };

  if (!settings) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
        <div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900/50">
          <h2 className="text-xs font-bold text-slate-400 uppercase">Pengaturan Sistem</h2>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors"
          >
            Simpan Perubahan
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> Branding
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nama Program</label>
                <input
                  type="text"
                  value={settings.branding?.app_name || ''}
                  onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, app_name: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Sistem Absensi"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">URL Logo (Opsional)</label>
                <input
                  type="text"
                  value={settings.branding?.logo_url || ''}
                  onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, logo_url: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span> Jam Kerja
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Jam Masuk</label>
                <input
                  type="time"
                  value={settings.work_hours.start}
                  onChange={(e) => setSettings({ ...settings, work_hours: { ...settings.work_hours, start: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Jam Pulang</label>
                <input
                  type="time"
                  value={settings.work_hours.end}
                  onChange={(e) => setSettings({ ...settings, work_hours: { ...settings.work_hours, end: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span> WhatsApp Bot Connection
            </h3>
            <div className="space-y-4">
              <WhatsAppBotSetup />
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span> Denda Keterlambatan
            </h3>
            <div className="space-y-2">
              {settings.late_penalties.map((penalty: any, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={penalty.start}
                    onChange={(e) => {
                      const newPenalties = [...settings.late_penalties];
                      newPenalties[index].start = e.target.value;
                      setSettings({ ...settings, late_penalties: newPenalties });
                    }}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="time"
                    value={penalty.end}
                    onChange={(e) => {
                      const newPenalties = [...settings.late_penalties];
                      newPenalties[index].end = e.target.value;
                      setSettings({ ...settings, late_penalties: newPenalties });
                    }}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
                  />
                  <input
                    type="number"
                    value={penalty.amount}
                    onChange={(e) => {
                      const newPenalties = [...settings.late_penalties];
                      newPenalties[index].amount = parseInt(e.target.value) || 0;
                      setSettings({ ...settings, late_penalties: newPenalties });
                    }}
                    placeholder="Rp"
                    className="w-32 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
                  />
                  <button
                    onClick={() => {
                      const newPenalties = settings.late_penalties.filter((_: any, i: number) => i !== index);
                      setSettings({ ...settings, late_penalties: newPenalties });
                    }}
                    className="text-red-500 p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSettings({ ...settings, late_penalties: [...settings.late_penalties, { start: '00:00', end: '00:00', amount: 0 }] })}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
              >
                + Tambah Aturan Denda
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span> Lembur (Overtime)
            </h3>
            <div className="mb-3">
               <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Batas Mulai Lembur</label>
               <input
                  type="time"
                  value={settings.overtime.start}
                  onChange={(e) => setSettings({ ...settings, overtime: { ...settings.overtime, start: e.target.value } })}
                  className="w-40 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                />
            </div>
            <div className="space-y-2">
              {settings.overtime.rates.map((rate: any, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={rate.start}
                    onChange={(e) => {
                      const newRates = [...settings.overtime.rates];
                      newRates[index].start = e.target.value;
                      setSettings({ ...settings, overtime: { ...settings.overtime, rates: newRates } });
                    }}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="time"
                    value={rate.end}
                    onChange={(e) => {
                      const newRates = [...settings.overtime.rates];
                      newRates[index].end = e.target.value;
                      setSettings({ ...settings, overtime: { ...settings.overtime, rates: newRates } });
                    }}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
                  />
                  <input
                    type="number"
                    value={rate.amount}
                    onChange={(e) => {
                      const newRates = [...settings.overtime.rates];
                      newRates[index].amount = parseInt(e.target.value) || 0;
                      setSettings({ ...settings, overtime: { ...settings.overtime, rates: newRates } });
                    }}
                    placeholder="Rp"
                    className="w-32 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200"
                  />
                  <button
                    onClick={() => {
                      const newRates = settings.overtime.rates.filter((_: any, i: number) => i !== index);
                      setSettings({ ...settings, overtime: { ...settings.overtime, rates: newRates } });
                    }}
                    className="text-red-500 p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSettings({ ...settings, overtime: { ...settings.overtime, rates: [...settings.overtime.rates, { start: '00:00', end: '00:00', amount: 0 }] } })}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
              >
                + Tambah Aturan Lembur
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span> Bonus & Quota
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Bonus Tepat Waktu (Harian)</label>
                <input
                  type="number"
                  value={settings.bonuses?.on_time || 0}
                  onChange={(e) => setSettings({ ...settings, bonuses: { ...settings.bonuses, on_time: parseInt(e.target.value) || 0 } })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Disiplin 100% (Bulanan)</label>
                <input
                  type="number"
                  value={settings.bonuses?.perfect_attendance || 0}
                  onChange={(e) => setSettings({ ...settings, bonuses: { ...settings.bonuses, perfect_attendance: parseInt(e.target.value) || 0 } })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Batas Potong Libur (Telat)</label>
                <input
                  type="time"
                  value={settings.late_cut_holiday}
                  onChange={(e) => setSettings({ ...settings, late_cut_holiday: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
         <div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900/50">
           <h2 className="text-xs font-bold text-slate-400 uppercase">Manajemen Data & Keamanan</h2>
         </div>
         <div className="p-4 space-y-6">
            <div>
               <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
                 <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span> Ubah Password Admin
               </h3>
               <form onSubmit={handleChangePassword} className="flex gap-2">
                 <input
                   type="password"
                   value={newPassword}
                   onChange={(e) => setNewPassword(e.target.value)}
                   placeholder="Password Baru"
                   className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                   required
                 />
                 <button
                   type="submit"
                   className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-bold transition-colors"
                 >
                   Update Password
                 </button>
               </form>
            </div>

            <div className="pt-4 border-t border-slate-700">
               <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
                 <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span> Manajemen Database
               </h3>
               <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportDatabase}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm font-bold transition-colors"
                  >
                    Export Database (JSON)
                  </button>
                  <button
                    onClick={() => window.open('/api/data/audit-log', '_blank')}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm font-bold transition-colors"
                  >
                    Export Audit Log (JSON)
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="px-4 py-2 bg-amber-900/50 hover:bg-amber-800/50 text-amber-400 rounded text-sm font-bold transition-colors border border-amber-700/50"
                  >
                    Hapus Log Lama (&gt;30 Hari)
                  </button>
                  <button
                    onClick={handleResetData}
                    className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded text-sm font-bold transition-colors border border-red-700/50"
                  >
                    Reset Semua Data
                  </button>
               </div>
               <p className="text-[10px] text-slate-500 mt-2">
                  Peringatan: Aksi Hapus Log dan Reset Semua Data tidak dapat dibatalkan. Pastikan Anda telah melakukan Export Database terlebih dahulu.
               </p>
            </div>
         </div>
      </div>

    </div>
  );
}
