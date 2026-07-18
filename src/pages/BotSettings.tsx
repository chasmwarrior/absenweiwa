import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, MessageSquare, Info, RefreshCw, PowerOff, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';

export default function BotSettings() {
  const [templates, setTemplates] = useState<any>(null);
  const [isCommandsOpen, setIsCommandsOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const { status, qrCode, reconnect } = useWhatsAppStatus();

  const displayStatus = () => {
    if (status === 'open') return 'Connected';
    if (status === 'close' || status === 'error' || status === 'qr_expired') return 'Disconnected';
    if (status === 'connecting') return qrCode ? 'Scanning' : 'Connecting...';
    return 'Loading...';
  };


  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/bot-templates');
      setTemplates(res.data);
    } catch (err: any) {
      if (err?.response?.status !== 429) console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/bot-templates', templates);
      toast.success('Pengaturan sistem berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan bot');
    }
  };

  if (!templates) return <div className="p-8 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      {/* Bot Status Card */}
            
    </div>
  );
}