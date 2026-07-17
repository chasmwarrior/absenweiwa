const fs = require('fs');
let code = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

const forwardingCheck = `
            if (m.message?.extendedTextMessage?.contextInfo?.isForwarded ||
                m.message?.imageMessage?.contextInfo?.isForwarded ||
                m.message?.documentMessage?.contextInfo?.isForwarded) {
                console.log('Forwarded message detected, ignoring.');
                return;
            }
`;

code = code.replace(
    /const textMessage = m\.message\.conversation \|\| m\.message\.extendedTextMessage\?\.text \|\| '';/,
    forwardingCheck + `            const textMessage = m.message.conversation || m.message.extendedTextMessage?.text || '';`
);


// State tracking mechanism for expected media
const mediaStateInit = `const userLastGroup = new Map<string, string>();
const SPAM_THRESHOLD_MS = 2500;
const expectedMedia = new Map<string, boolean>();`;

code = code.replace(
    /const userLastGroup = new Map<string, string>\(\);\nconst SPAM_THRESHOLD_MS = 2500;/,
    mediaStateInit
);

// We should also set expectedMedia when the bot asks for it. Let's find those places.
// 1. Check in (Luar Geofence) - 'out_of_geofence'
// 2. Libur - 'Permohonan Libur berhasil dicatat.'
// 3. Telat - 'Keterlambatan Anda berhasil dicatat.'

code = code.replace(
    /msg = replaceVars\(replies\.out_of_geofence/g,
    `expectedMedia.set(user.id, true);
            msg = replaceVars(replies.out_of_geofence`
);

code = code.replace(
    /await sendWhatsAppMessage\(remoteJid, 'Permohonan Libur berhasil dicatat\. Mohon cek pesan pribadi \(Japri\) dari sistem untuk mengirimkan bukti foto\/dokumen\.'\);/g,
    `expectedMedia.set(user.id, true);
        await sendWhatsAppMessage(remoteJid, 'Permohonan Libur berhasil dicatat. Mohon cek pesan pribadi (Japri) dari sistem untuk mengirimkan bukti foto/dokumen.');`
);

code = code.replace(
    /await sendWhatsAppMessage\(remoteJid, 'Keterlambatan Anda berhasil dicatat\. Mohon cek pesan pribadi \(Japri\) dari sistem untuk mengirimkan info lokasi \(Share Location\) dan bukti foto\.'\);/g,
    `expectedMedia.set(user.id, true);
        await sendWhatsAppMessage(remoteJid, 'Keterlambatan Anda berhasil dicatat. Mohon cek pesan pribadi (Japri) dari sistem untuk mengirimkan info lokasi (Share Location) dan bukti foto.');`
);


// Now implement the check in handleImage, and clear the state after.
// But first, let's fix handleImage signature and how it's called to also accept document message.
// Actually, since we only have handleImage right now, let's just make it check expectedMedia.

code = code.replace(
    /async function handleImage\(user: any, remoteJid: string, replies: any, varData: any, imageMessage: any\) \{/g,
    `async function handleImage(user: any, remoteJid: string, replies: any, varData: any, imageMessage: any) {
    if (!expectedMedia.get(user.id)) {
        await sendWhatsAppMessage(remoteJid, 'Maaf, saya tidak menerima dokumen/foto yang tidak diminta.');
        return;
    }
    expectedMedia.delete(user.id); // clear state
`
);

fs.writeFileSync('src/services/WhatsAppService.ts', code);
