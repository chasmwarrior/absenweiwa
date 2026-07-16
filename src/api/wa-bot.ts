import { Router } from 'express';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import pino from 'pino';
import { db } from '../db/index.js';
import { settings, users, attendances } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export const waBotRouter = Router();

let sock: any = null;
let qrCodeDataUrl: string | null = null;
let connectionStatus: 'connecting' | 'open' | 'close' | 'qr_expired' = 'close';

waBotRouter.get('/status', (req, res) => {
    res.json({
        status: connectionStatus,
        qr: qrCodeDataUrl
    });
});

waBotRouter.post('/refresh', async (req, res) => {
    if (sock) {
        try { sock.logout(); } catch (e) {}
    }
    if (fs.existsSync('baileys_auth_info')) {
        fs.rmSync('baileys_auth_info', { recursive: true, force: true });
    }
    connectionStatus = 'close';
    qrCodeDataUrl = null;
    
    initWABot();
    res.json({ success: true });
});

waBotRouter.post('/logout', async (req, res) => {
    if (sock) {
        sock.logout();
    }
    if (fs.existsSync('baileys_auth_info')) {
        fs.rmSync('baileys_auth_info', { recursive: true, force: true });
    }
    connectionStatus = 'close';
    qrCodeDataUrl = null;
    res.json({ success: true });
    
    // Re-init after logout
    setTimeout(() => {
        initWABot();
    }, 2000);
});

export async function initWABot() {
    console.log("Initializing WhatsApp Bot...");
    try {
        const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
        
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: ['AbsensiBot', 'Chrome', '1.0.0']
        });

        sock.ev.on('connection.update', async (update: any) => {
            const { connection, lastDisconnect, qr } = update;
                
            if (qr) {
                qrCodeDataUrl = await qrcode.toDataURL(qr);
                connectionStatus = 'connecting';
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                connectionStatus = 'close';
                qrCodeDataUrl = null;
                    
                if (shouldReconnect) {
                    const isQRExpired = lastDisconnect?.error && 
                        (lastDisconnect.error.message === 'QR refs attempts ended' || 
                         String(lastDisconnect.error).includes('QR refs attempts ended'));
                             
                    if (isQRExpired) {
                        console.log('WhatsApp QR Code expired. Waiting for user to refresh.');
                        if (fs.existsSync('baileys_auth_info')) {
                            fs.rmSync('baileys_auth_info', { recursive: true, force: true });
                        }
                        connectionStatus = 'qr_expired';
                        return; // Stop reconnecting, let user refresh manually
                    }
                    
                    console.log('WhatsApp connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
                    setTimeout(() => initWABot(), 3000);
                } else {
                    // Logged out, delete auth info
                    if (fs.existsSync('baileys_auth_info')) {
                        fs.rmSync('baileys_auth_info', { recursive: true, force: true });
                    }
                    initWABot(); // Restart to get new QR
                }
            } else if (connection === 'open') {
                console.log('WhatsApp Bot is Online!');
                connectionStatus = 'open';
                qrCodeDataUrl = null;
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
            if (type !== 'notify') return;
            const m = messages[0];
            if (!m.message || m.key.fromMe) return;

            const remoteJid = m.key.remoteJid;
            const textMessage = m.message.conversation || m.message.extendedTextMessage?.text || '';
            const locationMessage = m.message.locationMessage;

            // Handle logic here, similar to webhook.ts but native
            await handleIncomingMessage(remoteJid, textMessage, locationMessage);
        });
    } catch (error) {
        console.error("Error initializing WA Bot:", error);
    }
}

export async function sendWhatsAppMessage(jid: string, text: string) {
    if (sock && connectionStatus === 'open') {
        try {
            await sock.sendMessage(jid, { text });
        } catch (err) {
            console.error("Failed to send WA message:", err);
        }
    } else {
        console.warn("Cannot send message, WA Bot is not connected.");
    }
}

