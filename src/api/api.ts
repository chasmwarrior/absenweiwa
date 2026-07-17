import fs from "fs";
import crypto from "crypto";
import { format } from "date-fns";
import axios from "axios";
import { Router } from 'express';

import { db } from '../db/index.js';

import { settings, users, attendances, locations, phoneNumberRequests, auditLogs } from '../db/schema.js';

import { eq, desc, and } from 'drizzle-orm';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';


const formatPhone = (phone: string) => {
  if (!phone) return phone;
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    return '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    return '62' + cleaned;
  }
  return cleaned;
};

import { userSyncService } from '../services/UserSyncService.js';
import { sendWhatsAppMessage } from '../services/WhatsAppService.js';
export const apiRouter = Router();

// Debug & Trace Middleware for Admin Dashboard
apiRouter.use((req, res, next) => {
    // Only log write methods (POST, PUT, DELETE) or debug-logs to avoid console spam from regular GET polling
    if (['POST', 'PUT', 'DELETE'].includes(req.method) || req.url.includes('/debug-logs')) {
        console.log(`[DEBUG API] ${req.method} ${req.url}`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log(`[DEBUG API BODY] ${JSON.stringify(req.body)}`);
        }
    }
    next();
});



// POST Public Phone Number Request
apiRouter.post('/phone-requests', async (req, res) => {
  try {
    let { old_number, new_number } = req.body;
    old_number = formatPhone(old_number);
    new_number = formatPhone(new_number);
    
    // Basic validation
    if (!old_number || !new_number) {
      return res.status(400).json({ error: 'Nomor lama dan nomor baru harus diisi' });
    }
    
    // Check if old user exists
    const oldUser = await db.select().from(users).where(eq(users.id, old_number)).limit(1);
    if (oldUser.length === 0) {
      return res.status(404).json({ error: 'Nomor WhatsApp lama tidak terdaftar di sistem' });
    }
    
    // Check if new number already exists as a user
    const newUserCheck = await db.select().from(users).where(eq(users.id, new_number)).limit(1);
    if (newUserCheck.length > 0) {
      return res.status(400).json({ error: 'Nomor WhatsApp baru sudah terdaftar untuk pengguna lain' });
    }
    
    // Check if pending exists
    const existing = await db.select().from(phoneNumberRequests).where(and(eq(phoneNumberRequests.user_id, old_number), eq(phoneNumberRequests.status, 'pending'))).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Anda sudah memiliki pengajuan ganti nomor yang sedang diproses.' });
    }
    

    await db.insert(phoneNumberRequests).values({
        id: crypto.randomUUID(),
        user_id: old_number,
        new_number: new_number,
        status: 'pending',
        created_at: Date.now()
    });
    
    res.json({ success: true, message: 'Pengajuan ganti nomor berhasil dikirim dan menunggu persetujuan Admin.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Phone Number Requests
apiRouter.get('/phone-requests', async (req, res) => {
  try {
    const requests = await db.select({
      id: phoneNumberRequests.id,
      user_id: phoneNumberRequests.user_id,
      new_number: phoneNumberRequests.new_number,
      status: phoneNumberRequests.status,
      created_at: phoneNumberRequests.created_at,
      user_name: users.name
    }).from(phoneNumberRequests)
      .leftJoin(users, eq(phoneNumberRequests.user_id, users.id))
      .orderBy(desc(phoneNumberRequests.created_at));
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST Approve/Reject Phone Request
apiRouter.post('/phone-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const request = await db.select().from(phoneNumberRequests).where(eq(phoneNumberRequests.id, id)).limit(1);
    if (request.length === 0) return res.status(404).json({ error: 'Request not found' });
    
    if (status === 'rejected') {
      await db.update(phoneNumberRequests).set({ status: 'rejected' }).where(eq(phoneNumberRequests.id, id));
      return res.json({ success: true });
    }

    if (status === 'approved') {
      const oldNumber = request[0].user_id;
      const newNumber = request[0].new_number;

      // Check if new number already exists
      const existingUser = await db.select().from(users).where(eq(users.id, newNumber)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'New number already registered to another user' });
      }

      await db.transaction(async (tx) => {
        const oldUser = await tx.select().from(users).where(eq(users.id, oldNumber)).limit(1);
        if (oldUser.length > 0) {
          // Insert new user
          await tx.insert(users).values({
            ...oldUser[0],
            id: newNumber
          });
          // Update attendances
          await tx.update(attendances).set({ user_id: newNumber }).where(eq(attendances.user_id, oldNumber));
          // Update requests
          await tx.update(phoneNumberRequests).set({ user_id: newNumber, status: 'approved' }).where(eq(phoneNumberRequests.id, id));
          await tx.update(phoneNumberRequests).set({ user_id: newNumber }).where(eq(phoneNumberRequests.user_id, oldNumber));
          // Delete old user
          await tx.delete(users).where(eq(users.id, oldNumber));
          await tx.insert(auditLogs).values({
            id: crypto.randomUUID(),
            action: 'change_number',
            details: `Persetujuan Ganti Nomor: ${oldUser[0].name} dari ${oldNumber} ke ${newNumber}`,
            created_at: Date.now()
          });
        }
      });
      await userSyncService.updateAuthorizedNumbers();
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Invalid status' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


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
    const formattedId = formatPhone(id);
    await db.transaction(async (tx) => {
      await tx.insert(users).values({ id: formattedId, name, role, job_position, work_location_id });
      await tx.insert(auditLogs).values({
        id: crypto.randomUUID(),
        action: 'register',
        details: `Pendaftaran Karyawan Baru: ${name} (${formattedId})`,
        created_at: Date.now()
      });
    });
    userSyncService.updateAuthorizedNumbers();
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
    userSyncService.updateAuthorizedNumbers();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
apiRouter.delete('/users/:id', async (req, res) => {
  try {
    await db.delete(users).where(eq(users.id, req.params.id));
    userSyncService.updateAuthorizedNumbers();
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

    const attRecord = await db.select().from(attendances).where(eq(attendances.id, req.params.id)).limit(1);
    if (attRecord.length > 0) {
      const user = userSyncService.getUser(attRecord[0].user_id);
      if (user) {
let statusName = 'Absensi';
        if (attRecord[0].status === 'holiday') statusName = 'Libur/Off';
        else if (attRecord[0].status === 'late') statusName = 'Telat';
        else if (attRecord[0].status === 'on_time') statusName = 'Masuk/In (Luar Geofence)';
        else if (attRecord[0].status === 'overtime') statusName = 'Pulang/Out (Luar Geofence)';
        
        const templatesResult = await db.select().from(settings).where(eq(settings.key, 'bot_templates')).limit(1);
        const botTemplates = templatesResult.length > 0 ? JSON.parse(templatesResult[0].value) : null;
        const replies = botTemplates?.replies || {};

        let msg = '';
        const notesStr = notes ? "\nCatatan: " + notes : '';
        const varData = {
          name: user.name,
          date: attRecord[0].date,
          statusName: statusName,
          notes: notesStr,
          late_quota_left: user.late_quota,
          leave_quota_left: user.holiday_quota,
          emergency_late_quota_left: user.emergency_late_quota,
          early_leave_quota_left: user.early_leave_quota,
        };

        const replaceVars = (template, data) => {
          let result = template || '';
          for (const key in data) {
            result = result.replace(new RegExp(`\\{\$\{key\}\}`, 'g'), data[key]);
          }
          return result;
        };

        if (status === 'approved') {
            msg = replaceVars(replies.approval_approved || 'Permohonan {statusName} Anda pada tanggal {date} telah *DISETUJUI* oleh Admin.{notes}', varData);
        } else {
            msg = replaceVars(replies.approval_rejected || 'Permohonan {statusName} Anda pada tanggal {date} telah *DITOLAK* oleh Admin.{notes}', varData);
        }
        await sendWhatsAppMessage(user.id + '@s.whatsapp.net', msg);
      }
    }

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

    const attRecord = await db.select().from(attendances).where(eq(attendances.id, req.params.id)).limit(1);
    if (attRecord.length > 0) {
      const user = userSyncService.getUser(attRecord[0].user_id);
      if (user) {
let statusName = 'Absensi';
        if (attRecord[0].status === 'holiday') statusName = 'Libur/Off';
        else if (attRecord[0].status === 'late') statusName = 'Telat';
        else if (attRecord[0].status === 'on_time') statusName = 'Masuk/In (Luar Geofence)';
        else if (attRecord[0].status === 'overtime') statusName = 'Pulang/Out (Luar Geofence)';
        
        let msg = `Permohonan ${statusName} Anda pada tanggal ${attRecord[0].date} telah *${status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}* oleh Admin.`;
        msg += `\nSisa kuota telat Anda: ${user.late_quota} hari.`;
        await sendWhatsAppMessage(user.id + '@s.whatsapp.net', msg);
      }
    }

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
    
    const { sendWhatsAppMessage } = await import('../services/WhatsAppService.js');
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



// Add minimal authorization check (e.g., checking if user has valid JWT and is admin) for debug-logs
const authenticateAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

apiRouter.get('/debug-logs', authenticateAdmin, async (req, res) => {
  try {


    const fsPromises = fs.promises;
    let logs = 'No debug logs.';
    try {
      await fsPromises.access('debug.log', fs.constants.F_OK);
      const stats = await fsPromises.stat('debug.log');
      const MAX_BYTES = 50 * 1024; // 50 KB limit

      if (stats.size > MAX_BYTES) {
        const buffer = Buffer.alloc(MAX_BYTES);
        const handle = await fsPromises.open('debug.log', 'r');
        await handle.read(buffer, 0, MAX_BYTES, stats.size - MAX_BYTES);
        await handle.close();
        logs = '...[TRUNCATED]\n' + buffer.toString('utf8');
      } else {
        logs = await fsPromises.readFile('debug.log', 'utf8');
      }
    } catch (err) {
      // File doesn't exist or is locked
    }

    res.send(logs);
  } catch(e) { res.send(e.message); }
});

apiRouter.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.created_at));
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
