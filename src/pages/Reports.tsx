import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileSpreadsheet, Download, Filter, BarChart2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import ErrorBoundary from '../components/ErrorBoundary';

export default function Reports() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [filterUser, setFilterUser] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attRes, usersRes] = await Promise.all([
        axios.get('/api/attendances'),
        axios.get('/api/users')
      ]);
      setAttendances(attRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    let filtered = attendances.filter(a => {
      const isDateInRange = a.date >= startDate && a.date <= endDate;
      return isDateInRange;
    });

    if (filterUser !== 'all') {
      filtered = filtered.filter(a => a.user_id === filterUser);
    }

    if (filterDept !== 'all') {
      const deptUserIds = users.filter(u => u.job_position === filterDept).map(u => u.id);
      filtered = filtered.filter(a => deptUserIds.includes(a.user_id));
    }

    const exportData = filtered.map(a => {
      const user = users.find(u => u.id === a.user_id);
      return {
        Tanggal: a.date,
        Nama: user?.name || 'Unknown',
        'Posisi / Dept': user?.job_position || '-',
        'Check In': a.check_in_time,
        'Check Out': a.check_out_time || '-',
        Lokasi: a.location_lat ? `https://maps.google.com/?q=${a.location_lat},${a.location_lng}` : '-',
        Status: a.status,
        Denda: a.penalty_amount,
        Lembur: a.overtime_amount,
        Bonus: a.bonus_amount,
        Approval: a.approval_status
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Absensi");
    XLSX.writeFile(wb, `Laporan_Absensi_${startDate}_to_${endDate}.xlsx`);
  };

  const departments = Array.from(new Set(users.map(u => u.job_position).filter(Boolean)));

  // Generate Chart Data
  const chartDataMap = new Map();
  attendances.forEach(a => {
      if (a.date >= startDate && a.date <= endDate) {
          const u = users.find(u => u.id === a.user_id);
          const dept = u?.job_position || 'Umum';
          
          if (!chartDataMap.has(dept)) {
              chartDataMap.set(dept, { dept, totalLate: 0, totalEarly: 0, totalBonus: 0 });
          }
          const item = chartDataMap.get(dept);
          if (a.status === 'late' || (a.penalty_amount && a.penalty_amount > 0)) item.totalLate++;
          if (a.notes && a.notes.includes('Pulang Cepat')) item.totalEarly++;
          if (a.bonus_amount && a.bonus_amount > 0) item.totalBonus += a.bonus_amount;
      }
  });
  const chartData = Array.from(chartDataMap.values());

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Chart Section */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 flex items-center border-b border-slate-700 bg-slate-900/50">
          <BarChart2 className="w-4 h-4 text-indigo-400 mr-2" />
          <h2 className="text-xs font-bold text-slate-400 uppercase">Ringkasan Statistik (Berdasarkan Departemen)</h2>
        </div>
        <div className="p-4 h-[300px] w-full">
           <ErrorBoundary>
           <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
             <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
               <XAxis dataKey="dept" stroke="#94a3b8" fontSize={12} />
               <YAxis yAxisId="left" orientation="left" stroke="#ef4444" fontSize={12} />
               <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
               <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} 
                  itemStyle={{ color: '#f1f5f9' }}
               />
               <Legend wrapperStyle={{ fontSize: '12px' }}/>
               <Bar yAxisId="left" dataKey="totalLate" name="Total Telat (Kali)" fill="#ef4444" radius={[4, 4, 0, 0]} />
               <Bar yAxisId="left" dataKey="totalEarly" name="Pulang Cepat (Kali)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
               <Bar yAxisId="right" dataKey="totalBonus" name="Total Bonus (Rp)" fill="#10b981" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
           </ErrorBoundary>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 flex items-center border-b border-slate-700 bg-slate-900/50">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400 mr-2" />
          <h2 className="text-xs font-bold text-slate-400 uppercase">Export Laporan</h2>
        </div>
        
        <div className="p-4 space-y-4">
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tanggal Mulai</label>
                 <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                 />
              </div>
              <div>
                 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tanggal Akhir</label>
                 <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                 />
              </div>
              <div>
                 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Karyawan</label>
                 <select
                    value={filterUser}
                    onChange={e => setFilterUser(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                 >
                    <option value="all">Semua Karyawan</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Bagian / Dept</label>
                 <select
                    value={filterDept}
                    onChange={e => setFilterDept(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-emerald-500 outline-none transition-colors"
                 >
                    <option value="all">Semua Bagian</option>
                    {departments.map(d => <option key={d as string} value={d as string}>{d}</option>)}
                 </select>
              </div>
           </div>

           <div className="flex justify-end pt-4 border-t border-slate-700">
              <button
                 onClick={handleExport}
                 className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors uppercase tracking-wider"
              >
                 <Download className="w-4 h-4 mr-2" />
                 Download Excel
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
