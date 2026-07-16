const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import Register from')) {
  content = content.replace(
    "import ChangeNumber from './pages/ChangeNumber';",
    "import ChangeNumber from './pages/ChangeNumber';\nimport Register from './pages/Register';"
  );
}

if (!content.includes('<Route path="/register" element={<Register />} />')) {
  content = content.replace(
    '<Route path="/change-number" element={<ChangeNumber />} />',
    '<Route path="/change-number" element={<ChangeNumber />} />\n            <Route path="/register" element={<Register />} />'
  );
}

fs.writeFileSync('src/App.tsx', content);
