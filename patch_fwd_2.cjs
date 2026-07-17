const fs = require('fs');
let code = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

// There's a case in handleCheckIn where expectedMedia needs to be set if they are outside geofence.
// The string we replaced was "msg = replaceVars(replies.out_of_geofence"
// Let's also check if "Permohonan Libur berhasil dicatat. Silakan kirimkan bukti foto atau dokumen di sini" is used
code = code.replace(
    /await sendWhatsAppMessage\(remoteJid, 'Permohonan Libur berhasil dicatat\. Silakan kirimkan bukti foto atau dokumen di sini\.'\);/g,
    `expectedMedia.set(user.id, true);
        await sendWhatsAppMessage(remoteJid, 'Permohonan Libur berhasil dicatat. Silakan kirimkan bukti foto atau dokumen di sini.');`
);

code = code.replace(
    /await sendWhatsAppMessage\(remoteJid, 'Keterlambatan Anda berhasil dicatat\. Silakan kirimkan info lokasi \(Share Location\) dan bukti foto di sini\.'\);/g,
    `expectedMedia.set(user.id, true);
        await sendWhatsAppMessage(remoteJid, 'Keterlambatan Anda berhasil dicatat. Silakan kirimkan info lokasi (Share Location) dan bukti foto di sini.');`
);

// We need to pass documentMessage into handleIncomingMessage just like imageMessage to reject it if unsolicited.
code = code.replace(
    /const imageMessage = m\.message\.imageMessage;/g,
    `const imageMessage = m.message.imageMessage || m.message.documentMessage;`
);


fs.writeFileSync('src/services/WhatsAppService.ts', code);