// Logic implementation
async function handleIncomingMessage(remoteJid: string, textMessage: string, locationData: any) {
    if (!textMessage && !locationData) return;

    const senderNumber = remoteJid.split('@')[0];
    const command = textMessage.trim().toLowerCase();

    // Find templates
    const templatesResult = await db.select().from(settings).where(eq(settings.key, 'bot_templates')).limit(1);
    const botTemplates = templatesResult.length > 0 ? JSON.parse(templatesResult[0].value) : null;
    const cmds = botTemplates?.commands || { check_in: '!hadir', check_out: '!pulang', info: '!info', location: '!location' };
    const replies = botTemplates?.replies || { 
        not_registered: 'Anda tidak terdaftar', 
        unknown_command: 'Perintah tidak dikenal' 
    };

    // Find user
    const userResult = await db.select().from(users).where(eq(users.id, senderNumber)).limit(1);
    
    if (userResult.length === 0) {
       await sendWhatsAppMessage(remoteJid, replaceVars(replies.not_registered, {}));
       return;
    }

    const user = userResult[0];
    const nowTime = format(new Date(), 'HH:mm');
    const varData: any = { 
       name: user.name, 
       time: nowTime, 
       cmd_check_in: cmds.check_in, 
       cmd_check_out: cmds.check_out, 
       cmd_info: cmds.info,
       late_quota_left: user.late_quota
    };

    if (locationData) {
        await handleLocation(user, remoteJid, replies, varData, locationData);
        return;
    }
    
    // Check custom commands first
    if (botTemplates?.custom_commands && Array.isArray(botTemplates.custom_commands)) {
       const matchedCustom = botTemplates.custom_commands.find((c: any) => c.command.toLowerCase() === command);
       if (matchedCustom) {
           await sendWhatsAppMessage(remoteJid, replaceVars(matchedCustom.reply, varData));
           return;
       }
    }

    if (command === cmds.check_in || command === 'hadir') {
        await handleCheckIn(user, remoteJid, replies, cmds, varData);
    } else if (command === cmds.check_out || command === 'pulang') {
        await handleCheckOut(user, remoteJid, replies, cmds, varData);
    } else if (command === (cmds.leave || '!izin') || command === 'izin' || command === 'libur') {
        await handleLeave(user, remoteJid, replies, varData);
    } else if (command === (cmds.cancel_leave || '!batal_izin')) {
        await handleCancelLeave(user, remoteJid, replies, varData);
    } else if (command === cmds.info || command === 'info' || command === 'statistik') {
        await handleInfo(user, remoteJid, replies, varData);
    } else {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.unknown_command, varData));
    }
}

const replaceVars = (template: string, data: any) => {
    let result = template || '';
    for (const key in data) {
        result = result.replace(new RegExp(`{${key}}`, 'g'), data[key]);
    }
    return result;
};

