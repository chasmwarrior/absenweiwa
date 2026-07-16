const fs = require('fs');
let content = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

const changeNumberLogic = `
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
    const { phoneNumberRequests } = require('../db/schema.js');
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
    await alertAdmins(\`Ada pengajuan ganti nomor dari \${user.name} (\${user.id}) ke \${newNumber}.\`);
}
`;

content = content.replace(
    "} else if (command === cmds.info || command === 'info' || command === 'statistik') {",
    "} else if (command.startsWith('!gantinomer')) {\n        await handleChangeNumberRequest(user, remoteJid, textMessage, varData, replies);\n    } else if (command === cmds.info || command === 'info' || command === 'statistik') {"
);

// Add the function above handleIncomingMessage
content = content.replace("async function handleIncomingMessage", changeNumberLogic + "\nasync function handleIncomingMessage");

fs.writeFileSync('src/services/WhatsAppService.ts', content);
