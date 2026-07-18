const fs = require('fs');
let code = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

const oldLogicBlock = `    let hasLate = false;
    let hasHolidayExceeded = false;
    let lateDays = 0;

    monthlyAttendances.forEach(att => {
      totalPenalty += (att.penalty_amount || 0);
      totalOvertime += (att.overtime_amount || 0);

      if (att.status === 'on_time') {
         totalBonus += dailyBonus;
      }
      if (att.status === 'late' || (att.penalty_amount && att.penalty_amount > 0)) {
         hasLate = true;
         lateDays++;
      }
      if (att.status === 'holiday') {
         hasHolidayExceeded = true;
      }
    });

    let monthlyPerfectBonus = 0;
    let unusedHolidayBonus = 0;

    const isEligibleForPerfectBonus = (lateDays <= user.late_quota) && !hasHolidayExceeded && monthlyAttendances.length > 0;
    if (isEligibleForPerfectBonus) monthlyPerfectBonus = appSettings?.bonuses?.perfect_attendance || 0;
    if (user.holiday_quota > 0) unusedHolidayBonus = user.holiday_quota * 100000;

    totalBonus += monthlyPerfectBonus + unusedHolidayBonus;

    const statsBreakdown = \`
*Sisa Kuota Absensi:*
- Libur: \${user.holiday_quota} kali
- Telat: \${user.late_quota} kali
- Telat Darurat: \${user.emergency_late_quota} kali
- Pulang Cepat: \${user.early_leave_quota} kali

*Total Lembur (Bulan Ini)*: + Rp \${totalOvertime.toLocaleString()}
*Total Bonus (Bulan Ini)*: + Rp \${totalBonus.toLocaleString()}
- Harian (Tepat Waktu): + Rp \${(totalBonus - monthlyPerfectBonus - unusedHolidayBonus).toLocaleString()}
- Disiplin 100% (Bulanan): + Rp \${monthlyPerfectBonus.toLocaleString()}
- Kuota Libur Sisa: + Rp \${unusedHolidayBonus.toLocaleString()}

*Progress Bonus Disiplin*: \${isEligibleForPerfectBonus ? 'Eligible' : 'Not Eligible'}
- Syarat: Telat tidak lebih dari kuota (\${lateDays <= user.late_quota ? 'Terpenuhi' : 'Gagal'})`;

// The user mentioned: "for discipline bonus calculations not only exceed their authorized `late_quota` limit. but all quota limit monthly."
// Wait, the quotas are stored on the `users` table and deducted dynamically when an admin approves an attendance.
// Therefore, `user.holiday_quota`, `user.late_quota`, `user.emergency_late_quota`, and `user.early_leave_quota` represent the *remaining* balance.
// If any of these drop below zero (i.e., < 0), it means they exceeded their quota.
// Let's modify the condition to: `isEligibleForPerfectBonus = user.late_quota >= 0 && user.holiday_quota >= 0 && user.emergency_late_quota >= 0 && user.early_leave_quota >= 0 && monthlyAttendances.length > 0;`
// And we update the stats Breakdown condition string to match.

const newLogicBlock = `    let lateDays = 0;

    monthlyAttendances.forEach(att => {
      totalPenalty += (att.penalty_amount || 0);
      totalOvertime += (att.overtime_amount || 0);

      if (att.status === 'on_time') {
         totalBonus += dailyBonus;
      }
      if (att.status === 'late' || (att.penalty_amount && att.penalty_amount > 0)) {
         lateDays++;
      }
    });

    let monthlyPerfectBonus = 0;
    let unusedHolidayBonus = 0;

    // Eligible if no quota is exceeded (i.e. remaining quota is >= 0)
    const isQuotaExceeded = user.late_quota < 0 || user.holiday_quota < 0 || user.emergency_late_quota < 0 || user.early_leave_quota < 0;
    const isEligibleForPerfectBonus = !isQuotaExceeded && monthlyAttendances.length > 0;

    if (isEligibleForPerfectBonus) monthlyPerfectBonus = appSettings?.bonuses?.perfect_attendance || 0;
    if (user.holiday_quota > 0) unusedHolidayBonus = user.holiday_quota * 100000;

    totalBonus += monthlyPerfectBonus + unusedHolidayBonus;

    const statsBreakdown = \`
*Sisa Kuota Absensi:*
- Libur: \${user.holiday_quota} kali
- Telat: \${user.late_quota} kali
- Telat Darurat: \${user.emergency_late_quota} kali
- Pulang Cepat: \${user.early_leave_quota} kali

*Total Lembur (Bulan Ini)*: + Rp \${totalOvertime.toLocaleString()}
*Total Bonus (Bulan Ini)*: + Rp \${totalBonus.toLocaleString()}
- Harian (Tepat Waktu): + Rp \${(totalBonus - monthlyPerfectBonus - unusedHolidayBonus).toLocaleString()}
- Disiplin 100% (Bulanan): + Rp \${monthlyPerfectBonus.toLocaleString()}
- Kuota Libur Sisa: + Rp \${unusedHolidayBonus.toLocaleString()}

*Progress Bonus Disiplin*: \${isEligibleForPerfectBonus ? 'Eligible' : 'Not Eligible'}
- Syarat: Tidak melampaui batas semua kuota bulanan (\${!isQuotaExceeded ? 'Terpenuhi' : 'Gagal'})`;

code = code.replace(oldLogicBlock, newLogicBlock);
fs.writeFileSync('src/services/WhatsAppService.ts', code);