async function handleCheckIn(user: any, remoteJid: string, replies: any, cmds: any, varData: any) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nowTime = format(new Date(), 'HH:mm:ss');
    
    
    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, user.id), eq(attendances.date, today))).limit(1);
    if (existing.length > 0) {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.already_checked_in || 'Anda sudah melakukan absensi masuk hari ini.', varData));
        return;
    }

    const id = crypto.randomUUID();
    const configResult = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
    const config = JSON.parse(configResult[0].value);
    
    const templatesResult = await db.select().from(settings).where(eq(settings.key, 'bot_templates')).limit(1);
    const botTemplates = templatesResult.length > 0 ? JSON.parse(templatesResult[0].value) : null;
    const features = botTemplates?.features || { require_location_check_in: true, require_location_check_out: true, auto_alert_violations: false };

    let status = 'on_time';
    let penalty = 0;
    let bonus = 0;
    let approval_status = 'approved';
    let durationStr = '00:00:00';

    const workStart = config.work_hours.start + ':00';
    if (nowTime > workStart) {
        status = 'late';
        approval_status = 'pending';
        for (const p of config.late_penalties) {
             if (nowTime >= p.start + ':00' && nowTime <= p.end + ':59') {
                 penalty = p.amount;
                 break;
             }
        }
        if (nowTime >= config.late_cut_holiday + ':00') {
            status = 'holiday';
            penalty = 0;
        }

        const t1 = new Date(`2000-01-01T${workStart}`);
        const t2 = new Date(`2000-01-01T${nowTime}`);
        const diffMs = Math.max(0, t2.getTime() - t1.getTime());
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        durationStr = `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;
    } else {
        bonus = config.bonuses.on_time;
    }

    await db.insert(attendances).values({
        id,
        user_id: user.id,
        date: today,
        check_in_time: nowTime,
        status,
        penalty_amount: penalty,
        bonus_amount: bonus,
        approval_status
    });

    varData.duration = durationStr;
    varData.location = '{location}'; 

    let msg = '';
    if (status === 'late') {
        msg = replaceVars(replies.check_in_late || 'Halo {name}, absensi MASUK berhasil pada pukul {time}. sayang sekali saat ini anda telat {duration}. jumlah telat kamu tersisa {late_quota_left}.', varData);
        if (features.auto_alert_violations) {
            await alertAdmins(`Peringatan Pelanggaran:\nNama: ${user.name}\nStatus: Terlambat Masuk (${nowTime})\nDenda: Rp ${penalty}`);
        }
    } else {
        msg = replaceVars(replies.check_in_success || 'Halo {name}, absensi MASUK berhasil pada pukul {time}.', varData);
    }

    if (features.require_location_check_in !== false) {
        msg += `\nMohon kirimkan *Live Location* Anda.`;
    }

    await sendWhatsAppMessage(remoteJid, msg);
}

async function handleCheckOut(user: any, remoteJid: string, replies: any, cmds: any, varData: any) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nowTime = format(new Date(), 'HH:mm:ss');
    
    
    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, user.id), eq(attendances.date, today))).limit(1);
    if (existing.length === 0) {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.not_checked_in || 'Anda belum absen masuk.', varData));
        return;
    }
    
    const attendance = existing[0];
    if (attendance.status === 'holiday') {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.already_on_leave || 'Anda sedang libur hari ini.', varData));
        return;
    }
    if (attendance.check_out_time) {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.already_checked_out || 'Anda sudah melakukan absensi pulang hari ini.', varData));
        return;
    }

    const configResult = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
    const config = JSON.parse(configResult[0].value);
    
    const templatesResult = await db.select().from(settings).where(eq(settings.key, 'bot_templates')).limit(1);
    const botTemplates = templatesResult.length > 0 ? JSON.parse(templatesResult[0].value) : null;
    const features = botTemplates?.features || { require_location_check_in: true, require_location_check_out: true, auto_alert_violations: false };

    let overtime_amount = 0;
    let approval_status = 'approved';
    let durationStr = '00:00:00';
    let isOvertime = false;

    if (nowTime >= config.overtime.start + ':00') {
        approval_status = 'pending';
        isOvertime = true;
        for (const o of config.overtime.rates) {
             if (nowTime >= o.start + ':00' && nowTime <= o.end + ':59') {
                 overtime_amount = o.amount;
                 break;
             }
        }
        
        const t1 = new Date(`2000-01-01T${config.overtime.start}:00`);
        const t2 = new Date(`2000-01-01T${nowTime}`);
        const diffMs = Math.max(0, t2.getTime() - t1.getTime());
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        durationStr = `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;
    }

    let violationType = '';
    if (nowTime < config.work_hours.end + ':00') {
        if (nowTime < config.quotas.early_leave_start_time + ':00') {
             violationType = 'Pulang Terlalu Cepat (Potong Libur)';
        } else {
             violationType = 'Pulang Cepat';
        }
        approval_status = 'pending';

        if (features.auto_alert_violations) {
            await alertAdmins(`Peringatan Pelanggaran:\nNama: ${user.name}\nStatus: ${violationType} (${nowTime})`);
        }
    }

    let notesStr = undefined;
    if (violationType) {
        notesStr = violationType;
    }

    await db.update(attendances).set({
        check_out_time: nowTime,
        overtime_amount,
        approval_status,
        ...(notesStr && { notes: notesStr })
    }).where(eq(attendances.id, attendance.id));

    varData.duration = durationStr;
    varData.location = '{location}';

    let msg = '';
    if (isOvertime) {
        msg = replaceVars(replies.check_out_overtime || 'Halo {name}, absensi PULANG berhasil pada pukul {time}. Terima Kasih atas Hari ini, Anda telah lembur selama {duration}.', varData);
    } else if (violationType) {
        msg = replaceVars(replies.check_out_success || 'Halo {name}, absensi PULANG berhasil pada pukul {time}.', varData);
        msg += `\nCatatan: ${violationType} terdeteksi. Menunggu persetujuan Admin.`;
    } else {
        msg = replaceVars(replies.check_out_success || 'Halo {name}, absensi PULANG berhasil pada pukul {time}.', varData);
    }

    if (features.require_location_check_out !== false) {
        msg += `\nMohon kirimkan *Live Location* Anda.`;
    }
    await sendWhatsAppMessage(remoteJid, msg);
}

