const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');

code = code.replace(
    /password: text\('password'\), \/\/ bcrypt hashed for admin/,
    `password: text('password'), // bcrypt hashed for admin\n  pin: text('pin'), // PIN for employee dashboard access`
);

fs.writeFileSync('src/db/schema.ts', code);
