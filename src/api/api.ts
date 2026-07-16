import { format } from "date-fns";
import { Router } from 'express';
import { db } from '../db/index.js';
import { settings, users, attendances, locations } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export const apiRouter = Router();

// POST Login
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { id, password } = req.body;
    const userResult = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (userResult.length === 0 || userResult[0].role !== 'admin') {
      return res.status(401).json({ error: 'Invalid credentials or not admin' });
    }
    
    const isValid = await bcrypt.compare(password, userResult[0].password || '');
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: userResult[0].id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: userResult[0].id, name: userResult[0].name } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Locations
apiRouter.get('/locations', async (req, res) => {
  try {
    const allLocations = await db.select().from(locations);
    res.json(allLocations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Location
apiRouter.post('/locations', async (req, res) => {
  try {
    const { id, name, latitude, longitude, radius } = req.body;
    await db.insert(locations).values({ id, name, latitude, longitude, radius });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Location
apiRouter.delete('/locations/:id', async (req, res) => {
  try {
    await db.delete(locations).where(eq(locations.id, req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET bot templates
apiRouter.get('/bot-templates', async (req, res) => {
  try {
    const result = await db.select().from(settings).where(eq(settings.key, 'bot_templates')).limit(1);
    if (result.length > 0) {
      res.json(JSON.parse(result[0].value));
    } else {
      res.status(404).json({ error: 'Templates not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST update bot templates
apiRouter.post('/bot-templates', async (req, res) => {
  try {
    const newTemplates = req.body;
    await db.update(settings).set({ value: JSON.stringify(newTemplates) }).where(eq(settings.key, 'bot_templates'));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET all settings
apiRouter.get('/settings', async (req, res) => {
  try {
    const result = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
    if (result.length > 0) {
      res.json(JSON.parse(result[0].value));
    } else {
      res.status(404).json({ error: 'Settings not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST update settings
apiRouter.post('/settings', async (req, res) => {
  try {
    const newSettings = req.body;
    await db.update(settings).set({ value: JSON.stringify(newSettings) }).where(eq(settings.key, 'app_settings'));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET users
apiRouter.get('/users', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add user
apiRouter.post('/users', async (req, res) => {
  try {
    const { id, name, role, job_position, work_location_id } = req.body;
    await db.insert(users).values({ id, name, role, job_position, work_location_id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user
apiRouter.put('/users/:id', async (req, res) => {
  try {
    const { name, role, job_position, work_location_id } = req.body;
    await db.update(users).set({ 
       name, 
       role, 
       job_position, 
       work_location_id: work_location_id || null 
    }).where(eq(users.id, req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
apiRouter.delete('/users/:id', async (req, res) => {
  try {
    await db.delete(users).where(eq(users.id, req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET attendances
apiRouter.get('/attendances', async (req, res) => {
  try {
    const allAttendances = await db.select().from(attendances).orderBy(desc(attendances.date));
    res.json(allAttendances);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats-page data
apiRouter.get('/stats-page/:id', async (req, res) => {
  try {
    const { month } = req.query; // format yyyy-MM
    const userRes = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    
    if (userRes.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    const allAtts = await db.select().from(attendances).where(eq(attendances.user_id, req.params.id)).orderBy(desc(attendances.date));
    const monthlyAtts = month ? allAtts.filter(a => a.date.startsWith(month as string)) : allAtts;
    
    const summary = {
      present: monthlyAtts.filter(a => a.status === 'on_time').length,
      late: monthlyAtts.filter(a => a.status === 'late').length,
      holiday: monthlyAtts.filter(a => a.status === 'holiday').length,
      early_leave: monthlyAtts.filter(a => a.notes?.includes('Pulang Cepat')).length
    };
    
    res.json({
      user: userRes[0],
      attendances: monthlyAtts,
      summary
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST update attendance approval (legacy for dashboard)
apiRouter.post('/attendances/:id/approve', async (req, res) => {
  try {
    const { status, notes } = req.body;
    await db.update(attendances).set({ approval_status: status, notes }).where(eq(attendances.id, req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update attendance approval
apiRouter.put('/attendances/:id/approval', async (req, res) => {
  try {
    const { status } = req.body;
    await db.update(attendances).set({ approval_status: status, notes: 'Diproses melalui Pending Actions' }).where(eq(attendances.id, req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST change password
apiRouter.post('/admin/change-password', async (req, res) => {
  try {
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    // Assuming 'admin' is the ID of the main admin user based on seeding logic
    await db.update(users).set({ password: hashedPassword }).where(eq(users.role, 'admin'));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST clear logs older than 30 days
apiRouter.post('/data/clear-logs', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    // In Drizzle, deleting based on a string date comparison might be simpler with SQL template literal if complex,
    // but a basic less than can work if date is ISO string. For simplicity, since SQLite date is text:
    const all = await db.select().from(attendances);
    const toDelete = all.filter(a => a.date < dateStr).map(a => a.id);
    
    for (const id of toDelete) {
       await db.delete(attendances).where(eq(attendances.id, id));
    }

    res.json({ success: true, deleted: toDelete.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST reset all data
apiRouter.post('/data/reset-all', async (req, res) => {
  try {
    await db.delete(attendances);
    await db.delete(locations);
    const allUsers = await db.select().from(users);
    for (const u of allUsers) {
      if (u.role !== 'admin') {
         await db.delete(users).where(eq(users.id, u.id));
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET export data
apiRouter.get('/data/export', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    const allAttendances = await db.select().from(attendances);
    const allLocations = await db.select().from(locations);
    const data = { users: allUsers, attendances: allAttendances, locations: allLocations };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=absensi_export.json');
    res.send(JSON.stringify(data, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger Pulang Cepat manual
apiRouter.post('/users/:id/pulang-cepat', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const { sendWhatsAppMessage } = await import('./wa-bot.js');
    const msg = `Halo ${user[0].name}, admin telah mencatat Anda untuk Pulang Cepat hari ini. Mohon kirimkan bukti/alasan agar dapat disetujui oleh admin.`;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, userId), eq(attendances.date, today))).limit(1);
    
    if (existing.length > 0) {
        await db.update(attendances).set({ 
            approval_status: 'pending',
            notes: (existing[0].notes ? existing[0].notes + ' | ' : '') + 'Pulang Cepat (Manual)'
        }).where(eq(attendances.id, existing[0].id));
    }
    
    await sendWhatsAppMessage(`${userId}@s.whatsapp.net`, msg);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET user stats (Live Pay Preview)
apiRouter.get('/users/:id/stats', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const userAttendances = await db.select().from(attendances).where(eq(attendances.user_id, req.params.id));
    const userResult = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    
    const monthlyAttendances = userAttendances.filter(a => a.date.startsWith(currentMonth));
    
    let totalPenalty = 0;
    let totalOvertime = 0;
    let totalBonus = 0;

    const appSettingsRes = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
    const appSettings = appSettingsRes.length > 0 ? JSON.parse(appSettingsRes[0].value) : null;
    const dailyBonus = appSettings?.bonuses?.on_time || 0;

    let hasLate = false;
    let hasHolidayExceeded = false;
    let lateDays = 0;
    let holidayDays = 0;

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
         holidayDays++;
      }
    });

    // Check Monthly Rules
    let monthlyPerfectBonus = 0;
    let unusedHolidayBonus = 0;
    const user = userResult[0];

    // Perfect attendance bonus
    const isEligibleForPerfectBonus = !hasLate && !hasHolidayExceeded && monthlyAttendances.length > 0;
    if (isEligibleForPerfectBonus) {
       monthlyPerfectBonus = appSettings?.bonuses?.perfect_attendance || 0;
    }

    // Unused holiday bonus
    if (user && user.holiday_quota > 0) {
       unusedHolidayBonus = user.holiday_quota * 100000;
    }

    totalBonus += monthlyPerfectBonus + unusedHolidayBonus;

    const netAmount = totalOvertime + totalBonus - totalPenalty;

    res.json({
      totalPenalty,
      totalOvertime,
      totalBonus,
      netAmount,
      breakdown: {
         daily_bonuses: totalBonus - monthlyPerfectBonus - unusedHolidayBonus,
         perfect_attendance: monthlyPerfectBonus,
         unused_holidays: unusedHolidayBonus
      },
      bonusEligibility: {
         isEligible: isEligibleForPerfectBonus,
         lateDays,
         holidayDays,
         totalAttendances: monthlyAttendances.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET export audit log
apiRouter.get('/data/audit-log', async (req, res) => {
  try {
    const allAttendances = await db.select().from(attendances);
    const allUsers = await db.select().from(users);
    
    // Filter for manual approvals/rejections
    const auditLogs = allAttendances
       .filter(a => a.notes === 'Diproses melalui Pending Actions' || (a.notes && a.notes.includes('Diproses')))
       .map(a => {
           const user = allUsers.find(u => u.id === a.user_id);
           return {
               tanggal: a.date,
               karyawan: user?.name || a.user_id,
               status_absensi: a.status,
               keputusan: a.approval_status,
               catatan: a.notes,
               denda: a.penalty_amount,
               lembur: a.overtime_amount,
               bonus: a.bonus_amount
           };
       });
       
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_log_persetujuan.json');
    res.send(JSON.stringify(auditLogs, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

