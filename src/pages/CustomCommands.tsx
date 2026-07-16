import React, { useEffect, useState } from 'react';
import { Terminal, Save, Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function CustomCommands() {
  const [templates, setTemplates] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/bot-templates');
      const data = response.data;
      if (!data.custom_commands) data.custom_commands = [];
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Gagal memuat template bot');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/bot-templates', templates);
      toast.success('Pengaturan Custom Commands berhasil disimpan');
    } catch (error) {
      console.error('Failed to save templates:', error);
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  const handleAddCommand = () => {
    setTemplates({
      ...templates,
      custom_commands: [
        ...(templates.custom_commands || []),
        { command: '', reply: '', isActive: true }
      ]
    });
  };

  const handleToggleActive = (index: number) => {
    const newCmds = [...templates.custom_commands];
    newCmds[index].isActive = newCmds[index].isActive === false ? true : false;
    setTemplates({ ...templates, custom_commands: newCmds });
  };

  const handleDeleteCommand = (index: number) => {
    const newCmds = templates.custom_commands.filter((_: any, i: number) => i !== index);
    setTemplates({ ...templates, custom_commands: newCmds });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-emerald-500" />
            Custom Commands
          </h2>
          <p className="text-slate-400 text-sm mt-1">Kelola perintah kustom untuk bot WhatsApp</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          Simpan Perubahan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Daftar Command</h3>
              <button
                onClick={handleAddCommand}
                className="flex items-center text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah
              </button>
            </div>
            
            <div className="space-y-4">
              {templates.custom_commands?.map((cmd: any, index: number) => (
                <div key={index} className={`bg-slate-900 p-4 rounded-lg border \${cmd.isActive === false ? 'border-red-500/50 opacity-60' : 'border-slate-600'}`}>
                  <div className="flex flex-col md:flex-row gap-4 mb-3">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Trigger Command</label>
                      <input
                        type="text"
                        value={cmd.command}
                        onChange={(e) => {
                          const newCmds = [...templates.custom_commands];
                          newCmds[index].command = e.target.value;
                          setTemplates({ ...templates, custom_commands: newCmds });
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors font-mono"
                        placeholder="!halo"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                       <button
                          onClick={() => handleToggleActive(index)}
                          className={`flex items-center px-3 py-2 rounded text-xs font-bold transition-colors \${cmd.isActive === false ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                       >
                         {cmd.isActive === false ? <><XCircle className="w-3.5 h-3.5 mr-1"/> Nonaktif</> : <><CheckCircle className="w-3.5 h-3.5 mr-1"/> Aktif</>}
                       </button>
                       <button
                          onClick={() => handleDeleteCommand(index)}
                          className="flex items-center px-3 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded text-xs font-bold transition-colors"
                       >
                         <Trash2 className="w-3.5 h-3.5 mr-1"/> Hapus
                       </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Balasan Bot</label>
                    <textarea
                      value={cmd.reply}
                      onChange={(e) => {
                        const newCmds = [...templates.custom_commands];
                        newCmds[index].reply = e.target.value;
                        setTemplates({ ...templates, custom_commands: newCmds });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                      rows={3}
                      placeholder="Halo {name}, ada yang bisa dibantu?"
                    />
                  </div>
                </div>
              ))}
              
              {(!templates.custom_commands || templates.custom_commands.length === 0) && (
                <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
                  Belum ada custom commands. Klik "Tambah" untuk membuat perintah baru.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 h-fit sticky top-6">
          <h3 className="text-sm font-bold text-white mb-4">Panduan Variabel Pesan</h3>
          <p className="text-slate-400 text-xs mb-4">
            Gunakan variabel berikut pada teks balasan. Sistem akan otomatis menggantinya dengan data yang sesuai.
          </p>
          <div className="space-y-3">
            {[
              { key: '{name}', desc: 'Nama lengkap karyawan' },
              { key: '{time}', desc: 'Waktu saat absensi (HH:mm)' },
              { key: '{date}', desc: 'Tanggal saat absensi (YYYY-MM-DD)' },
              { key: '{location}', desc: 'URL Google Maps atau label lokasi' },
              { key: '{duration}', desc: 'Durasi keterlambatan atau lembur (HH:mm:ss)' },
              { key: '{late_quota_left}', desc: 'Sisa hari kuota telat' },
              { key: '{leave_quota_left}', desc: 'Sisa hari kuota libur/cuti' },
              { key: '{early_leave_quota_left}', desc: 'Sisa hari kuota pulang cepat' },
              { key: '{emergency_late_quota_left}', desc: 'Sisa hari kuota telat darurat' },
              { key: '{cmd_check_in}', desc: 'Perintah absen masuk yang aktif' },
              { key: '{cmd_check_out}', desc: 'Perintah absen pulang yang aktif' },
              { key: '{cmd_info}', desc: 'Perintah cek info / statistik' },
              { key: '{stats_breakdown}', desc: 'Detail rincian statistik (Hanya untuk balasan perintah info)' },
              { key: '{statusName}', desc: 'Nama status absensi (Hanya untuk balasan persetujuan)' },
              { key: '{notes}', desc: 'Catatan admin (Hanya untuk balasan persetujuan)' },
            ].map((v) => (
              <div key={v.key} className="bg-slate-900/50 p-2.5 rounded border border-slate-700/50 flex flex-col gap-1">
                <code className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded w-fit">{v.key}</code>
                <span className="text-xs text-slate-300">{v.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

