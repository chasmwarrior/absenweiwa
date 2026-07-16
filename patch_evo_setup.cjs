const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const searchStr = `  useEffect(() => {
    pingEvo();
    const interval = setInterval(pingEvo, 10000);
    return () => clearInterval(interval);
  }, []);`;

const replaceStr = `  useEffect(() => {
    pingEvo();
  }, []);`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync('src/pages/Settings.tsx', content);
