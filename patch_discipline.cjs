const fs = require('fs');
let code = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

const oldLogic = `    const isEligibleForPerfectBonus = !hasLate && !hasHolidayExceeded && monthlyAttendances.length > 0;`;
const newLogic = `    const isEligibleForPerfectBonus = (lateDays <= user.late_quota) && !hasHolidayExceeded && monthlyAttendances.length > 0;`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/services/WhatsAppService.ts', code);
