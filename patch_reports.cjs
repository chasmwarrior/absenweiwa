const fs = require('fs');
let content = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

if (!content.includes('import ErrorBoundary')) {
  content = content.replace(
    "import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';",
    "import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';\nimport ErrorBoundary from '../components/ErrorBoundary';"
  );
}

const searchStr = `<div className="p-4" style={{ height: 300 }}>
           <ResponsiveContainer width="100%" height="100%">`;
const replaceStr = `<div className="p-4 h-[300px] w-full">
           <ErrorBoundary>
           <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>`;

const searchStr2 = `           </ResponsiveContainer>
        </div>`;
const replaceStr2 = `           </ResponsiveContainer>
           </ErrorBoundary>
        </div>`;

content = content.replace(searchStr, replaceStr);
content = content.replace(searchStr2, replaceStr2);

fs.writeFileSync('src/pages/Reports.tsx', content);
