const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import ChangeNumber from')) {
  content = content.replace(
    "import Login from './pages/Login';",
    "import Login from './pages/Login';\nimport ChangeNumber from './pages/ChangeNumber';"
  );
}

if (!content.includes('<Route path="/change-number" element={<ChangeNumber />} />')) {
  content = content.replace(
    '<Route path="/login" element={<Login />} />',
    '<Route path="/login" element={<Login />} />\n            <Route path="/change-number" element={<ChangeNumber />} />'
  );
}

fs.writeFileSync('src/App.tsx', content);
