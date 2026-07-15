import { Router } from 'express';
import { db } from '../db/index.js';
import { settings, users, attendances } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';
import axios from 'axios';

export const webhookRouter = Router();

// Helper to send WA message using Evolution API
async function sendWhatsAppMessage(remoteJid: string, text: string) {
  try {
    const configResult = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
    if (configResult.length === 0) return;
    
    const config = JSON.parse(configResult[0].value).evolution_api;
    if (!config || !config.base_url || !config.api_key || !config.instance_name) {
      console.log('Evolution API not fully configured. Mock sending message:', text);
      return;
    }

    let jid = remoteJid;
    if (!jid.includes('@')) {
      jid = `${jid}@s.whatsapp.net`;
    }

    await axios.post(`${config.base_url}/message/sendText/${config.instance_name}`, {
      number: jid,
      text: text
    }, {
      headers: {
        'apikey': config.api_key,
        'Content-Type': 'application/json'
      }
    });
  } catch (err: any) {
    console.error('Failed to send WA message:', err.message);
  }
}

const replaceVars = (template: string, data: any) => {
    let result = template || '';
    for (const key in data) {
        result = result.replace(new RegExp(`{${key}}`, 'g'), data[key]);
    }
    return result;
};

// Evolution API webhook endpoint
webhookRouter.post('/', async (req, res) => {
  res.status(200).send('OK');

  try {
    const body = req.body;
    const messageEvent = body.data || body;
    
    if (!messageEvent || !messageEvent.message) return;
    if (messageEvent.key?.fromMe) return;

    const remoteJid = messageEvent.key?.remoteJid;
    if (!remoteJid || remoteJid.includes('@g.us')) return;

    const senderNumber = remoteJid.split('@')[0];
    
    let textMessage = '';
    let locationData: any = null;
    
    if (messageEvent.message?.conversation) {
      textMessage = messageEvent.message.conversation;
    } else if (messageEvent.message?.extendedTextMessage?.text) {
      textMessage = messageEvent.message.extendedTextMessage.text;
    } else if (messageEvent.message?.locationMessage) {
        textMessage = '!location';
        locationData = messageEvent.message.locationMessage;
    }

    if (!textMessage) return;

    const command = textMessage.trim().toLowerCase();

    // Find templates
    const templatesResult = await db.select().from(settings).where(eq(settings.key, 'bot_templates')).limit(1);
    const botTemplates = templatesResult.length > 0 ? JSON.parse(templatesResult[0].value) : null;
    const cmds = botTemplates?.commands || { check_in: '!hadir', check_out: '!pulang', info: '!info', location: '!location' };
    const replies = botTemplates?.replies || { not_registered: 'Anda tidak terdaftar', unknown_command: 'Perintah tidak dikenal' };

    // Find user
    const userResult = await db.select().from(users).where(eq(users.id, senderNumber)).limit(1);
    
    if (userResult.length === 0) {
       await sendWhatsAppMessage(remoteJid, replies.not_registered);
       return;
    }

    const user = userResult[0];
    const nowTime = format(new Date(), 'HH:mm');
    const varData = { 
       name: user.name, 
       time: nowTime, 
       cmd_check_in: cmds.check_in, 
       cmd_check_out: cmds.check_out, 
       cmd_info: cmds.info 
    };
    
    if (command === cmds.check_in || command === 'hadir') {
        await handleCheckIn(user, remoteJid, replies, cmds, varData);
    } else if (command === cmds.check_out || command === 'pulang') {
        await handleCheckOut(user, remoteJid, replies, cmds, varData);
    } else if (command === cmds.info || command === 'info') {
        await handleInfo(user, remoteJid);
    } else if (command === cmds.location) {
        await handleLocation(user, remoteJid, replies, varData, locationData);
    } else {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.unknown_command, varData));
    }

  } catch (err) {
    console.error('Error handling webhook', err);
  }
});

