import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DashboardChart({ attendances }: { attendances: any[] }) {
  const data = useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map((date) => {
      const dayAtts = attendances.filter((a) => a.date === date);
      const onTime = dayAtts.filter((a) => a.status === 'on_time').length;
      const late = dayAtts.filter((a) => a.status === 'late').length;
      const other = dayAtts.length - onTime - late;
      return {
        date: date.substring(5), // MM-DD
        'Tepat Waktu': onTime,
        'Terlambat': late,
        'Lainnya': other
      };
    });
  }, [attendances]);

  return (
    <div className="h-64 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px' }}
            itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
            labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar dataKey="Tepat Waktu" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
          <Bar dataKey="Terlambat" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Lainnya" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
