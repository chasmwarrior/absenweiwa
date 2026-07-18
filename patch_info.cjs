const fs = require('fs');
let code = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

const oldBreakdown = `    const statsBreakdown = \`
*Total Lembur (Bulan Ini)*: + Rp \${totalOvertime.toLocaleString()}
*Total Bonus (Bulan Ini)*: + Rp \${totalBonus.toLocaleString()}
- Harian (Tepat Waktu): + Rp \${(totalBonus - monthlyPerfectBonus - unusedHolidayBonus).toLocaleString()}
- Disiplin 100% (Bulanan): + Rp \${monthlyPerfectBonus.toLocaleString()}
- Kuota Libur Sisa: + Rp \${unusedHolidayBonus.toLocaleString()}

*Progress Bonus Disiplin*: \${isEligibleForPerfectBonus ? 'Eligible' : 'Not Eligible'}
- Syarat: Tidak ada keterlambatan (\${lateDays === 0 ? 'Terpenuhi' : 'Gagal'})
- Syarat: Tidak potong libur melebihi batas (\${!hasHolidayExceeded ? 'Terpenuhi' : 'Gagal'})

*Total Denda (Bulan Ini)*: - Rp \${totalPenalty.toLocaleString()}

*Estimasi Pendapatan Tambahan/Potongan*: Rp \${(totalOvertime + totalBonus - totalPenalty).toLocaleString()}

🔗 *Lihat Kalender & Log Lengkap:*
\${appUrl}/stats/\${user.id}
\`;`;

const newBreakdown = `    const statsBreakdown = \`
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
- Syarat: Telat tidak lebih dari kuota (\${lateDays <= user.late_quota ? 'Terpenuhi' : 'Gagal'})

*Total Denda (Bulan Ini)*: - Rp \${totalPenalty.toLocaleString()}

*Estimasi Pendapatan Tambahan/Potongan*: Rp \${(totalOvertime + totalBonus - totalPenalty).toLocaleString()}

🔗 *Lihat Kalender & Log Lengkap:*
\${appUrl}/stats/\${user.id}
\`;`;

code = code.replace(oldBreakdown, newBreakdown);
fs.writeFileSync('src/services/WhatsAppService.ts', code);
