const fs = require('fs');

function replaceTimezone(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');

    // Add import if not present
    if (!code.includes("import { formatInTimeZone }")) {
        code = code.replace(/import \{ format \}/g, "import { format }\nimport { formatInTimeZone } from 'date-fns-tz';\n//");
        code = code.replace(/import \{ format, /g, "import { formatInTimeZone } from 'date-fns-tz';\nimport { format, ");
    }

    code = code.replace(/format\(new Date\(\),/g, "formatInTimeZone(new Date(), 'Asia/Jakarta',");
    // Some places use `const now = new Date(); format(now,`
    code = code.replace(/format\(now,/g, "formatInTimeZone(now, 'Asia/Jakarta',");

    fs.writeFileSync(filePath, code);
}

replaceTimezone('src/services/WhatsAppService.ts');
replaceTimezone('src/api/api.ts');
replaceTimezone('server.ts');
