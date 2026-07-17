const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const reminderCronBlock = `  // Setup Cron Job for Check-In Reminder (runs every minute and checks if it is 5 mins before start)
  cron.schedule('* * * * *', async () => {
     try {
       const configResult = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
       if (configResult.length === 0) return;
       const config = JSON.parse(configResult[0].value);
       const workStart = config.work_hours?.start; // e.g. "08:00"
       if (!workStart) return;

       const now = new Date();
       const nowStr = format(now, 'HH:mm');

       // Calculate 5 mins before start
       const [hrStr, minStr] = workStart.split(':');
       let hr = parseInt(hrStr, 10);
       let min = parseInt(minStr, 10);
       min -= 5;
       if (min < 0) {
           min += 60;
           hr -= 1;
       }
       if (hr < 0) hr += 24;

       const reminderTimeStr = \`\${String(hr).padStart(2, '0')}:\${String(min).padStart(2, '0')}\`;

       if (nowStr === reminderTimeStr) {
           console.log('Running check-in reminder cron job...');
           const today = format(now, 'yyyy-MM-dd');

           const allUsers = await db.select().from(users).where(eq(users.role, 'employee'));
           const todayAttendances = await db.select().from(attendances).where(eq(attendances.date, today));
           const attendedUserIds = new Set(todayAttendances.map(a => a.user_id));

           for (const u of allUsers) {
               if (!attendedUserIds.has(u.id)) {
                   await sendWhatsAppMessage(\`\${u.id}@s.whatsapp.net\`, \`Halo \${u.name}, waktu absen masuk kurang dari 5 menit lagi (\${workStart}). Jangan lupa melakukan absensi ya!\`);
               }
           }
       }
     } catch (err) {
       console.error('Error in check-in reminder cron:', err);
     }
  });

  // Setup Cron Job for Auto-Checkout`;

code = code.replace(/  \/\/ Setup Cron Job for Auto-Checkout/, reminderCronBlock);

fs.writeFileSync('server.ts', code);