async function alertAdmins(text: string) {
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    for (const admin of adminUsers) {
        await sendWhatsAppMessage(`${admin.id}@s.whatsapp.net`, text);
    }
}

async function handleLocation(user: any, remoteJid: string, replies: any, varData: any, locationData: any) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, user.id), eq(attendances.date, today))).limit(1);
    
    if (existing.length > 0 && locationData) {
        const lat = locationData.degreesLatitude;
        const lng = locationData.degreesLongitude;
        
        const configResult = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
        const config = JSON.parse(configResult[0].value);
        const geofence = config.geofence;
        
        let isOutside = false;
        if (geofence && geofence.lat && geofence.lng && geofence.radius) {
            const R = 6371e3;
            const φ1 = lat * Math.PI / 180;
            const φ2 = geofence.lat * Math.PI / 180;
            const Δφ = (geofence.lat - lat) * Math.PI / 180;
            const Δλ = (geofence.lng - lng) * Math.PI / 180;
            
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            
            if (distance > geofence.radius) {
                isOutside = true;
            }
        }

        let approval_status = existing[0].approval_status;
        let notes = existing[0].notes || '';
        let msg = replaceVars(replies.location_received || 'Lokasi diterima.', varData);

        if (isOutside) {
            approval_status = 'pending';
            notes += ' (Luar Geofence)';
            msg = replaceVars(replies.out_of_geofence || 'Anda berada di luar area kantor. Mohon kirimkan bukti foto/alasan (Menunggu persetujuan Admin).', varData);
        }

        await db.update(attendances).set({
            location_lat: lat,
            location_lng: lng,
            approval_status,
            notes
        }).where(eq(attendances.id, existing[0].id));
        
        await sendWhatsAppMessage(remoteJid, msg);
    } else {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.location_received || 'Lokasi diterima.', varData));
    }
}

async function handleLeave(user: any, remoteJid: string, replies: any, varData: any) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, user.id), eq(attendances.date, today))).limit(1);
    
    if (existing.length > 0) {
        if (existing[0].status === 'holiday') {
            await sendWhatsAppMessage(remoteJid, replaceVars(replies.already_on_leave || 'Anda sudah mengajukan Izin/Libur hari ini.', varData));
        } else {
            await sendWhatsAppMessage(remoteJid, 'Anda sudah melakukan absensi hari ini (bukan status izin).');
        }
        return;
    }

    const id = crypto.randomUUID();
    const nowTime = format(new Date(), 'HH:mm:ss');
    await db.insert(attendances).values({
        id,
        user_id: user.id,
        date: today,
        check_in_time: nowTime,
        status: 'holiday',
        penalty_amount: 0,
        bonus_amount: 0,
        approval_status: 'pending', // admin needs to approve usually
        notes: 'Mengajukan Izin/Libur'
    });
    
    await sendWhatsAppMessage(remoteJid, replaceVars(replies.leave_success || 'Permohonan Izin/Libur berhasil dicatat.', varData));
}

