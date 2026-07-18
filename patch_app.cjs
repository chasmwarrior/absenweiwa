const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
    /<Route path="\/stats\/:id" element=\{<EmployeeStats \/>\} \/>/,
    ''
);

code = code.replace(
    /<Route path="\/register" element=\{<Register \/>\} \/>/,
    `<Route path="/register" element={<Register />} />\n            <Route path="/stats/:id" element={<EmployeeStats />} />`
);

fs.writeFileSync('src/App.tsx', code);
