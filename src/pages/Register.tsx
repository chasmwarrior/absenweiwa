import React from 'react';
import { Phone, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden relative text-center">
        <div className="p-8 space-y-6">
          <div className="mx-auto w-16 h-16 bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/30">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-200">Pendaftaran Karyawan</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Untuk melakukan pendaftaran ke sistem absensi, silakan hubungi <b>Admin atau HRD</b> di perusahaan Anda.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            Sistem kami terintegrasi secara internal dan pendaftaran hanya dapat dilakukan melalui panel Admin.
          </p>
          <Link to="/login" className="inline-block mt-4 text-sm font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wide">
            Login Admin &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