async function handleCancelLeave(user: any, remoteJid: string, replies: any, varData: any) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, user.id), eq(attendances.date, today))).limit(1);
    
    if (existing.length === 0 || existing[0].status !== 'holiday') {
        await sendWhatsAppMessage(remoteJid, 'Anda belum mengajukan Izin/Libur hari ini, tidak ada yang dibatalkan.');
        return;
    }

    await db.delete(attendances).where(eq(attendances.id, existing[0].id));
    
    await sendWhatsAppMessage(remoteJid, replaceVars(replies.cancel_leave_success || 'Izin/Libur anda hari ini telah dibatalkan.', varData));
}

async function handleInfo(user: any, remoteJid: string, replies: any, varData: any) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const userAttendances = await db.select().from(attendances).where(eq(attendances.user_id, user.id));
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
    
    const isEligibleForPerfectBonus = !hasLate && !hasHolidayExceeded && monthlyAttendances.length > 0;
    if (isEligibleForPerfectBonus) monthlyPerfectBonus = appSettings?.bonuses?.perfect_attendance || 0;
    if (user.holiday_quota > 0) unusedHolidayBonus = user.holiday_quota * 100000;
    
    totalBonus += monthlyPerfectBonus + unusedHolidayBonus;

    const statsBreakdown = `
*Total Lembur (Bulan Ini)*: + Rp ${totalOvertime.toLocaleString()}
*Total Bonus (Bulan Ini)*: + Rp ${totalBonus.toLocaleString()}
- Harian (Tepat Waktu): + Rp ${(totalBonus - monthlyPerfectBonus - unusedHolidayBonus).toLocaleString()}
- Disiplin 100% (Bulanan): + Rp ${monthlyPerfectBonus.toLocaleString()}
- Kuota Libur Sisa: + Rp ${unusedHolidayBonus.toLocaleString()}

*Progress Bonus Disiplin*: ${isEligibleForPerfectBonus ? 'Eligible' : 'Not Eligible'}
- Syarat: Tidak ada keterlambatan (${lateDays === 0 ? 'Terpenuhi' : 'Gagal'})
- Syarat: Tidak potong libur melebihi batas (${!hasHolidayExceeded ? 'Terpenuhi' : 'Gagal'})

*Total Denda (Bulan Ini)*: - Rp ${totalPenalty.toLocaleString()}

*Estimasi Pendapatan Tambahan/Potongan*: Rp ${(totalOvertime + totalBonus - totalPenalty).toLocaleString()}

🔗 *Lihat Kalender & Log Lengkap:*
http://localhost:3000/stats/${user.id}
`;

    const msgTemplate = replies.info_stats || 'Halo {name}, berikut Estimasi pendapatan kamu sampai saat ini.\n{stats_breakdown}';
    const finalMsg = msgTemplate.replace('{name}', user.name).replace('{stats_breakdown}', statsBreakdown);
    
    await sendWhatsAppMessage(remoteJid, finalMsg);
}

waBotRouter.get('/status', (req, res) => {
    res.json({
        status: connectionStatus,
        qr: qrCodeDataUrl
    });
});

waBotRouter.post('/logout', async (req, res) => {
    if (sock) {
        await sock.logout();
        connectionStatus = 'close';
        qrCodeDataUrl = null;
    }
    res.json({ success: true });
});

