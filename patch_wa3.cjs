const fs = require('fs');
let content = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

// Add lastMessageTimes at the top level
if (!content.includes('const lastMessageTimes = new Map')) {
    content = content.replace(
        "const db = drizzle",
        "const lastMessageTimes = new Map<string, number>();\nconst SPAM_THRESHOLD_MS = 2500;\n\nconst db = drizzle"
    );
}

// Modify handleIncomingMessage to add spam filter and handle daftar/ganti nomer
const newIncomingLogic = `
async function handleIncomingMessage(remoteJid: string, textMessage: string, locationData: any) {
    if (!textMessage && !locationData) return;
    
    // Anti-spam logic (Unofficial API protection)
    const now = Date.now();
    const lastTime = lastMessageTimes.get(remoteJid) || 0;
    if (now - lastTime < SPAM_THRESHOLD_MS) {
        console.log(\`Spam detected from \${remoteJid}, ignoring.\`);
        return;
    }
    lastMessageTimes.set(remoteJid, now);

    const senderNumber = remoteJid.split('@')[0];
    const rawCommand = textMessage.trim().toLowerCase();
    const command = rawCommand.replace(/^!/, ''); // Strip ! at the beginning for all commands

    // Global Commands (Bypass Registration Check)
    if (command === 'daftar' || command === 'ganti nomer' || command === 'gantinomer') {
        const appSettingsRes = await db.select().from(settings).where(eq(settings.key, 'app_settings')).limit(1);
        const appSettings = appSettingsRes.length > 0 ? JSON.parse(appSettingsRes[0].value) : null;
        // The frontend uses window.location.origin, but backend has no concept of it unless configured.
        // We will default to APP_URL env or a generic message if not set.
        const appUrl = process.env.APP_URL || appSettings?.app_url || 'http://localhost:3000';
        
        if (command === 'daftar') {
            await sendWhatsAppMessage(remoteJid, \`Silakan melakukan pendaftaran (oleh Admin) atau hubungi admin di link berikut:\\n\${appUrl}\`);
        } else {
            await sendWhatsAppMessage(remoteJid, \`Silakan ajukan ganti nomor melalui link berikut:\\n\${appUrl}/change-number\`);
        }
        return;
    }
`;

content = content.replace(
    /async function handleIncomingMessage\(remoteJid: string, textMessage: string, locationData: any\) \{[\s\S]*?const command = textMessage\.trim\(\)\.toLowerCase\(\);/,
    newIncomingLogic.trim()
);

// Update all command comparisons to remove ! from cmds
content = content.replace(/command === cmds\.check_in/g, "command === (cmds.check_in || '').replace(/^!/, '')");
content = content.replace(/command === cmds\.check_out/g, "command === (cmds.check_out || '').replace(/^!/, '')");
content = content.replace(/command === \(cmds\.leave \|\| '!izin'\)/g, "command === ((cmds.leave || 'izin').replace(/^!/, ''))");
content = content.replace(/command === \(cmds\.cancel_leave \|\| '!batal_izin'\)/g, "command === ((cmds.cancel_leave || 'batal_izin').replace(/^!/, ''))");
content = content.replace(/command === cmds\.info/g, "command === (cmds.info || '').replace(/^!/, '')");
content = content.replace(/command\.startsWith\('!gantinomer'\)/g, "command.startsWith('gantinomer')");

// We might want to remove the inline handleChangeNumberRequest logic, because now it sends a link.
// If command === gantinomer is caught at the top, it won't reach the inner check, which is fine!

fs.writeFileSync('src/services/WhatsAppService.ts', content);
