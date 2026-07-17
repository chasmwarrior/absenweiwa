import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, Check, X, CheckSquare, Square } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PendingActions() {
  const [pending, setPending] = useState<any[]>([]);
  const [phoneRequests, setPhoneRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAtt, setModalAtt] = useState<any>(null);
  const [modalAction, setModalAction] = useState<'approved'|'rejected'>('approved');
  const [modalData, setModalData] = useState({ notes: '', penalty_amount: 0, bonus_amount: 0, attendance_status: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attRes, usersRes, phoneRes] = await Promise.all([
        axios.get('/api/attendances'),
        axios.get('/api/users'),
        axios.get('/api/phone-requests')
      ]);
      setPending((Array.isArray(attRes.data) ? attRes.data : []).filter((a: any) => a.approval_status === 'pending'));
      setUsers(usersRes.data);
      setPhoneRequests((phoneRes.data || []).filter((r: any) => r.status === 'pending'));
      setSelectedIds(new Set());
    } catch (err) {
      if (err?.response?.status !== 429) console.error(err);
    }
  };

  
  const handlePhoneAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await axios.post(`/api/phone-requests/${id}`, { status: action });
      toast.success(`Pengajuan ganti nomor berhasil di-${action === 'approved' ? 'setujui' : 'tolak'}`);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal memproses pengajuan ganti nomor');
    }
  };

  const openModal = (att: any, action: 'approved' | 'rejected') => {
    setModalAtt(att);
    setModalAction(action);
    setModalData({
      notes: action === 'approved' ? 'Disetujui Admin' : 'Ditolak Admin',
      penalty_amount: att.penalty_amount || 0,
      bonus_amount: att.bonus_amount || 0,
      attendance_status: att.status || ''
    });
    setIsModalOpen(true);
  };

  const submitModalAction = async () => {
    if (!modalAtt) return;
    try {
      await axios.put(`/api/attendances/${modalAtt.id}/approval`, {
        status: modalAction,
        notes: modalData.notes,
        penalty_amount: Number(modalData.penalty_amount),
        bonus_amount: Number(modalData.bonus_amount),
        attendance_status: modalData.attendance_status
      });
      toast.success(`Absensi berhasil di-${modalAction === 'approved' ? 'setujui' : 'tolak'}`);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Gagal memproses aksi');
    }
  };

  const handleBulkAction = async (action: 'approved' | 'rejected') => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          axios.put(`/api/attendances/${id}/approval`, { status: action })
        )
      );
      toast.success(`${selectedIds.size} Absensi berhasil di-${action === 'approved' ? 'setujui' : 'tolak'}`);
      fetchData();
    } catch (err) {
      toast.error('Beberapa aksi gagal diproses');
      fetchData();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pending.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pending.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-amber-500 mr-2" />
            <h2 className="text-xs font-bold text-slate-400 uppercase">Persetujuan Absensi (Pending Actions)</h2>
          </div>
          {pending.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('approved')}
                disabled={selectedIds.size === 0}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${selectedIds.size > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              >
                Setujui Terpilih ({selectedIds.size})
              </button>
              <button
                onClick={() => handleBulkAction('rejected')}
                disabled={selectedIds.size === 0}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${selectedIds.size > 0 ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              >
                Tolak Terpilih ({selectedIds.size})
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 space-y-4">
          {pending.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">
              Tidak ada aksi yang menunggu persetujuan.
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="flex items-center space-x-3 px-2">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-200">
                  {selectedIds.size === pending.length ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
                <span className="text-xs text-slate-400 font-bold uppercase">Pilih Semua</span>
              </div>
              {pending.map((att) => {
                const user = users.find(u => u.id === att.user_id);
                return (
                  <div key={att.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-start space-x-4">
                      <button onClick={() => toggleSelect(att.id)} className="mt-1 text-slate-400 hover:text-slate-200">
                        {selectedIds.has(att.id) ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5" />}
                      </button>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-200">{user?.name}</span>
                          <span className="text-xs text-slate-500 font-mono">{att.date}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                           {att.check_in_time && `Masuk: ${att.check_in_time}`}
                           {att.check_out_time && ` | Pulang: ${att.check_out_time}`}
                        </div>
                        <div className="mt-2 text-[10px] uppercase font-bold text-amber-400">
                           Perlu Persetujuan (Geofence / Waktu)
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(att, 'approved')}
                        className="p-2 bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800/50 rounded transition-colors"
                        title="Setujui"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal(att, 'rejected')}
                        className="p-2 bg-rose-900/50 text-rose-400 hover:bg-rose-800/50 rounded transition-colors"
                        title="Tolak"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Phone Requests Section */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mt-4">
        <div className="px-4 py-3 flex justify-between items-center border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-blue-500 mr-2" />
            <h2 className="text-xs font-bold text-slate-400 uppercase">Persetujuan Ganti Nomor (Pending Actions)</h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {phoneRequests.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">
              Tidak ada pengajuan ganti nomor yang menunggu persetujuan.
            </div>
          ) : (
            <div className="grid gap-4">
              {phoneRequests.map((req) => (
                <div key={req.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-start space-x-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200">{req.user_name || req.user_id}</span>
                        <span className="text-xs text-slate-500 font-mono">{new Date(req.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        Nomor Lama: <span className="text-slate-300 font-mono">{req.user_id}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        Nomor Baru: <span className="text-emerald-400 font-mono font-bold">{req.new_number}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePhoneAction(req.id, 'approved')}
                      className="p-2 bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800/50 rounded transition-colors"
                      title="Setujui"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePhoneAction(req.id, 'rejected')}
                      className="p-2 bg-rose-900/50 text-rose-400 hover:bg-rose-800/50 rounded transition-colors"
                      title="Tolak"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {isModalOpen && modalAtt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-md w-full border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Konfirmasi {modalAction === 'approved' ? 'Persetujuan' : 'Penolakan'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status Kehadiran</label>
                <select
                  value={modalData.attendance_status}
                  onChange={e => setModalData({...modalData, attendance_status: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="on_time">Tepat Waktu (on_time)</option>
                  <option value="late">Telat (late)</option>
                  <option value="early_leave">Pulang Cepat (early_leave)</option>
                  <option value="holiday">Izin/Libur (holiday)</option>
                  <option value="absent">Alpha (absent)</option>
                  <option value="overtime">Lembur (overtime)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Potongan/Denda (Rp)</label>
                <input type="number"
                  value={modalData.penalty_amount}
                  onChange={e => setModalData({...modalData, penalty_amount: Number(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Bonus (Rp)</label>
                <input type="number"
                  value={modalData.bonus_amount}
                  onChange={e => setModalData({...modalData, bonus_amount: Number(e.target.value)})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Catatan Admin (Balasan Sistem)</label>
                <textarea
                  value={modalData.notes}
                  onChange={e => setModalData({...modalData, notes: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">Batal</button>
                <button onClick={submitModalAction} className={`px-4 py-2 ${modalAction === 'approved' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'} text-white rounded-lg text-sm font-medium transition-colors`}>
                  Simpan Keputusan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
