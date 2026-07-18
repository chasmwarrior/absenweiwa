import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, subMonths, addMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export default function EmployeeStats() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [pin, setPin] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    checkPinStatus();
  }, [id]);

  useEffect(() => {
    if (isPinVerified) {
        fetchData();
    }
  }, [currentDate, isPinVerified]);

  const checkPinStatus = async () => {
      try {
          // Verify with empty pin to check if setup is needed
          const res = await axios.post(`/api/stats-page/${id}/verify-pin`, { pin: '' });
          if (res.data.needsSetup) {
              setNeedsSetup(true);
              setLoading(false);
          }
      } catch (err) {
          setLoading(false); // Likely means pin is set and requires actual verification
      }
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setPinError('');
      setLoading(true);
      try {
          if (needsSetup) {
              await axios.post(`/api/stats-page/${id}/setup-pin`, { pin: inputPin });
              setNeedsSetup(false);
          } else {
              await axios.post(`/api/stats-page/${id}/verify-pin`, { pin: inputPin });
          }
          setPin(inputPin);
          setIsPinVerified(true);
      } catch (err: any) {
          setPinError(err.response?.data?.error || 'PIN Salah');
      } finally {
          setLoading(false);
      }
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/stats-page/${id}?month=${format(currentDate, 'yyyy-MM')}&pin=${pin}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Memuat Data...</div>;
  }

  if (!data || !data.user) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">Data karyawan tidak ditemukan.</div>;
  }

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const startingDayIndex = getDay(startDate);

  // Map attendances by date
  const attendancesMap = new Map();
  data.attendances.forEach((a: any) => {
    attendancesMap.set(a.date, a);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center shadow-lg">
          <div className="w-16 h-16 bg-indigo-900/50 text-indigo-400 flex items-center justify-center rounded-full mx-auto mb-3 text-2xl font-bold border border-indigo-500/30">
            {data.user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-slate-100">{data.user.name}</h1>
          <p className="text-slate-400 text-sm font-mono mt-1">{data.user.id}</p>
          {data.user.job_position && <span className="inline-block mt-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-bold text-slate-300">{data.user.job_position}</span>}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
             <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Kehadiran</div>
             <div className="text-2xl font-bold text-emerald-400">{data.summary.present}</div>
           </div>
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
             <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Telat</div>
             <div className="text-2xl font-bold text-amber-400">{data.summary.late}</div>
           </div>
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
             <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Izin/Libur</div>
             <div className="text-2xl font-bold text-blue-400">{data.summary.holiday}</div>
           </div>
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
             <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Pulang Cepat</div>
             <div className="text-2xl font-bold text-orange-400">{data.summary.early_leave}</div>
           </div>
        </div>

        {/* Calendar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold uppercase text-slate-300 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
              Kalender Aktivitas
            </h2>
            <div className="flex space-x-2">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-800 rounded transition-colors"><ChevronLeft className="w-5 h-5 text-slate-400"/></button>
              <span className="font-bold text-slate-200 text-sm px-2 py-1">{format(currentDate, 'MMMM yyyy', { locale: idLocale })}</span>
              <button onClick={handleNextMonth} className="p-1 hover:bg-slate-800 rounded transition-colors"><ChevronRight className="w-5 h-5 text-slate-400"/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="text-[10px] font-bold text-slate-500 uppercase py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const att = attendancesMap.get(dateStr);
              let bgColor = 'bg-slate-800/50 text-slate-400';
              let ring = '';

              if (att) {
                if (att.status === 'on_time') { bgColor = 'bg-emerald-900/50 text-emerald-400'; ring = 'ring-1 ring-emerald-500/30'; }
                if (att.status === 'late') { bgColor = 'bg-amber-900/50 text-amber-400'; ring = 'ring-1 ring-amber-500/30'; }
                if (att.status === 'holiday') { bgColor = 'bg-blue-900/50 text-blue-400'; ring = 'ring-1 ring-blue-500/30'; }
                if (att.notes?.includes('Pulang Cepat')) { bgColor = 'bg-orange-900/50 text-orange-400'; ring = 'ring-1 ring-orange-500/30'; }
                if (att.approval_status === 'pending' || att.approval_status === 'rejected') {
                  bgColor = 'bg-red-900/50 text-red-400'; ring = 'ring-1 ring-red-500/30';
                }
              }

              return (
                <div key={dateStr} className={`p-2 rounded-lg text-sm font-bold flex flex-col items-center justify-center ${bgColor} ${ring}`}>
                  <span>{format(day, 'd')}</span>
                  {att && <div className="w-1 h-1 rounded-full bg-current mt-1"></div>}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-3 text-[10px] justify-center font-bold text-slate-400 uppercase">
             <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span> Tepat Waktu</div>
             <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span> Telat</div>
             <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span> Izin/Libur</div>
             <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-1"></span> Pulang Cepat</div>
             <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Pending/Ditolak</div>
          </div>
        </div>

        {/* Detailed Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
           <h2 className="text-sm font-bold uppercase text-slate-300 mb-4 flex items-center">
             <Clock className="w-4 h-4 mr-2 text-indigo-400" />
             Log Aktivitas ({format(currentDate, 'MMMM yyyy', { locale: idLocale })})
           </h2>
           <div className="space-y-3">
              {data.attendances.length === 0 ? (
                 <div className="text-center py-6 text-slate-500 text-sm">Tidak ada catatan absen di bulan ini.</div>
              ) : (
                data.attendances.map((att: any) => (
                   <div key={att.id} className="border border-slate-800 bg-slate-950/50 rounded-lg p-3">
                     <div className="flex justify-between items-start mb-2">
                       <span className="text-sm font-bold text-slate-200">{format(new Date(att.date), 'EEEE, dd MMM yyyy', { locale: idLocale })}</span>
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          att.status === 'on_time' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                          att.status === 'late' ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' :
                          'bg-blue-900/30 text-blue-400 border-blue-500/30'
                       }`}>
                         {att.status === 'holiday' ? 'Izin/Libur' : att.status === 'late' ? 'Terlambat' : 'Tepat Waktu'}
                       </span>
                     </div>
                     <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-400">
                          <span className="block text-[9px] uppercase mb-0.5 font-bold">Check-In</span>
                          <span className="text-slate-200 font-mono">{att.check_in_time || '-'}</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-400">
                          <span className="block text-[9px] uppercase mb-0.5 font-bold">Check-Out</span>
                          <span className="text-slate-200 font-mono">{att.check_out_time || '-'}</span>
                        </div>
                     </div>
                     
                     {(att.notes || att.penalty_amount > 0 || att.overtime_amount > 0) && (
                        <div className="mt-2 pt-2 border-t border-slate-800 text-xs space-y-1">
                           {att.notes && <p className="text-slate-400"><span className="font-bold">Catatan:</span> {att.notes}</p>}
                           {att.penalty_amount > 0 && <p className="text-red-400"><span className="font-bold">Denda Telat:</span> Rp {att.penalty_amount.toLocaleString()}</p>}
                           {att.overtime_amount > 0 && <p className="text-emerald-400"><span className="font-bold">Lembur:</span> Rp {att.overtime_amount.toLocaleString()}</p>}
                           {att.approval_status !== 'approved' && <p className="text-amber-400"><span className="font-bold">Status Persetujuan:</span> {att.approval_status.toUpperCase()}</p>}
                        </div>
                     )}
                   </div>
                ))
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
