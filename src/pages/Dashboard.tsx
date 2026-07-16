import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Clock, Download, RefreshCw, Power, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

import DashboardChart from '../components/DashboardChart';
import ErrorBoundary from '../components/ErrorBoundary';
export default function Dashboard() {
  const [attendances, setAttendances] = useState([]);
  const [users, setUsers] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshInterval = useRef<any>(null);

  const [sysStatus, setSysStatus] = useState<any>({ wa: 'checking', db: 'checking' });

  useEffect(() => {
    fetchData();
    checkDiagnostics();
  }, []);

  
  const checkDiagnostics = async () => {
    try {
      const waRes = await axios.get('/api/bot/status').catch(() => ({ data: { status: 'error' } }));
      
      setSysStatus({
        wa: waRes.data.status,
        db: 'ok'
      });
    } catch (e) {
      setSysStatus({ wa: 'error', db: 'error' });
    }
  };

  const initialMount = useRef(true);
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(fetchData, 30000);
      if (!initialMount.current) {
        toast.success('Auto-refresh diaktifkan', { id: 'autorefresh-toast', duration: 2000 });
      }
    } else {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
      if (!initialMount.current) {
        toast('Auto-refresh dinonaktifkan', { id: 'autorefresh-toast', duration: 2000, icon: <Power className="w-4 h-4 text-slate-400" /> });
      }
    }
    initialMount.current = false;
    return () => clearInterval(autoRefreshInterval.current);
  }, [autoRefresh]);

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

  const getUserName = (id: string) => {
    return users.find((u) => u.id === id)?.name || id;
  };

  const exportToCSV = () => {
    const recent = attendances.slice(0, 10);
    const headers = ['Nama Karyawan', 'Tanggal', 'Masuk', 'Pulang', 'Status', 'Persetujuan', 'Lokasi'];
    const rows = recent.map((att: any) => [
      getUserName(att.user_id),
      att.date,
      att.check_in_time || '-',
      att.check_out_time || '-',
      att.status,
      att.approval_status,
      att.location_lat ? `${att.location_lat},${att.location_lng}` : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `recent_activity_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* System Setup / Diagnostics Panel */}
      {(sysStatus.wa !== 'open') && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-5">
          <div className="flex items-start">
             <div className="flex-shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5 text-amber-500" />
             </div>
             <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">System Setup Required</h3>
                <p className="text-xs text-amber-500/80 mt-1 mb-3">Beberapa service backend belum siap. Ikuti panduan konfigurasi berikut untuk memulai.</p>
                
                <div className="space-y-3">
                   
                   <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-700/50">
                      <div className="flex items-center">
                         <div className={`w-2 h-2 rounded-full mr-3 ${sysStatus.wa === 'open' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
                         <div>
                            <div className="text-xs font-bold text-slate-200 uppercase">1. WhatsApp Bot Session</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{sysStatus.wa === 'open' ? 'Sesi WhatsApp aktif.' : 'Bot belum di-scan atau sesi terputus.'}</div>
                         </div>
                      </div>
                      {sysStatus.wa !== 'open' && (
                         <button onClick={() => window.location.href='/settings'} className="text-[10px] uppercase font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition-colors">
                            Scan QR
                         </button>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Karyawan</div>
          <div className="text-2xl font-bold text-slate-200 mt-1">{users.length}</div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Hadir Hari Ini</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {attendances.filter((a: any) => a.date === new Date().toISOString().split('T')[0] && a.check_in_time).length}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Menunggu Persetujuan</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
             {attendances.filter((a: any) => a.approval_status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase">Statistik Kehadiran 7 Hari Terakhir</h2>
        <ErrorBoundary><DashboardChart attendances={attendances} /></ErrorBoundary>
      </div>

      {/* Recent Attendances */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-400 uppercase">Riwayat Absensi Terakhir</h2>
          <div className="flex space-x-3 items-center">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center text-[10px] font-bold uppercase transition-colors px-2 py-1 rounded ${autoRefresh ? 'bg-indigo-900/50 text-indigo-400 border border-indigo-500/30' : 'bg-slate-700 text-slate-400'}`}
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center text-[10px] font-bold uppercase bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded transition-colors"
            >
              <Download className="w-3 h-3 mr-1.5" />
              CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto p-3">
          <table className="w-full text-left text-[11px] text-slate-400">
            <thead className="text-slate-500 border-b border-slate-700 uppercase">
              <tr>
                <th className="px-2 py-2 font-bold">Karyawan</th>
                <th className="px-2 py-2 font-bold">Tanggal</th>
                <th className="px-2 py-2 font-bold">Masuk</th>
                <th className="px-2 py-2 font-bold">Pulang</th>
                <th className="px-2 py-2 font-bold">Lokasi</th>
                <th className="px-2 py-2 font-bold">Status</th>
                <th className="px-2 py-2 font-bold">Persetujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {attendances.slice(0, 10).map((att: any) => (
                <tr key={att.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-2 py-2 font-bold text-slate-200">{getUserName(att.user_id)}</td>
                  <td className="px-2 py-2">{att.date}</td>
                  <td className="px-2 py-2 font-mono text-indigo-300">{att.check_in_time || '-'}</td>
                  <td className="px-2 py-2 font-mono text-indigo-300">{att.check_out_time || '-'}</td>
                  <td className="px-2 py-2">
                    {att.location_lat && att.location_lng ? (
                      <a
                        href={`https://maps.google.com/?q=${att.location_lat},${att.location_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Buka Maps
                      </a>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      att.status === 'on_time' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' :
                      att.status === 'late' ? 'bg-red-900/50 text-red-400 border border-red-500/30' :
                      'bg-slate-900/50 text-slate-300 border border-slate-500/30'
                    }`}>
                      {att.status === 'on_time' ? 'Tepat Waktu' : att.status === 'late' ? 'Terlambat' : att.status}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                     <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      att.approval_status === 'approved' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' :
                      att.approval_status === 'rejected' ? 'bg-red-900/50 text-red-400 border border-red-500/30' :
                      'bg-indigo-900/50 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {att.approval_status === 'approved' ? 'Disetujui' : att.approval_status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                    </span>
                  </td>
                </tr>
              ))}
              {attendances.length === 0 && (
                 <tr>
                    <td colSpan={7} className="px-2 py-8 text-center text-slate-500">
                       Belum ada data absensi
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
