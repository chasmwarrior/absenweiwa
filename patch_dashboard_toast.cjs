const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const searchStr = `  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(fetchData, 10000);
      toast.success('Auto-refresh diaktifkan', { id: 'autorefresh-toast', duration: 2000 });
    } else {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
      toast('Auto-refresh dinonaktifkan', { id: 'autorefresh-toast', duration: 2000, icon: <Power className="w-4 h-4 text-slate-400" /> });
    }
    return () => clearInterval(autoRefreshInterval.current);
  }, [autoRefresh]);`;

const replaceStr = `  const initialMount = useRef(true);
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(fetchData, 30000);
      if (!initialMount.current) {
        toast.success('Auto-refresh diaktifkan', { id: 'autorefresh-toast', duration: 2000 });
      }
    } else {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
      if (!initialMount.current) {
        toast('Auto-refresh dinonaktifkan', { id: 'autorefresh-toast', duration: 2000, icon: <Power className="w-4 h-4 text-slate-400" /> });
      }
    }
    initialMount.current = false;
    return () => clearInterval(autoRefreshInterval.current);
  }, [autoRefresh]);`;

content = content.replace(searchStr, replaceStr);

const searchStrPulse1 = `'bg-rose-500 animate-pulse'}`;
const replaceStrPulse1 = `'bg-rose-500'}`;
content = content.replace(searchStrPulse1, replaceStrPulse1);
content = content.replace(searchStrPulse1, replaceStrPulse1); // replace both occurrences in Dashboard.tsx

fs.writeFileSync('src/pages/Dashboard.tsx', content);
