const fs = require('fs');
let code = fs.readFileSync('src/pages/BotSettings.tsx', 'utf8');

// The syntax error is likely a stray character left over from the regex replacement
// "Unterminated regular expression" implies a stray `/` or something.
// Let's just restore the file up to what it's supposed to be manually.
// First, find if there are any stray chars
code = code.replace(/<div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">[\s\S]*/, `
    </div>
  );
}`);
fs.writeFileSync('src/pages/BotSettings.tsx', code);
