const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const searchStr = `function WhatsAppBotSetup() {
  const [status, setStatus] = useState<string>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/bot/status');
      setStatus(res.data.status);
      setQrCode(res.data.qr);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);`;

const replaceStr = `function WhatsAppBotSetup() {
  const [status, setStatus] = useState<string>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/bot/status');
      setStatus(res.data.status);
      if (res.data.qr !== qrCode) {
         setQrCode(res.data.qr);
         if (res.data.status === 'connecting') {
           setTimeLeft(40); // 40 seconds before expiry
         }
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchStatus();
    // Removed auto-refresh interval for bot status completely
  }, []);

  useEffect(() => {
    if (status === 'connecting' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'connecting' && timeLeft === 0) {
      setStatus('qr_expired');
    }
  }, [timeLeft, status]);`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync('src/pages/Settings.tsx', content);
