const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const searchStr = `  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);`;

const replaceStr = `  useEffect(() => {
    fetchStatus();
  }, []);`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync('src/pages/Settings.tsx', content);
