const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardChart.tsx', 'utf8');

const searchStr = `<div className="h-64 w-full pt-4">`;
const replaceStr = `<div className="w-full pt-4" style={{ height: 256, minHeight: 256 }}>`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('src/components/DashboardChart.tsx', content);
