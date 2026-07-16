import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, Check, X, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function PendingActions() {
  const [pending, setPending] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attRes, usersRes] = await Promise.all([
        axios.get('/api/attendances'),
        axios.get('/api/users')
      ]);
      setPending((Array.isArray(attRes.data) ? attRes.data : []).filter((a: any) => a.approval_status === 'pending'));
      setUsers(usersRes.data);
      setSelectedIds(new Set());
    } catch (err) {
      if (err?.response?.status !== 429) console.error(err);
    }
  };

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await axios.put(`/api/attendances/${id}/approval`, { status: action });
      toast.success(`Absensi berhasil di-${action === 'approved' ? 'setujui' : 'tolak'}`);
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
    <div className="space-y-4 max-w-5xl">
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
                        onClick={() => handleAction(att.id, 'approved')}
                        className="p-2 bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800/50 rounded transition-colors"
                        title="Setujui"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction(att.id, 'rejected')}
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
    </div>
  );
}
