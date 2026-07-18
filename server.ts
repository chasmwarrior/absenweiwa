import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

import fsSync from 'fs';
import util from 'util';

let logFile = fsSync.createWriteStream('debug.log', { flags: 'a' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

let logCount = 0;
function checkRotate() {
  logCount++;
  if (logCount % 100 !== 0) return; // Only check size every 100 logs
  try {
    const stats = fsSync.statSync('debug.log');
    if (stats.size > 2 * 1024 * 1024) { // 2MB limit
      try {
        fsSync.renameSync('debug.log', 'debug.log.old');
        logFile = fsSync.createWriteStream('debug.log', { flags: 'a' });
      } catch (renameErr) {
        // If rename fails (e.g. file lock), we just recreate the stream to empty it
        logFile = fsSync.createWriteStream('debug.log', { flags: 'w' });
      }
    }
  } catch (e) {}
}

console.log = function (...args) {
  checkRotate();
  logFile.write(util.format.apply(null, args) + '\n');
  originalConsoleLog.apply(console, args);
};

console.error = function (...args) {
  checkRotate();
  logFile.write('ERROR: ' + util.format.apply(null, args) + '\n');
  originalConsoleError.apply(console, args);
};

import { db } from './src/db/index.js';
import { settings, users, attendances } from './src/db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import { waBotRouter, initWABot, sendWhatsAppMessage } from './src/services/WhatsAppService.js';
import { apiRouter } from './src/api/api.js';
import bcrypt from 'bcryptjs';
import cron from 'node-cron';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
// from 'date-fns';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.use('/api/bot', waBotRouter);
  app.use('/api', apiRouter);

  // Default setup
  await initializeSettings();
  
  // Start WA Bot
  initWABot();

  // Setup Cron Job for Check-In Reminder (runs every minute and checks if it is 5 mins before start)
  cron.schedule('* * * * *', async () => {
     try {
       const configResult = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
       if (configResult.length === 0) return;
       const config = JSON.parse(configResult[0].value);
       const workStart = config.work_hours?.start; // e.g. "08:00"
       if (!workStart) return;

       const now = new Date();
       const nowStr = formatInTimeZone(now, 'Asia/Jakarta', 'HH:mm');

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

       const reminderTimeStr = `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

       if (nowStr === reminderTimeStr) {
           console.log('Running check-in reminder cron job...');
           const today = formatInTimeZone(now, 'Asia/Jakarta', 'yyyy-MM-dd');

           const allUsers = await db.select().from(users).where(eq(users.role, 'employee'));
           const todayAttendances = await db.select().from(attendances).where(eq(attendances.date, today));
           const attendedUserIds = new Set(todayAttendances.map(a => a.user_id));

           for (const u of allUsers) {
               if (!attendedUserIds.has(u.id)) {
                   await sendWhatsAppMessage(`${u.id}@s.whatsapp.net`, `Halo ${u.name}, waktu absen masuk kurang dari 5 menit lagi (${workStart}). Jangan lupa melakukan absensi ya!`);
               }
           }
       }
     } catch (err) {
       console.error('Error in check-in reminder cron:', err);
     }
  });

  // Setup Cron Job for Auto-Checkout
  cron.schedule('59 23 * * *', async () => {
     console.log('Running auto-checkout cron job...');
     try {
       const today = formatInTimeZone(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
       const pendingCheckouts = await db.select().from(attendances)
         .where(and(eq(attendances.date, today), isNull(attendances.check_out_time)));
       
       if (pendingCheckouts.length > 0) {
         const templatesResult = await db.select().from(settings).where(eq(settings.key, 'bot_templates')).limit(1);
         const botTemplates = templatesResult.length > 0 ? JSON.parse(templatesResult[0].value) : null;
         const warningMsgTemplate = botTemplates?.replies?.auto_checkout_warning || 'Halo {name}, anda belum melakukan absen pulang. Sistem telah melakukan absen pulang otomatis (Pulang Normal).';
         
         const configResult = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
         const config = JSON.parse(configResult[0].value);
         const normalCheckoutTime = config.work_hours.end + ':00';

         for (const att of pendingCheckouts) {
           if (att.status === 'holiday') continue; // skip holiday

           const userRes = await db.select().from(users).where(eq(users.id, att.user_id)).limit(1);
           if (userRes.length === 0) continue;
           const user = userRes[0];

           await db.update(attendances).set({
             check_out_time: normalCheckoutTime,
             notes: (att.notes ? att.notes + ' | ' : '') + 'Auto-checkout System'
           }).where(eq(attendances.id, att.id));

           const msg = warningMsgTemplate.replace(/{name}/g, user.name);
           await sendWhatsAppMessage(`${user.id}@s.whatsapp.net`, msg);
         }
       }
     } catch (err) {
       console.error('Error in auto-checkout cron:', err);
     }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

async function initializeSettings() {
  const existingSettings = await db.select().from(settings).limit(1);
  if (existingSettings.length === 0) {
    const defaultSettings = {
      work_hours: { start: '10:00', end: '20:00' },
      late_penalties: [
        { start: '10:12', end: '10:30', amount: 5000 },
        { start: '10:31', end: '11:00', amount: 10000 },
        { start: '11:01', end: '11:30', amount: 15000 },
        { start: '11:31', end: '12:00', amount: 20000 },
        { start: '12:01', end: '13:00', amount: 30000 },
        { start: '13:01', end: '13:30', amount: 40000 },
        { start: '13:31', end: '14:00', amount: 50000 }
      ],
      late_cut_holiday: '14:01',
      bonuses: {
        on_time: 20000,
        monthly_perfect: 800000,
        no_holiday_per_day: 100000
      },
      overtime: {
        start: '20:01',
        rates: [
          { start: '20:01', end: '20:30', amount: 5000 },
          { start: '20:31', end: '21:00', amount: 10000 },
          { start: '21:01', end: '21:30', amount: 15000 },
          { start: '21:31', end: '22:00', amount: 20000 },
          { start: '22:01', end: '23:00', amount: 30000 },
          { start: '23:01', end: '23:30', amount: 40000 },
          { start: '23:31', end: '00:00', amount: 50000 }
        ]
      },
      quotas: {
        holiday_per_month: 4,
        late_per_month: 2,
        emergency_late_per_6_months: 2,
        early_leave_per_month: 3,
        early_leave_start_time: '17:00'
      },
    };
    
    await db.insert(settings).values({ key: 'app_settings', value: JSON.stringify(defaultSettings) });
  }

  const existingTemplates = await db.select().from(settings).where(eq(settings.key, 'bot_templates')).limit(1);
  if (existingTemplates.length === 0) {
    const defaultTemplates = {
      commands: {
        check_in: '!hadir',
        check_out: '!pulang',
        info: '!info',
        location: '!location'
      },
      replies: {
        not_registered: 'Anda tidak terdaftar dalam sistem absensi. Silahkan hubungi Admin.',
        already_checked_in: 'Anda sudah melakukan absensi masuk hari ini.',
        already_checked_out: 'Anda sudah melakukan absensi pulang hari ini.',
        not_checked_in: 'Anda belum melakukan absensi masuk hari ini.',
        location_received: 'Lokasi diterima. Sedang memvalidasi geofence...',
        unknown_command: 'Perintah tidak dikenal. Gunakan:\n- {cmd_check_in}\n- {cmd_check_out}\n- {cmd_info}\n\nKirimkan share location jika diminta.'
      }
    };
    await db.insert(settings).values({ key: 'bot_templates', value: JSON.stringify(defaultTemplates) });
  }

  // Create default admin user if none exists
  const admins = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  if (admins.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    await db.insert(users).values({
      id: '6281234567890', // Default admin number (change later)
      name: 'Admin',
      role: 'admin',
      password: hash
    });
  }
}

startServer();
