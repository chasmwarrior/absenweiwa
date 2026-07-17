const fs = require('fs');
let code = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

// Replace the command parsing block
const oldCmdBlock = `    if (command === (cmds.check_in || '').replace(/^!/, '')) {
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
            await sendWhatsAppMessage(remoteJid, \`Perintah tidak dikenal. Untuk absensi masuk, gunakan perintah: \${cmds.check_in || '!hadir'}\`);
        } else if (['out', 'pulang', 'keluar'].includes(command)) {
            await sendWhatsAppMessage(remoteJid, \`Perintah tidak dikenal. Untuk absensi pulang, gunakan perintah: \${cmds.check_out || '!pulang'}\`);
        } else if (['off', 'libur', 'cuti'].includes(command)) {
            await sendWhatsAppMessage(remoteJid, \`Perintah tidak dikenal. Untuk absensi libur, gunakan perintah: \${cmds.leave || '!libur'}\`);
        } else {
            await sendWhatsAppMessage(remoteJid, replaceVars(replies.unknown_command, varData));
        }
    }`;

const newCmdBlock = `    const cmdCheckIn = (cmds.check_in || '').replace(/^!/, '');
    const cmdCheckOut = (cmds.check_out || '').replace(/^!/, '');
    const cmdLeave = (cmds.leave || 'libur').replace(/^!/, '');
    const cmdCancelLeave = (cmds.cancel_leave || 'batal_izin').replace(/^!/, '');
    const cmdInfo = (cmds.info || '').replace(/^!/, '');
    const cmdHelp = (cmds.help || 'help').replace(/^!/, '');

    const checkInAliases = ['msk', 'masuk', 'in', 'hadir', cmdCheckIn];
    const checkOutAliases = ['out', 'pulang', 'keluar', 'plng', cmdCheckOut];
    const leaveAliases = ['off', 'libur', 'cuti', 'lbr', cmdLeave];

    if (checkInAliases.includes(command)) {
        await sendGroupNotice('Masuk/In');
        await handleCheckIn(user, replyJid, replies, cmds, varData);
    } else if (checkOutAliases.includes(command)) {
        await sendGroupNotice('Pulang/Out');
        await handleCheckOut(user, replyJid, replies, cmds, varData);
    } else if (leaveAliases.includes(command)) {
        await sendGroupNotice('Libur/Off');
        await handleLeave(user, replyJid, replies, varData);
    } else if (command.startsWith('telat')) {
        await sendGroupNotice('Telat');
        await handleTelat(user, replyJid, replies, varData, rawCommand);
    } else if (command === cmdCancelLeave) {
        await sendGroupNotice('Batal Libur');
        await handleCancelLeave(user, replyJid, replies, varData);
    } else if (command.startsWith('gantinomer')) {
        await sendGroupNotice('Ganti Nomor');
        await handleChangeNumberRequest(user, replyJid, textMessage, varData, replies);
    } else if (command === cmdInfo || command === 'info' || command === 'statistik') {
        await sendGroupNotice('Info');
        await handleInfo(user, replyJid, replies, varData);
    } else if (command === cmdHelp || command === 'help') {
        await sendGroupNotice('Help');
        await handleHelp(user, replyJid, replies, cmds, varData);
    } else {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.unknown_command, varData));
    }`;

code = code.replace(oldCmdBlock, newCmdBlock);
fs.writeFileSync('src/services/WhatsAppService.ts', code);
