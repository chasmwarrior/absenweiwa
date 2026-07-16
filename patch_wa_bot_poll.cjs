const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const searchStr = `  useEffect(() => {
    fetchStatus();
    // Removed auto-refresh interval for bot status completely
  }, []);`;

const replaceStr = `  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [qrCode]); // depend on qrCode so the closure has the latest qrCode for comparison`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync('src/pages/Settings.tsx', content);
