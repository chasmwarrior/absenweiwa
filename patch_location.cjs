const fs = require('fs');
let code = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

const oldCheckInLoc = `    if (features.require_location_check_in !== false) {
        msg += \`\\nMohon kirimkan *Live Location* Anda.\`;
    }`;

const newCheckInLoc = `    // Location prompt is handled by features.require_location_check_in setting.
    // However user prefers to only ask if necessary or out of geofence.
    // Since we don't know geofence until they send location, we just ask for it globally if required,
    // but rephrase to explain WHY.
    if (features.require_location_check_in !== false) {
        expectedMedia.set(user.id, true); // We expect a location/media if they are outside
        msg += \`\\nSistem memerlukan verifikasi lokasi. Mohon kirimkan *Live Location* Anda. Jika Anda berada di luar area kantor (geofence), lokasi diperlukan sebagai bukti persetujuan admin.\`;
    }`;

code = code.replace(oldCheckInLoc, newCheckInLoc);

const oldCheckOutLoc = `    if (features.require_location_check_out !== false) {
        if (remoteJid.endsWith('@g.us')) {
            msg += \`\\nMohon cek pesan pribadi (Japri) dari sistem untuk mengirimkan *Live Location*.\`;
            await sendWhatsAppMessage(remoteJid, msg);
            await sendWhatsAppMessage(user.id + '@s.whatsapp.net', \`Halo \${user.name}, silakan kirimkan *Live Location* Anda untuk menyelesaikan absensi PULANG.\`);
        } else {
            msg += \`\\nMohon kirimkan *Live Location* Anda di sini.\`;
            await sendWhatsAppMessage(remoteJid, msg);
        }
    } else {
        await sendWhatsAppMessage(remoteJid, msg);
    }`;

const newCheckOutLoc = `    if (features.require_location_check_out !== false) {
        if (remoteJid.endsWith('@g.us')) {
            msg += \`\\nSistem memerlukan verifikasi lokasi. Mohon cek pesan pribadi (Japri) dari sistem untuk mengirimkan *Live Location*.\`;
            await sendWhatsAppMessage(remoteJid, msg);
            await sendWhatsAppMessage(user.id + '@s.whatsapp.net', \`Halo \${user.name}, silakan kirimkan *Live Location* Anda untuk menyelesaikan absensi PULANG. Lokasi diperlukan untuk verifikasi area kantor.\`);
        } else {
            msg += \`\\nSistem memerlukan verifikasi lokasi. Mohon kirimkan *Live Location* Anda di sini untuk verifikasi area kantor.\`;
            await sendWhatsAppMessage(remoteJid, msg);
        }
    } else {
        await sendWhatsAppMessage(remoteJid, msg);
    }`;

code = code.replace(oldCheckOutLoc, newCheckOutLoc);

fs.writeFileSync('src/services/WhatsAppService.ts', code);
