import React, { useState } from 'react';
import axios from 'axios';
import { Phone, ArrowRight, ShieldCheck, PhoneForwarded } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ChangeNumber() {
  const [oldNumber, setOldNumber] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post('/api/phone-requests', {
        old_number: oldNumber.replace(/[^0-9]/g, ''),
        new_number: newNumber.replace(/[^0-9]/g, '')
      });
      setSuccess(res.data.message || 'Pengajuan ganti nomor berhasil dikirim dan menunggu persetujuan Admin.');
      setOldNumber('');
      setNewNumber('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden relative">
        <div className="p-6 border-b border-slate-700 text-center bg-slate-900/50">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-900/50 rounded-full mb-4 text-indigo-400 border border-indigo-500/30">
            <PhoneForwarded className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-200">Ganti Nomor WhatsApp</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Ajukan pergantian nomor WhatsApp yang terdaftar pada sistem absensi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-900/50 text-rose-400 border border-rose-500/30 rounded text-sm text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 rounded text-sm flex flex-col items-center text-center">
              <ShieldCheck className="w-8 h-8 mb-2" />
              {success}
            </div>
          )}

          {!success && (
            <>
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-2 flex items-center">
                  <Phone className="w-3 h-3 mr-2" />
                  Nomor WhatsApp Lama
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">+62</span>
                  <input
                    type="text"
                    required
                    value={oldNumber}
                    onChange={(e) => setOldNumber(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors font-mono"
                    placeholder="81234567890"
                  />
                </div>
              </div>
              
              <div className="flex justify-center py-2">
                <ArrowRight className="w-5 h-5 text-slate-600 rotate-90 sm:rotate-0" />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-2 flex items-center">
                  <Phone className="w-3 h-3 mr-2 text-indigo-400" />
                  Nomor WhatsApp Baru
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">+62</span>
                  <input
                    type="text"
                    required
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors font-mono font-bold"
                    placeholder="89876543210"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-bold transition-colors uppercase text-sm tracking-wide mt-4 flex justify-center items-center"
              >
                {loading ? 'Memproses...' : 'Ajukan Ganti Nomor'}
              </button>
            </>
          )}
        </form>
        
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50 flex justify-center">
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300 uppercase font-bold tracking-wide transition-colors">
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
