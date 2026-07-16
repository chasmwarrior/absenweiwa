import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, MessageSquare, Info, RefreshCw, PowerOff, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';

export default function BotSettings() {
  const [templates, setTemplates] = useState<any>(null);
  const [isCommandsOpen, setIsCommandsOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const { status, qrCode, reconnect } = useWhatsAppStatus();

  const displayStatus = () => {
    if (status === 'open') return 'Connected';
    if (status === 'close' || status === 'error' || status === 'qr_expired') return 'Disconnected';
    if (status === 'connecting') return qrCode ? 'Scanning' : 'Connecting...';
    return 'Loading...';
  };


  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/bot-templates');
      setTemplates(res.data);
    } catch (err: any) {
      if (err?.response?.status !== 429) console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/bot-templates', templates);
      toast.success('Pengaturan bot berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan bot');
    }
  };

  if (!templates) return <div className="p-8 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      {/* Bot Status Card */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
        <div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center">
            <PowerOff className="w-4 h-4 text-indigo-400 mr-2" />
            <h2 className="text-xs font-bold text-slate-400 uppercase">Status WhatsApp Bot</h2>
          </div>
          <button
            onClick={reconnect}
            className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reconnect
          </button>
        </div>
        <div className="p-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Status Koneksi</div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                status === 'open' ? 'bg-emerald-500' :
                status === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              } animate-pulse`}></div>
              <span className="text-lg font-bold text-slate-200 capitalize">
                {displayStatus()}
              </span>
            </div>
          </div>
          
          {status === 'connecting' && qrCode && (
            <div className="flex flex-col items-center border border-slate-700 p-2 rounded-lg bg-white">
              <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
              <div className="text-xs text-slate-500 mt-2 font-bold text-center w-full">Scan QR dengan WhatsApp Anda</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
        <div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center">
            <MessageSquare className="w-4 h-4 text-emerald-400 mr-2" />
            <h2 className="text-xs font-bold text-slate-400 uppercase">Pengaturan Format Pesan & Perintah</h2>
          </div>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors"
          >
            Simpan Perubahan
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div className="bg-indigo-900/30 border border-indigo-500/30 p-3 rounded-lg flex items-start">
            <Info className="w-5 h-5 text-indigo-400 mr-3 shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-200">
              
          {/* Custom Commands Link */}
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-indigo-400">Custom Commands & Variabel Pesan</h3>
              <p className="text-xs text-indigo-300 mt-1">Kelola perintah tambahan bot dan lihat panduan variabel pesan lengkap.</p>
            </div>
            <a href="/custom-commands" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors">
              Buka Pengaturan
            </a>
          </div>

            </div>
          </div>

          {/* Toggles / Features Section */}
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span> Fitur Otomatis
            </h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={templates.features?.require_location_check_in ?? true}
                  onChange={(e) => setTemplates({ ...templates, features: { ...templates.features, require_location_check_in: e.target.checked } })}
                  className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700"
                />
                <span className="text-sm font-bold text-slate-300">Wajib Kirim Lokasi saat Check-In</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={templates.features?.require_location_check_out ?? true}
                  onChange={(e) => setTemplates({ ...templates, features: { ...templates.features, require_location_check_out: e.target.checked } })}
                  className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700"
                />
                <span className="text-sm font-bold text-slate-300">Wajib Kirim Lokasi saat Check-Out</span>
              </label>
              <div className="pt-2">
                <label className="block text-sm font-bold text-slate-300 mb-1">ID Grup yang Diizinkan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: 12345@g.us, 67890@g.us (Pisahkan dengan koma)"
                  value={templates.features?.allowed_groups || ''}
                  onChange={(e) => setTemplates({ ...templates, features: { ...templates.features, allowed_groups: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1">Biarkan kosong jika bot boleh merespon di semua grup.</p>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={templates.features?.auto_alert_violations ?? false}
                  onChange={(e) => setTemplates({ ...templates, features: { ...templates.features, auto_alert_violations: e.target.checked } })}
                  className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700"
                />
                <span className="text-sm font-bold text-slate-300">Notifikasi Pelanggaran Otomatis ke Admin (Terlambat, dll)</span>
              </label>
            </div>
          </div>

          
          {/* Commands Section */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <button 
              onClick={() => setIsCommandsOpen(!isCommandsOpen)} 
              className="w-full px-5 py-4 flex justify-between items-center bg-slate-800 hover:bg-slate-700/50 transition-colors"
            >
              <h3 className="text-[11px] font-bold text-slate-400 uppercase flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span> Perintah (Commands)
              </h3>
              {isCommandsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            
            {isCommandsOpen && (
              <div className="p-5 border-t border-slate-700 bg-slate-800/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Perintah Masuk (Check-In)</label>
                    <input
                      type="text"
                      value={templates.commands.check_in}
                      onChange={(e) => setTemplates({ ...templates, commands: { ...templates.commands, check_in: e.target.value } })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Perintah Pulang (Check-Out)</label>
                    <input
                      type="text"
                      value={templates.commands.check_out}
                      onChange={(e) => setTemplates({ ...templates, commands: { ...templates.commands, check_out: e.target.value } })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Perintah Info / Statistik</label>
                    <input
                      type="text"
                      value={templates.commands.info}
                      onChange={(e) => setTemplates({ ...templates, commands: { ...templates.commands, info: e.target.value } })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Perintah Bantuan (Help)</label>
                    <input
                      type="text"
                      value={templates.commands.help || '!help'}
                      onChange={(e) => setTemplates({ ...templates, commands: { ...templates.commands, help: e.target.value } })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Izin / Libur</label>
                    <input
                      type="text"
                      value={templates.commands.leave || '!libur'}
                      onChange={(e) => setTemplates({ ...templates, commands: { ...templates.commands, leave: e.target.value } })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Telat</label>
                    <input
                      type="text"
                      value={templates.commands.telat || '!telat'}
                      onChange={(e) => setTemplates({ ...templates, commands: { ...templates.commands, telat: e.target.value } })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Batal Izin</label>
                    <input
                      type="text"
                      value={templates.commands.cancel_leave || '!batal_izin'}
                      onChange={(e) => setTemplates({ ...templates, commands: { ...templates.commands, cancel_leave: e.target.value } })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          
          {/* Replies Section */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <button 
              onClick={() => setIsRepliesOpen(!isRepliesOpen)} 
              className="w-full px-5 py-4 flex justify-between items-center bg-slate-800 hover:bg-slate-700/50 transition-colors"
            >
              <h3 className="text-[11px] font-bold text-slate-400 uppercase flex items-center">
                <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span> Balasan Bot (Replies)
              </h3>
              {isRepliesOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            
            {isRepliesOpen && (
              <div className="p-5 border-t border-slate-700 bg-slate-800/50">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Berhasil Absen Masuk (Normal)</label>
                    <textarea
                      value={templates.replies.check_in_success || 'Halo {name}, absensi MASUK berhasil pada pukul {time} di {location}.'}
                      onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, check_in_success: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Absen Masuk (Terlambat)</label>
                    <textarea
                      value={templates.replies.check_in_late || 'Halo {name}, absensi MASUK berhasil pada pukul {time} di {location}.\nsayang sekali saat ini anda telat {duration}.\njumlah telat kamu tersisa {late_quota_left}.\ntetap semangat emot.'}
                      onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, check_in_late: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Berhasil Absen Pulang (Normal)</label>
                    <textarea
                      value={templates.replies.check_out_success || 'Halo {name}, absensi PULANG berhasil pada pukul {time} di {location}.'}
                      onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, check_out_success: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Berhasil Absen Pulang (Lembur)</label>
                    <textarea
                      value={templates.replies.check_out_overtime || 'Halo {name}, absensi PULANG berhasil pada pukul {time} di {location}.\nTerima Kasih atas Hari ini, Anda telah lembur selama {duration}.'}
                      onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, check_out_overtime: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Absen di Luar Geofence</label>
                    <textarea
                      value={templates.replies.out_of_geofence || 'Anda berada di luar area kantor. Mohon kirimkan bukti foto dan alasan. (Menunggu persetujuan Admin).'}
                      onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, out_of_geofence: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Persetujuan Admin (Disetujui)</label>
                    <textarea
                      value={templates.replies.approval_approved || 'Permohonan {statusName} Anda pada tanggal {date} telah *DISETUJUI* oleh Admin.{notes}'}
                      onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, approval_approved: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Persetujuan Admin (Ditolak)</label>
                    <textarea
                      value={templates.replies.approval_rejected || 'Permohonan {statusName} Anda pada tanggal {date} telah *DITOLAK* oleh Admin.{notes}'}
                      onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, approval_rejected: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Balasan Statistik (Info)</label>
                    <textarea
                      value={templates.replies.info_stats || 'Halo {name}, berikut Estimasi pendapatan kamu sampai saat ini.\n{stats_breakdown}'}
                      onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, info_stats: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Izin/Libur Berhasil</label>
                    <textarea
                      value={templates.replies.leave_success || 'Halo {name}, permohonan Izin/Libur anda telah dicatat pada pukul {time}.'}
                      onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, leave_success: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Peringatan Belum Absen Pulang (Akhir Hari)</label>
                    <textarea
                      value={templates.replies.auto_checkout_warning || 'Halo {name}, anda belum melakukan absen pulang. Sistem telah melakukan absen pulang otomatis (Pulang Normal).'}
                      onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, auto_checkout_warning: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          
        </div>
      </div>
    </div>
  );
}
