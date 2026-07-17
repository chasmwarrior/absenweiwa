const fs = require('fs');
let code = fs.readFileSync('src/services/WhatsAppService.ts', 'utf8');

const oldCheckOutBlock = `    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, user.id), eq(attendances.date, today))).limit(1);
    if (existing.length === 0) {
        await sendWhatsAppMessage(remoteJid, replaceVars(replies.not_checked_in || 'Anda belum absen masuk.', varData));
        return;
    }

    const attendance = existing[0];`;

const newCheckOutBlock = `    const existing = await db.select().from(attendances).where(and(eq(attendances.user_id, user.id), eq(attendances.date, today))).limit(1);
    let attendance = existing.length > 0 ? existing[0] : null;

    if (!attendance) {
        // User forgot to check-in, but is checking out.
        // We'll create a dummy check-in record marked as 'late' and pending admin review.
        const id = crypto.randomUUID();
        await db.insert(attendances).values({
            id,
            user_id: user.id,
            date: today,
            check_in_time: null, // no check in time
            status: 'late',
            penalty_amount: 0,
            bonus_amount: 0,
            approval_status: 'pending',
            notes: 'Lupa Absen Masuk'
        });
        const refetch = await db.select().from(attendances).where(eq(attendances.id, id)).limit(1);
        attendance = refetch[0];
    }`;

code = code.replace(oldCheckOutBlock, newCheckOutBlock);
fs.writeFileSync('src/services/WhatsAppService.ts', code);
