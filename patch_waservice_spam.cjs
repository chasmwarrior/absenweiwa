const fs = require('fs');
let code = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

code = code.replace(
    /if \(now - lastTime < SPAM_THRESHOLD_MS\) {\n\s*console\.log\(`Spam detected from \${remoteJid}, ignoring\.`\);\n\s*return;\n\s*}/,
    `if (now - lastTime < SPAM_THRESHOLD_MS) {
        console.log(\`Spam detected from \${remoteJid}, warning sent.\`);
        // We still use sendWhatsAppMessage but we shouldn't update the lastMessageTimes here
        // so they can only successfully send when they wait out the threshold.
        await sendWhatsAppMessage(remoteJid, 'Peringatan: Anda mengirim perintah terlalu cepat (spam). Jika dilakukan berulang kali, bonus Anda akan dipotong!');
        return;
    }`
);

fs.writeFileSync('src/services/WhatsAppService.ts', code);
