import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Activity, Search } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = logs.filter(log => log.details.toLowerCase().includes(search.toLowerCase()) || log.action.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-200 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-indigo-400" />
          Log Aktivitas Sistem
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:border-indigo-500 outline-none w-64"
          />
        </div>
      </div>

      <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-xs uppercase text-slate-400">
                <th className="p-3">Waktu</th>
                <th className="p-3">Aksi</th>
                <th className="p-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-750 text-sm text-slate-300">
                  <td className="p-3 whitespace-nowrap">{format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss')}</td>
                  <td className="p-3 font-mono text-xs">
                    <span className="px-2 py-1 bg-slate-900 rounded text-indigo-400 border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3">{log.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">
                    Belum ada catatan aktivitas.
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