async function handleCheckIn(user: any, remoteJid: string, replies: any, cmds: any, varData: any) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nowTime = format(new Date(), 'HH:mm:ss');
    
    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, user.id), eq(attendances.date, today))).limit(1);
    if (existing.length > 0) {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.already_checked_in, varData));
        return;
    }

    const id = crypto.randomUUID();
    const configResult = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
    const config = JSON.parse(configResult[0].value);
    
    // Check templates for features
    const templatesResult = await db.select().from(settings).where(eq(settings.key, 'bot_templates')).limit(1);
    const botTemplates = templatesResult.length > 0 ? JSON.parse(templatesResult[0].value) : null;
    const features = botTemplates?.features || { require_location_check_in: true, require_location_check_out: true, auto_alert_violations: false };

    let status = 'on_time';
    let penalty = 0;
    let bonus = 0;
    let approval_status = 'approved';

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

    let msg = replaceVars(replies.check_in_success || 'Halo {name}, absensi MASUK berhasil pada pukul {time}.', varData);
    
    if (status === 'late') {
        msg += `\n*Peringatan*: Anda terlambat. Potongan: Rp ${penalty}. (Menunggu persetujuan Admin)`;
        if (features.auto_alert_violations) {
            await alertAdmins(`Peringatan Pelanggaran:\nNama: ${user.name}\nStatus: Terlambat Masuk (${nowTime})\nDenda: Rp ${penalty}`);
        }
    } else if (bonus > 0) {
        msg += `\nBonus Tepat Waktu: Rp ${bonus}`;
    }

    // Request location
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
        // use default fallback text if property missing
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.not_checked_in || 'Anda belum absen masuk.', varData));
        return;
    }
    
    const attendance = existing[0];
    if (attendance.check_out_time) {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.already_checked_out, varData));
        return;
    }

    const configResult = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
    const config = JSON.parse(configResult[0].value);
    
    // Check templates for features
    const templatesResult = await db.select().from(settings).where(eq(settings.key, 'bot_templates')).limit(1);
    const botTemplates = templatesResult.length > 0 ? JSON.parse(templatesResult[0].value) : null;
    const features = botTemplates?.features || { require_location_check_in: true, require_location_check_out: true, auto_alert_violations: false };

    let overtime_amount = 0;
    let approval_status = 'approved';
    let msg = replaceVars(replies.check_out_success || 'Halo {name}, absensi PULANG berhasil pada pukul {time}.', varData);

    if (nowTime >= config.overtime.start + ':00') {
        approval_status = 'pending';
        for (const o of config.overtime.rates) {
             if (nowTime >= o.start + ':00' && nowTime <= o.end + ':59') {
                 overtime_amount = o.amount;
                 break;
             }
        }
        msg += `\nLembur terdeteksi: Rp ${overtime_amount} (Menunggu persetujuan Admin).`;
    }

    if (nowTime < config.work_hours.end + ':00') {
        let violationType = '';
        if (nowTime < config.quotas.early_leave_start_time + ':00') {
             msg += `\nPulang terlalu cepat. Dianggap potong libur (Menunggu persetujuan Admin).`;
             violationType = 'Pulang Terlalu Cepat (Potong Libur)';
        } else {
             msg += `\nPulang cepat terdeteksi (Menunggu persetujuan Admin).`;
             violationType = 'Pulang Cepat';
        }
        approval_status = 'pending';

        if (features.auto_alert_violations) {
            await alertAdmins(`Peringatan Pelanggaran:\nNama: ${user.name}\nStatus: ${violationType} (${nowTime})`);
        }
    }

    await db.update(attendances).set({
        check_out_time: nowTime,
        overtime_amount,
        approval_status
    }).where(eq(attendances.id, attendance.id));

    if (features.require_location_check_out !== false) {
        msg += `\nMohon kirimkan *Live Location* Anda.`;
    }
    await sendWhatsAppMessage(remoteJid, msg);
}

async function alertAdmins(text: string) {
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    for (const admin of adminUsers) {
        // Send alert directly to each admin's number via WA
        await sendWhatsAppMessage(`${admin.id}@s.whatsapp.net`, text);
    }
}

async function handleLocation(user: any, remoteJid: string, replies: any, varData: any, locationData: any) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, user.id), eq(attendances.date, today))).limit(1);
    
    if (existing.length > 0 && locationData) {
        const lat = locationData.degreesLatitude;
        const lng = locationData.degreesLongitude;
        
        await db.update(attendances).set({
            location_lat: lat,
            location_lng: lng
        }).where(eq(attendances.id, existing[0].id));
        
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.location_received || 'Lokasi berhasil disimpan.', varData));
    } else {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.location_received || 'Lokasi diterima.', varData));
    }
}

async function handleInfo(user: any, remoteJid: string) {
    const msg = `Halo ${user.name},\nRole: ${user.role}\nSisa Kuota Libur: ${user.holiday_quota}\nSisa Telat (Bulan ini): ${user.late_quota}\nSisa Pulang Cepat: ${user.early_leave_quota}`;
    await sendWhatsAppMessage(remoteJid, msg);
}

