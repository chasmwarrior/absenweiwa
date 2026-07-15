import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserPlus, Trash2 } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');
  const [newJobPosition, setNewJobPosition] = useState('');
  const [newWorkLocation, setNewWorkLocation] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, locRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/locations')
      ]);
      setUsers(usersRes.data);
      setLocations(locRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
       await axios.put(`/api/users/${editingUser.id}`, {
          name: editingUser.name,
          role: editingUser.role,
          job_position: editingUser.job_position,
          work_location_id: editingUser.work_location_id || null
       });
       setEditingUser(null);
       fetchData();
       alert('Data karyawan berhasil diupdate');
    } catch (err) {
       alert('Gagal mengupdate karyawan');
    }
  };

  const handleViewPreview = async (user: any) => {
    setSelectedUser(user);
    try {
      const res = await axios.get(`/api/users/${user.id}/stats`);
      setUserStats(res.data);
    } catch (err) {
      console.error(err);
      setUserStats(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', { 
        id: newUserId, 
        name: newUserName, 
        role: newUserRole,
        job_position: newJobPosition,
        work_location_id: newWorkLocation || null
      });
      setNewUserId('');
      setNewUserName('');
      setNewJobPosition('');
      setNewWorkLocation('');
      fetchData();
    } catch (err) {
      alert('Gagal menambahkan karyawan. Pastikan nomor belum terdaftar.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Yakin ingin menghapus karyawan ini?')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus karyawan');
    }
  };

  const handlePulangCepat = async (id: string) => {
    if (!confirm('Picu Pulang Cepat untuk karyawan ini? Karyawan akan menerima pesan untuk mengirimkan bukti.')) return;
    try {
      await axios.post(`/api/users/${id}/pulang-cepat`);
      alert('Berhasil mengirim permintaan pulang cepat');
    } catch (err) {
      alert('Gagal memicu pulang cepat');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h2 className="text-xs font-bold text-slate-400 uppercase">Tambah Karyawan Baru</h2>
        </div>
        <div className="p-4">
          <form onSubmit={handleAddUser} className="flex flex-col gap-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nomor WhatsApp (628...)</label>
                <input
                  type="text"
                  required
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="628123456789"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Budi Santoso"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Posisi Pekerjaan</label>
                <input
                  type="text"
                  value={newJobPosition}
                  onChange={(e) => setNewJobPosition(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Staff IT"
                />
              </div>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Lokasi Kerja</label>
                <select
                  value={newWorkLocation}
                  onChange={(e) => setNewWorkLocation(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="">(Tanpa Batasan Geofence)</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="w-40">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors h-8"
              >
                + ADD
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 mb-1">
          <h2 className="text-xs font-bold text-slate-400 uppercase">Daftar Karyawan</h2>
        </div>
        <div className="overflow-x-auto p-3 pt-0">
          <table className="w-full text-left text-[11px] text-slate-400">
            <thead className="text-slate-500 border-b border-slate-700 uppercase">
              <tr>
                <th className="px-2 py-2 font-bold">Nama</th>
                <th className="px-2 py-2 font-bold">Nomor WA</th>
                <th className="px-2 py-2 font-bold">Posisi</th>
                <th className="px-2 py-2 font-bold">Lokasi</th>
                <th className="px-2 py-2 font-bold">Role</th>
                <th className="px-2 py-2 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-2 py-2 font-bold text-slate-200">{user.name}</td>
                  <td className="px-2 py-2 font-mono text-indigo-300">{user.id}</td>
                  <td className="px-2 py-2">{user.job_position || '-'}</td>
                  <td className="px-2 py-2">{locations.find(l => l.id === user.work_location_id)?.name || 'Semua'}</td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      user.role === 'admin' ? 'bg-indigo-900/50 text-indigo-400 border border-indigo-500/30' : 'bg-slate-900/50 text-slate-300 border border-slate-500/30'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors mr-3 text-[10px] font-bold uppercase px-2 py-1 bg-indigo-900/30 rounded border border-indigo-500/30"
                      title="Edit Data"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handlePulangCepat(user.id)}
                      className="text-amber-500 hover:text-amber-400 transition-colors mr-3 text-[10px] font-bold uppercase px-2 py-1 bg-amber-900/30 rounded border border-amber-500/30"
                      title="Pulang Cepat (Manual)"
                    >
                      Pulang Cepat
                    </button>
                    <button
                      onClick={() => handleViewPreview(user)}
                      className="text-emerald-500 hover:text-emerald-400 transition-colors mr-3"
                      title="Live Pay Preview"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                      title="Hapus Karyawan"
                    >
                      <Trash2 className="w-4 h-4 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Pay Preview Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-sm font-bold text-slate-200">Live Pay Preview: {selectedUser.name}</h2>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-200">&times;</button>
            </div>
            <div className="p-4 space-y-4">
               {userStats ? (
                  <div className="space-y-3">
                     <div className="flex justify-between text-sm">
                       <span className="text-slate-400">Total Lembur (Bulan Ini)</span>
                       <span className="font-bold text-emerald-400">+ Rp {userStats.totalOvertime.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span className="text-slate-400">Total Bonus (Bulan Ini)</span>
                       <span className="font-bold text-emerald-400">+ Rp {userStats.totalBonus.toLocaleString()}</span>
                     </div>
                     
                     {userStats.breakdown && (
                       <div className="pl-4 space-y-1 mb-2">
                         <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>Harian (Tepat Waktu)</span>
                            <span className="font-mono text-emerald-500/80">+ Rp {userStats.breakdown.daily_bonuses.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>Disiplin 100% (Bulanan)</span>
                            <span className="font-mono text-emerald-500/80">+ Rp {userStats.breakdown.perfect_attendance.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>Kuota Libur Sisa</span>
                            <span className="font-mono text-emerald-500/80">+ Rp {userStats.breakdown.unused_holidays.toLocaleString()}</span>
                         </div>
                       </div>
                     )}

                     {userStats.bonusEligibility && (
                       <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 mt-2 mb-2">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-300 uppercase">Progress Bonus Disiplin</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${userStats.bonusEligibility.isEligible ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' : 'bg-red-900/50 text-red-400 border border-red-500/30'}`}>
                               {userStats.bonusEligibility.isEligible ? 'Eligible' : 'Not Eligible'}
                            </span>
                         </div>
                         <div className="space-y-1">
                           <div className="flex justify-between text-[10px] text-slate-400">
                             <span>Syarat: Tidak ada keterlambatan</span>
                             <span className={userStats.bonusEligibility.lateDays === 0 ? 'text-emerald-400' : 'text-red-400'}>
                               {userStats.bonusEligibility.lateDays === 0 ? 'Terpenuhi' : `Gagal (${userStats.bonusEligibility.lateDays} kali telat)`}
                             </span>
                           </div>
                           <div className="flex justify-between text-[10px] text-slate-400">
                             <span>Syarat: Tidak potong libur melebihi batas</span>
                             <span className={userStats.bonusEligibility.holidayDays === 0 ? 'text-emerald-400' : 'text-red-400'}>
                               {userStats.bonusEligibility.holidayDays === 0 ? 'Terpenuhi' : 'Gagal'}
                             </span>
                           </div>
                           <div className="flex justify-between text-[10px] text-slate-400">
                             <span>Syarat: Minimal 1 hari kehadiran</span>
                             <span className={userStats.bonusEligibility.totalAttendances > 0 ? 'text-emerald-400' : 'text-red-400'}>
                               {userStats.bonusEligibility.totalAttendances > 0 ? 'Terpenuhi' : 'Belum ada absensi'}
                             </span>
                           </div>
                         </div>
                       </div>
                     )}

                     <div className="flex justify-between text-sm">
                       <span className="text-slate-400">Total Denda (Bulan Ini)</span>
                       <span className="font-bold text-red-400">- Rp {userStats.totalPenalty.toLocaleString()}</span>
                     </div>
                     <div className="pt-3 border-t border-slate-700 flex justify-between text-base font-bold">
                       <span className="text-slate-200">Estimasi Tambahan/Potongan</span>
                       <span className={userStats.netAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                         {userStats.netAmount >= 0 ? '+' : '-'} Rp {Math.abs(userStats.netAmount).toLocaleString()}
                       </span>
                     </div>
                  </div>
               ) : (
                 <div className="text-center text-slate-400 py-4 text-sm">Memuat data...</div>
               )}
            </div>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-sm font-bold text-slate-200">Edit Karyawan: {editingUser.name}</h2>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-200">&times;</button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Posisi Pekerjaan</label>
                <input
                  type="text"
                  value={editingUser.job_position || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, job_position: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Lokasi Kerja</label>
                <select
                  value={editingUser.work_location_id || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, work_location_id: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="">(Tanpa Batasan Geofence)</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-bold transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
