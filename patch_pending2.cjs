const fs = require('fs');
let content = fs.readFileSync('src/pages/PendingActions.tsx', 'utf8');

content = content.replace(
  `const [attRes, usersRes, phoneRes] = await Promise.all([
        axios.get('/api/attendances'),
        axios.get('/api/users'),
        axios.get('/api/phone-requests')
        axios.get('/api/attendances'),
        axios.get('/api/users')
      ]);`,
  `const [attRes, usersRes, phoneRes] = await Promise.all([
        axios.get('/api/attendances'),
        axios.get('/api/users'),
        axios.get('/api/phone-requests')
      ]);`
);
fs.writeFileSync('src/pages/PendingActions.tsx', content);
