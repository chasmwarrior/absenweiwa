import React, { useState } from 'react';
import axios from 'axios';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { id, password });
      login(res.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-lg mb-4 text-white">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-200">Admin Login</h2>
          <p className="text-sm text-slate-400 mt-1">Sistem Absensi Bot WhatsApp</p>
        </div>
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-900/50 text-red-400 border border-red-500/30 rounded text-sm text-center">{error}</div>}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Nomor WhatsApp (Admin)</label>
            <input
              type="text"
              required
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:border-indigo-500 outline-none transition-colors"
              placeholder="628123456789"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:border-indigo-500 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition-colors uppercase text-sm tracking-wide mt-2"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
