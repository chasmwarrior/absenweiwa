import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Settings, LayoutDashboard, Clock, MapPin, MessageSquare, LogOut, FileSpreadsheet, AlertCircle, Menu, X, Terminal, Activity } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
  const { logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branding, setBranding] = useState({ app_name: 'AbsensiBot', logo_url: '' });
  const lastPendingIds = useRef<string[]>([]);

  const loadBranding = async () => {
    try {
       const res = await axios.get('/api/settings');
       if (res.data && res.data.branding) {
          setBranding({
             app_name: res.data.branding.app_name || 'AbsensiBot',
             logo_url: res.data.branding.logo_url || ''
          });
       }
    } catch (err) {
       console.error("Failed to load branding", err);
    }
  };

  useEffect(() => {
    loadBranding();
    const handleBrandingUpdated = () => {
       loadBranding();
    };
    window.addEventListener('branding-updated', handleBrandingUpdated);
    return () => window.removeEventListener('branding-updated', handleBrandingUpdated);
  }, []);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const res = await axios.get('/api/attendances');
        const pending = (Array.isArray(res.data) ? res.data : []).filter((a: any) => a.approval_status === 'pending');
        setPendingCount(pending.length);
        
        const currentIds = pending.map((a: any) => a.id);
        const newIds = currentIds.filter((id: string) => !lastPendingIds.current.includes(id));
        
        if (lastPendingIds.current.length > 0 && newIds.length > 0) {
          toast.custom((t) => (
             <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-slate-700`}>
               <div className="flex-1 w-0 p-4">
                 <div className="flex items-start">
                   <div className="flex-shrink-0 pt-0.5">
                     <AlertCircle className="h-6 w-6 text-amber-500" />
                   </div>
                   <div className="ml-3 flex-1">
                     <p className="text-sm font-bold text-slate-200">
                       Notifikasi Baru
                     </p>
                     <p className="mt-1 text-sm text-slate-400">
                       Terdapat {newIds.length} aksi absensi baru yang memerlukan persetujuan.
                     </p>
                   </div>
                 </div>
               </div>
               <div className="flex border-l border-slate-700">
                 <button
                   onClick={() => { toast.dismiss(t.id); navigate('/pending'); }}
                   className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-bold text-indigo-400 hover:text-indigo-300 focus:outline-none"
                 >
                   Review
                 </button>
               </div>
             </div>
          ), { duration: 5000 });
        }
        lastPendingIds.current = currentIds;
      } catch (err) {
        if (err?.response?.status !== 429) console.error(err);
      }
    };
    
    checkPending();
    const interval = setInterval(checkPending, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Persetujuan', path: '/pending', icon: AlertCircle, badge: pendingCount },
    { name: 'Karyawan', path: '/users', icon: Users },
    { name: 'Lokasi & Geofence', path: '/locations', icon: MapPin },
    { name: 'Pengaturan Program', path: '/bot-settings', icon: MessageSquare },
    { name: 'Perintah Aktif', path: '/active-commands', icon: Terminal },
    { name: 'Custom Commands', path: '/custom-commands', icon: Terminal },
    { name: 'Laporan (Excel)', path: '/reports', icon: FileSpreadsheet },
    { name: 'Log Aktivitas', path: '/audit-logs', icon: Activity },
    { name: 'Pengaturan Sistem', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 font-sans text-slate-200 relative">
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-60 flex-shrink-0 border-r border-slate-700 bg-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-700 flex items-center h-14">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-lg truncate">
            <LayoutDashboard className="w-6 h-6 shrink-0" />
            <span className="truncate">Admin Panel</span>
          </div>
        </div>
        <nav className="p-2 space-y-1 text-xs uppercase font-semibold tracking-wider text-slate-400 shrink-0">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'hover:bg-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {item.name}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Branding Placeholder */}
        <div className="flex-1 p-4 flex flex-col items-center justify-end space-y-3 select-none overflow-hidden pb-6">
            {branding.logo_url ? (
               <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ) : (
               <Clock className="w-24 h-24 text-slate-500 shrink-0 opacity-50" />
            )}
            <span className="text-xs font-bold text-slate-500 tracking-widest uppercase text-center shrink-0">{branding.app_name}</span>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-700">
           <button onClick={handleLogout} className="flex items-center w-full p-2 text-xs uppercase font-bold text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors">
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
           </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-700 flex items-center px-4 md:px-6 bg-slate-800 shrink-0">
          <button 
            className="md:hidden mr-4 p-1 text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-sm font-bold text-slate-200 uppercase tracking-wide truncate">
            {navItems.find((i) => i.path === location.pathname)?.name || 'Admin Panel'}
          </h1>
        </header>
        <main className="flex-1 p-4 bg-slate-900 overflow-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
