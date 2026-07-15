import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, MessageSquare, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BotSettings() {
  const [templates, setTemplates] = useState<any>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/bot-templates');
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
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
    <div className="space-y-4 max-w-4xl">
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
              <p className="font-bold mb-1">Panduan Variabel Pesan</p>
              <p className="text-indigo-300/80 mb-2">Anda dapat menggunakan variabel berikut di dalam teks balasan. Sistem akan otomatis menggantinya dengan data yang sesuai saat mengirim pesan.</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li><code className="bg-indigo-900/50 px-1 rounded text-indigo-300">{`{name}`}</code> : Nama Karyawan</li>
                <li><code className="bg-indigo-900/50 px-1 rounded text-indigo-300">{`{time}`}</code> : Waktu saat absensi (HH:mm)</li>
                <li><code className="bg-indigo-900/50 px-1 rounded text-indigo-300">{`{location}`}</code> : Lokasi Geofence/Maps (Placeholder)</li>
                <li><code className="bg-indigo-900/50 px-1 rounded text-indigo-300">{`{duration}`}</code> : Durasi telat / lembur (HH:mm:ss)</li>
                <li><code className="bg-indigo-900/50 px-1 rounded text-indigo-300">{`{late_quota_left}`}</code> : Sisa kuota telat</li>
                <li><code className="bg-indigo-900/50 px-1 rounded text-indigo-300">{`{cmd_check_in}`}</code> : Perintah absen masuk</li>
                <li><code className="bg-indigo-900/50 px-1 rounded text-indigo-300">{`{cmd_check_out}`}</code> : Perintah absen pulang</li>
                <li><code className="bg-indigo-900/50 px-1 rounded text-indigo-300">{`{cmd_info}`}</code> : Perintah info</li>
              </ul>
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
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span> Perintah (Commands)
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Perintah Info</label>
                <input
                  type="text"
                  value={templates.commands.info}
                  onChange={(e) => setTemplates({ ...templates, commands: { ...templates.commands, info: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Perintah Lokasi</label>
                <input
                  type="text"
                  value={templates.commands.location}
                  onChange={(e) => setTemplates({ ...templates, commands: { ...templates.commands, location: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Perintah Izin/Libur</label>
                <input
                  type="text"
                  value={templates.commands.leave || '!izin'}
                  onChange={(e) => setTemplates({ ...templates, commands: { ...templates.commands, leave: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Perintah Batal Izin/Libur</label>
                <input
                  type="text"
                  value={templates.commands.cancel_leave || '!batal_izin'}
                  onChange={(e) => setTemplates({ ...templates, commands: { ...templates.commands, cancel_leave: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Custom Commands Section */}
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
              <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span> Custom Commands
            </h3>
            <div className="space-y-4">
              {templates.custom_commands?.map((cmd: any, index: number) => (
                <div key={index} className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                  <div className="flex gap-4 mb-2">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Perintah</label>
                      <input
                        type="text"
                        value={cmd.command}
                        onChange={(e) => {
                          const newCmds = [...templates.custom_commands];
                          newCmds[index].command = e.target.value;
                          setTemplates({ ...templates, custom_commands: newCmds });
                        }}
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                        placeholder="!halo"
                      />
                    </div>
                    <div className="flex-1 relative">
                       <button
                          onClick={() => {
                            const newCmds = templates.custom_commands.filter((_: any, i: number) => i !== index);
                            setTemplates({ ...templates, custom_commands: newCmds });
                          }}
                          className="absolute right-0 top-0 text-red-500 text-xs font-bold p-1"
                       >
                         Hapus
                       </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Balasan</label>
                    <textarea
                      value={cmd.reply}
                      onChange={(e) => {
                        const newCmds = [...templates.custom_commands];
                        newCmds[index].reply = e.target.value;
                        setTemplates({ ...templates, custom_commands: newCmds });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={2}
                      placeholder="Halo {name}!"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setTemplates({ ...templates, custom_commands: [...(templates.custom_commands || []), { command: '', reply: '' }] })}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
              >
                + Tambah Custom Command
              </button>
            </div>
          </div>

          {/* Replies Section */}
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center">
              <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span> Balasan Bot (Replies)
            </h3>
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
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Berhasil Absen Masuk (Telat)</label>
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
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Balasan Statistik (Info)</label>
                <textarea
                  value={templates.replies.info_stats || 'Halo {name}, berikut Estimasi pendapatan kamu sampai saat ini.\n{stats_breakdown}'}
                  onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, info_stats: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Belum Terdaftar</label>
                <textarea
                  value={templates.replies.not_registered}
                  onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, not_registered: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Perintah Tidak Dikenal</label>
                <textarea
                  value={templates.replies.unknown_command}
                  onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, unknown_command: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Sudah Absen Masuk</label>
                <textarea
                  value={templates.replies.already_checked_in}
                  onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, already_checked_in: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Sudah Absen Pulang</label>
                <textarea
                  value={templates.replies.already_checked_out}
                  onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, already_checked_out: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Belum Absen Masuk (Saat Pulang)</label>
                <textarea
                  value={templates.replies.not_checked_in || 'Halo {name}, anda belum melakukan absen masuk hari ini.'}
                  onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, not_checked_in: e.target.value } })}
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
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Sudah Mengajukan Izin/Libur</label>
                <textarea
                  value={templates.replies.already_on_leave || 'Halo {name}, anda sudah tercatat Izin/Libur hari ini.'}
                  onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, already_on_leave: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Batal Izin/Libur Berhasil</label>
                <textarea
                  value={templates.replies.cancel_leave_success || 'Halo {name}, Izin/Libur anda hari ini telah dibatalkan.'}
                  onChange={(e) => setTemplates({ ...templates, replies: { ...templates.replies, cancel_leave_success: e.target.value } })}
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
          
        </div>
      </div>
    </div>
  );
}
