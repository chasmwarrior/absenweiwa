const fs = require('fs');
let code = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

// The bug in config.late_cut_holiday will also be fixed here because it's closely related. We'll find that block.
/*
        if (nowTime >= config.late_cut_holiday + ':00') {
            status = 'holiday';
            penalty = 0;
        }
*/
code = code.replace(
    /if \(nowTime >= config\.late_cut_holiday \+ ':00'\) \{\n\s*status = 'holiday';\n\s*penalty = 0;\n\s*\}/,
    `if (nowTime > '14:00:00') {
            status = 'telat (potong libur)';
            approval_status = 'pending';
        } else if (nowTime >= config.late_cut_holiday + ':00') {
            // Fix 14:00 Holiday Bug - removing automatic 'holiday' status for standard late cutoff
            // It just stays 'late' as expected but requires admin approval which we already set above.
        }`
);

fs.writeFileSync('src/services/WhatsAppService.ts', code);
