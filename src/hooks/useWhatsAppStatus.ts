import { useState, useEffect } from 'react';
import axios from 'axios';

export function useWhatsAppStatus() {
  const [status, setStatus] = useState<string>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/bot/status');
      setStatus(res.data.status);
      setQrCode(res.data.qr || null);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const reconnect = async () => {
    try {
      setStatus('loading');
      await axios.post('/api/bot/refresh');
      await fetchStatus();
    } catch (err) {
      console.error('Failed to reconnect', err);
    }
  };

  return { status, qrCode, fetchStatus, reconnect };
}
