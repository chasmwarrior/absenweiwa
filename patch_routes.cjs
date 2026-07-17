const fs = require('fs');

// Patch App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
    /import CustomCommands from '\.\/pages\/CustomCommands';/,
    `import CustomCommands from './pages/CustomCommands';\nimport ActiveCommands from './pages/ActiveCommands';`
);
appCode = appCode.replace(
    /<Route path="custom-commands" element=\{<CustomCommands \/>\} \/>/,
    `<Route path="custom-commands" element={<CustomCommands />} />\n                <Route path="active-commands" element={<ActiveCommands />} />`
);
fs.writeFileSync('src/App.tsx', appCode);

// Patch Layout.tsx
let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layoutCode = layoutCode.replace(
    /\{ name: 'Custom Commands', path: '\/custom-commands', icon: Terminal \},/,
    `{ name: 'Perintah Aktif', path: '/active-commands', icon: Terminal },\n    { name: 'Custom Commands', path: '/custom-commands', icon: Terminal },`
);
fs.writeFileSync('src/components/Layout.tsx', layoutCode);
