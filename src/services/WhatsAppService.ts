import { Router } from 'express';
import makeWASocketPkg, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
const makeWASocket = (makeWASocketPkg as any).default || (makeWASocketPkg as any).makeWASocket || makeWASocketPkg;
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import pino from 'pino';
import { db } from '../db/index.js';
import { userSyncService } from './UserSyncService.js';
import { settings, users, attendances, phoneNumberRequests } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

const lastMessageTimes = new Map<string, number>();
const userLastGroup = new Map<string, string>();
const SPAM_THRESHOLD_MS = 2500;

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



export async function forceReset() {
    console.log("Forcing WhatsApp Bot reset...");
    if (sock) {
        try {
            sock.ev.removeAllListeners();
            if (sock.ws) sock.ws.close();
            else if (sock.end) sock.end(undefined);
            sock = null;
        } catch (e) {
            console.error("Error during WASocket shutdown:", e);
        }
    }
    connectionStatus = 'connecting';
    setTimeout(() => initWABot(), 2000);
}

export async function initWABot() {
    await userSyncService.initialize();
    if (sock) {
        try {
            sock.ev.removeAllListeners();
            if (sock.ws) sock.ws.close(); else if (sock.end) sock.end(undefined);
        } catch (e) {}
    }
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
                const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
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

                    if (statusCode === 515) {
                        console.log('Stream Errored (restart required). Forcing clean reset...');
                        return forceReset();
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
            const imageMessage = m.message.imageMessage;
            await handleIncomingMessage(remoteJid, textMessage, locationMessage, m.key.participant, imageMessage);
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

async function handleChangeNumberRequest(user, remoteJid, textMessage, varData, replies) {
    const parts = textMessage.trim().split(' ');
    if (parts.length < 2) {
        await sendWhatsAppMessage(remoteJid, 'Format salah. Gunakan: !gantinomer <nomor_baru_628xxx>');
        return;
    }
    const newNumber = parts[1].replace(/[^0-9]/g, '');
    if (!newNumber.startsWith('62')) {
        await sendWhatsAppMessage(remoteJid, 'Nomor harus diawali dengan 62 (contoh: 628123456789)');
        return;
    }
    
    // Check if pending exists
    
    const existing = await db.select().from(phoneNumberRequests).where(and(eq(phoneNumberRequests.user_id, user.id), eq(phoneNumberRequests.status, 'pending'))).limit(1);
    
    if (existing.length > 0) {
        await sendWhatsAppMessage(remoteJid, 'Anda sudah memiliki pengajuan ganti nomor yang sedang diproses.');
        return;
    }

    await db.insert(phoneNumberRequests).values({
        id: crypto.randomUUID(),
        user_id: user.id,
        new_number: newNumber,
        status: 'pending',
        created_at: Date.now()
    });

    await sendWhatsAppMessage(remoteJid, 'Pengajuan ganti nomor ke ' + newNumber + ' berhasil dikirim dan menunggu persetujuan Admin.');
    await alertAdmins(`Ada pengajuan ganti nomor dari ${user.name} (${user.id}) ke ${newNumber}.`);
}

async function handleIncomingMessage(remoteJid: string, textMessage: string, locationData: any, participant?: string, imageMessage?: any) {
    const appSettingsRes = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
    const appSettings = appSettingsRes.length > 0 ? JSON.parse(appSettingsRes[0].value) : null;
    const appUrl = process.env.APP_URL || appSettings?.app_url || 'https://wa.absenwei.warriorcarl.my.id';

    if (!textMessage && !locationData && !imageMessage) return;
    
    // Anti-spam logic (Unofficial API protection)
    const now = Date.now();
    const lastTime = lastMessageTimes.get(remoteJid) || 0;
    if (now - lastTime < SPAM_THRESHOLD_MS) {
        console.log(`Spam detected from ${remoteJid}, ignoring.`);
        return;
    }
    lastMessageTimes.set(remoteJid, now);

    const isGroup = remoteJid.endsWith('@g.us');
    const senderJid = isGroup && participant ? participant : remoteJid;
    const senderNumber = senderJid.split('@')[0];
    const privateJid = `${senderNumber}@s.whatsapp.net`;
    if (isGroup) userLastGroup.set(user?.id || senderNumber, remoteJid);
    const replyJid = privateJid; // For detailed replies

    // Strip mentions from text message (e.g. "@628... !hadir" -> "!hadir")
    const cleanTextMessage = textMessage.replace(/@[0-9]+/g, '').trim();
    const rawCommand = cleanTextMessage.toLowerCase();
    const command = rawCommand.replace(/^!/, ''); // Strip ! at the beginning for all commands

    // Global Commands (Bypass Registration Check)
    if (command === 'daftar' || command === 'ganti nomer' || command === 'gantinomer') {
        if (command === 'daftar') {
            await sendWhatsAppMessage(remoteJid, `Silakan melakukan pendaftaran (oleh Admin) atau hubungi admin di link berikut:\n${appUrl}/register`);
        } else {
            await sendWhatsAppMessage(remoteJid, `Silakan ajukan ganti nomor melalui link berikut:\n${appUrl}/change-number`);
        }
        return;
    }

    // Find templates
    const templatesResult = await db.select().from(settings).where(eq(settings.key, 'bot_templates')).limit(1);
    const botTemplates = templatesResult.length > 0 ? JSON.parse(templatesResult[0].value) : null;
    const cmds = botTemplates?.commands || { check_in: '!hadir', check_out: '!pulang', info: '!info', help: '!help' };
    const replies = botTemplates?.replies || { 
        not_registered: 'Anda tidak terdaftar', 
        unknown_command: 'Perintah tidak dikenal' 
    };

    // Find user from cache
    const user = userSyncService.getUser(senderNumber);
    
    if (!user) {
       await sendWhatsAppMessage(remoteJid, replaceVars(replies.not_registered, {}));
       return;
    }


    const nowTime = format(new Date(), 'HH:mm');
    const varData: any = {
       name: user.name,
       time: nowTime,
       cmd_check_in: cmds.check_in,
       cmd_check_out: cmds.check_out,
       cmd_info: cmds.info,
       late_quota_left: user.late_quota,
       leave_quota_left: user.holiday_quota,
       early_leave_quota_left: user.early_leave_quota,
       emergency_late_quota_left: user.emergency_late_quota
    };

    if (imageMessage) {
        await handleImage(user, replyJid, replies, varData, imageMessage);
        return;
    }

    if (locationData) {
        await handleLocation(user, remoteJid, replies, varData, locationData);
        return;
    }
    
    // Check custom commands first
    if (botTemplates?.custom_commands && Array.isArray(botTemplates.custom_commands)) {
       const matchedCustom = botTemplates.custom_commands.find((c: any) => (c.command.toLowerCase() || '').replace(/^!/, '') === command && c.isActive !== false);
       if (matchedCustom) {
           await sendWhatsAppMessage(remoteJid, replaceVars(matchedCustom.reply, varData));
           return;
       }
    }

const sendGroupNotice = async (cmdName) => {
        if (isGroup) {
            await sendWhatsAppMessage(remoteJid, `Halo @${senderNumber}, perintah ${cmdName} diterima. Silakan cek pesan personal/DM dari bot untuk melanjutkan.`);
        }
    };

    if (command === (cmds.check_in || '').replace(/^!/, '')) {
        await sendGroupNotice('Masuk/In');
        await handleCheckIn(user, replyJid, replies, cmds, varData);
    } else if (command === (cmds.check_out || '').replace(/^!/, '')) {
        await sendGroupNotice('Pulang/Out');
        await handleCheckOut(user, replyJid, replies, cmds, varData);
    } else if (command === ((cmds.leave || 'libur').replace(/^!/, ''))) {
        await sendGroupNotice('Libur/Off');
        await handleLeave(user, replyJid, replies, varData);
    } else if (command.startsWith('telat')) {
        await sendGroupNotice('Telat');
        await handleTelat(user, replyJid, replies, varData, rawCommand);
    } else if (command === ((cmds.cancel_leave || 'batal_izin').replace(/^!/, ''))) {
        await sendGroupNotice('Batal Libur');
        await handleCancelLeave(user, replyJid, replies, varData);
    } else if (command.startsWith('gantinomer')) {
        await sendGroupNotice('Ganti Nomor');
        await handleChangeNumberRequest(user, replyJid, textMessage, varData, replies);
    } else if (command === (cmds.info || '').replace(/^!/, '') || command === 'info' || command === 'statistik') {
        await sendGroupNotice('Info');
        await handleInfo(user, replyJid, replies, varData);
    } else if (command === (cmds.help || 'help').replace(/^!/, '') || command === 'help') {
        await sendGroupNotice('Help');
        await handleHelp(user, replyJid, replies, cmds, varData);
    } else {
        if (['msk', 'masuk', 'in', 'hadir'].includes(command)) {
            await sendWhatsAppMessage(remoteJid, `Perintah tidak dikenal. Untuk absensi masuk, gunakan perintah: ${cmds.check_in || '!hadir'}`);
        } else if (['out', 'pulang', 'keluar'].includes(command)) {
            await sendWhatsAppMessage(remoteJid, `Perintah tidak dikenal. Untuk absensi pulang, gunakan perintah: ${cmds.check_out || '!pulang'}`);
        } else if (['off', 'libur', 'cuti'].includes(command)) {
            await sendWhatsAppMessage(remoteJid, `Perintah tidak dikenal. Untuk absensi libur, gunakan perintah: ${cmds.leave || '!libur'}`);
        } else {
            await sendWhatsAppMessage(remoteJid, replaceVars(replies.unknown_command, varData));
        }
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
        if (remoteJid.endsWith('@g.us')) {
            msg += `\nMohon cek pesan pribadi (Japri) dari bot untuk mengirimkan *Live Location*.`;
            await sendWhatsAppMessage(remoteJid, msg);
            await sendWhatsAppMessage(user.id + '@s.whatsapp.net', `Halo ${user.name}, silakan kirimkan *Live Location* Anda untuk menyelesaikan absensi PULANG.`);
        } else {
            msg += `\nMohon kirimkan *Live Location* Anda di sini.`;
            await sendWhatsAppMessage(remoteJid, msg);
        }
    } else {
        await sendWhatsAppMessage(remoteJid, msg);
    }
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
        if (remoteJid.endsWith('@s.whatsapp.net')) {
            const groupJid = userLastGroup.get(user.id);
            if (groupJid && groupJid.endsWith('@g.us')) {
                await sendWhatsAppMessage(groupJid, `Proses absensi untuk ${user.name} telah selesai (Lokasi diterima).`);
            }
        }
    } else {
        const receivedMsg = replaceVars(replies.location_received || 'Lokasi diterima.', varData);
        await sendWhatsAppMessage(remoteJid, receivedMsg);
        if (remoteJid.endsWith('@s.whatsapp.net')) {
            const groupJid = userLastGroup.get(user.id);
            if (groupJid && groupJid.endsWith('@g.us')) {
                await sendWhatsAppMessage(groupJid, `Proses absensi untuk ${user.name} telah selesai (Lokasi diterima).`);
            }
        }
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
    
    if (remoteJid.endsWith('@g.us')) {
        await sendWhatsAppMessage(remoteJid, 'Permohonan Libur berhasil dicatat. Mohon cek pesan pribadi (Japri) dari bot untuk mengirimkan bukti foto/dokumen.');
        await sendWhatsAppMessage(user.id + '@s.whatsapp.net', `Halo ${user.name}, silakan kirimkan bukti foto/alasan untuk permohonan Libur/Izin Anda di sini.`);
    } else {
        await sendWhatsAppMessage(remoteJid, 'Permohonan Libur berhasil dicatat. Silakan kirimkan bukti foto atau dokumen di sini.');
    }
    await alertAdmins(`Ada pengajuan Libur/Off dari ${user.name} (${user.id}).`);
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
    const appSettingsRes = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
    const appSettings = appSettingsRes.length > 0 ? JSON.parse(appSettingsRes[0].value) : null;
    const appUrl = process.env.APP_URL || appSettings?.app_url || 'https://wa.absenwei.warriorcarl.my.id';
    const currentMonth = new Date().toISOString().slice(0, 7);
    const userAttendances = await db.select().from(attendances).where(eq(attendances.user_id, user.id));
    const monthlyAttendances = userAttendances.filter(a => a.date.startsWith(currentMonth));
    
    let totalPenalty = 0;
    let totalOvertime = 0;
    let totalBonus = 0;
    
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
${appUrl}/stats/${user.id}
`;

    varData.stats_breakdown = statsBreakdown;
    const finalMsg = replaceVars(replies.info_stats || 'Halo {name}, berikut Estimasi pendapatan kamu sampai saat ini.\n{stats_breakdown}', varData);
    
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



async function handleTelat(user: any, remoteJid: string, replies: any, varData: any, rawCommand: string) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, user.id), eq(attendances.date, today))).limit(1);
    
    if (existing.length > 0) {
        await sendWhatsAppMessage(remoteJid, 'Anda sudah melakukan absensi/izin/libur/telat hari ini.');
        return;
    }

    const reasonMatch = rawCommand.match(/^telat\s+(.+)$/);
    if (!reasonMatch) {
        await sendWhatsAppMessage(remoteJid, 'Mohon sertakan alasan keterlambatan. Format: !telat [alasan Anda].\nJika diperlukan, Anda juga bisa mengirimkan Live Location Anda setelah absen telat dicatat.');
        return;
    }

    const reason = reasonMatch[1].trim();
    const id = crypto.randomUUID();
    const nowTime = format(new Date(), 'HH:mm:ss');

    await db.insert(attendances).values({
        id,
        user_id: user.id,
        date: today,
        check_in_time: nowTime,
        status: 'late',
        penalty_amount: 0,
        bonus_amount: 0,
        approval_status: 'pending',
        notes: `Telat: ${reason}`
    });
    
    if (remoteJid.endsWith('@g.us')) {
        await sendWhatsAppMessage(remoteJid, 'Keterlambatan Anda berhasil dicatat. Mohon cek pesan pribadi (Japri) dari bot untuk mengirimkan info lokasi (Share Location) dan bukti foto.');
        await sendWhatsAppMessage(user.id + '@s.whatsapp.net', `Halo ${user.name}, silakan kirimkan info lokasi (Share Location) dan bukti foto di sini.`);
    } else {
        await sendWhatsAppMessage(remoteJid, 'Keterlambatan Anda berhasil dicatat. Silakan kirimkan info lokasi (Share Location) dan bukti foto di sini.');
    }
    await alertAdmins(`Ada pengajuan Telat dari ${user.name} (${user.id}) dengan alasan: ${reason}`);
}


async function handleImage(user: any, remoteJid: string, replies: any, varData: any, imageMessage: any) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, user.id), eq(attendances.date, today))).limit(1);
    
    if (existing.length > 0 && (existing[0].approval_status === 'pending' || existing[0].status === 'late' || existing[0].status === 'holiday')) {
        let notes = existing[0].notes || '';
        if (!notes.includes('Bukti foto dilampirkan')) {
            notes += ' (Bukti foto dilampirkan)';
            await db.update(attendances).set({ notes }).where(eq(attendances.id, existing[0].id));
            await sendWhatsAppMessage(remoteJid, 'Bukti foto berhasil diterima dan akan ditinjau oleh Admin.');
        } else {
            await sendWhatsAppMessage(remoteJid, 'Bukti foto tambahan diterima.');
        }
    } else {
        await sendWhatsAppMessage(remoteJid, 'Bukti foto diterima, namun tidak ada permohonan tertunda yang membutuhkan bukti saat ini.');
    }
}

async function handleHelp(user: any, remoteJid: string, replies: any, cmds: any, varData: any) {
    const helpMsg = `Daftar Perintah yang tersedia:\n- Masuk: ${cmds.check_in || '!hadir'}\n- Pulang: ${cmds.check_out || '!pulang'}\n- Info: ${cmds.info || '!info'}\n- Libur: ${cmds.leave || '!libur'}\n- Batal Libur: ${cmds.cancel_leave || '!batal_izin'}\n- Bantuan: ${cmds.help || '!help'}`;
    await sendWhatsAppMessage(remoteJid, helpMsg);
}
