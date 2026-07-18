import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Terminal, Bot, Save, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ActiveCommands() {
  const [commands, setCommands] = useState<any>(null);
  const [replies, setReplies] = useState<any>(null);
  const [customCommands, setCustomCommands] = useState<any[]>([]);
  const [templatesData, setTemplatesData] = useState<any>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get('/api/bot-templates');
        if (response.data) {
          setTemplatesData(response.data);
          setCommands(response.data.commands || {});
          setReplies(response.data.replies || {});
          setCustomCommands(response.data.custom_commands || []);
        }
      } catch (err) {
        toast.error('Gagal memuat perintah aktif');
      }
    };
    fetchTemplates();
  }, []);


  const handleSaveReplies = async () => {
    try {
      const updatedTemplates = { ...templatesData, replies };
      await axios.post('/api/bot-templates', updatedTemplates);
      toast.success('Pesan balasan berhasil disimpan');
      setTemplatesData(updatedTemplates);
    } catch (err) {
      toast.error('Gagal menyimpan pesan balasan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Bot className="w-6 h-6 mr-2 text-blue-400" />
            Perintah & Pesan Aktif
          </h1>
          <p className="text-slate-400 text-sm mt-1">Lihat semua perintah aktif yang didukung oleh sistem WhatsApp.</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Terminal className="w-5 h-5 mr-2 text-indigo-400" />
            Perintah Utama (Bawaan)
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Absen Masuk</p>
              <p className="text-lg font-mono text-emerald-400">{commands?.check_in || '!hadir'} <span className="text-sm text-slate-500 ml-2">(alias: msk, masuk, in, hadir)</span></p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Absen Pulang</p>
              <p className="text-lg font-mono text-rose-400">{commands?.check_out || '!pulang'} <span className="text-sm text-slate-500 ml-2">(alias: out, pulang, keluar, plng)</span></p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Izin/Libur</p>
              <p className="text-lg font-mono text-amber-400">{commands?.leave || '!libur'} <span className="text-sm text-slate-500 ml-2">(alias: off, libur, cuti, lbr)</span></p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Batal Libur</p>
              <p className="text-lg font-mono text-purple-400">{commands?.cancel_leave || '!batal_izin'}</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Info & Statistik</p>
              <p className="text-lg font-mono text-blue-400">{commands?.info || '!info'} <span className="text-sm text-slate-500 ml-2">(alias: info, statistik)</span></p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Bantuan</p>
              <p className="text-lg font-mono text-cyan-400">{commands?.help || '!help'} <span className="text-sm text-slate-500 ml-2">(alias: help)</span></p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Absen Telat</p>
              <p className="text-lg font-mono text-orange-400">telat [alasan]</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Ganti Nomor</p>
              <p className="text-lg font-mono text-pink-400">gantinomer 628xxx</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">*Catatan: Tanda seru (!) di depan perintah bersifat opsional.</p>
        </div>
      </div>

      {customCommands.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <Terminal className="w-5 h-5 mr-2 text-emerald-400" />
              Perintah Kustom
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {customCommands.map((cmd, index) => (
                <div key={index} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <p className="text-lg font-mono text-emerald-400 mb-1">{cmd.command}</p>
                    <div className="text-sm text-slate-300 bg-slate-800 p-2 rounded border border-slate-700 mt-2">
                        {cmd.reply}
                    </div>
                  </div>
                  <div>
                     <span className={`px-2 py-1 text-xs font-medium rounded-full \${cmd.isActive ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                        {cmd.isActive ? 'Aktif' : 'Nonaktif'}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {replies && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
              Pesan Balasan Sistem (Editable)
            </h2>
            <button
              onClick={handleSaveReplies}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors flex items-center text-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(replies).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <textarea
                    value={replies[key]}
                    onChange={(e) => setReplies({ ...replies, [key]: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 min-h-[100px]"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">*Gunakan variabel {'{name}'}, {'{time}'}, {'{duration}'}, {'{late_quota_left}'} di dalam teks jika diperlukan.</p>
          </div>
        </div>
      )}
    </div>
  );
}
