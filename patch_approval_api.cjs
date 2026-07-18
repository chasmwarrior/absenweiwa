const fs = require('fs');
let code = fs.readFileSync('src/api/api.ts', 'utf8');

const oldApprovalBlock = `    await db.update(attendances).set(updateData).where(eq(attendances.id, req.params.id));

    const attRecord = await db.select().from(attendances).where(eq(attendances.id, req.params.id)).limit(1);
    if (attRecord.length > 0) {
      const user = userSyncService.getUser(attRecord[0].user_id);
      if (user) {
let statusName = 'Absensi';
        if (attRecord[0].status === 'holiday') statusName = 'Libur/Off';
        else if (attRecord[0].status === 'late') statusName = 'Telat';
        else if (attRecord[0].status === 'on_time') statusName = 'Masuk/In (Luar Geofence)';
        else if (attRecord[0].status === 'overtime') statusName = 'Pulang/Out (Luar Geofence)';

        let msg = \`Permohonan \${statusName} Anda pada tanggal \${attRecord[0].date} telah *\${status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}* oleh Admin.\`;
        msg += \`\\nSisa kuota telat Anda: \${user.late_quota} hari.\`;
        await sendWhatsAppMessage(user.id + '@s.whatsapp.net', msg);
      }
    }`;

const newApprovalBlock = `    await db.update(attendances).set(updateData).where(eq(attendances.id, req.params.id));

    const attRecord = await db.select().from(attendances).where(eq(attendances.id, req.params.id)).limit(1);
    if (attRecord.length > 0) {
      const dbUserResult = await db.select().from(users).where(eq(users.id, attRecord[0].user_id)).limit(1);
      if (dbUserResult.length > 0) {
        let user = dbUserResult[0];
        let statusName = 'Absensi';
        const finalStatus = attRecord[0].status;
        let deductMsg = '';

        // Process quota deductions if approved
        if (status === 'approved') {
            const updates: any = {};
            if (finalStatus === 'holiday' || finalStatus === 'telat (potong libur)' || (attRecord[0].notes && attRecord[0].notes.toLowerCase().includes('potong libur'))) {
                statusName = 'Libur/Off';
                if (user.holiday_quota > 0) updates.holiday_quota = user.holiday_quota - 1;
                deductMsg = \`\\nSisa Kuota Libur: \${updates.holiday_quota !== undefined ? updates.holiday_quota : user.holiday_quota}\`;
            } else if (finalStatus === 'late' && attRecord[0].notes && attRecord[0].notes.toLowerCase().includes('darurat')) {
                statusName = 'Telat Darurat';
                if (user.emergency_late_quota > 0) updates.emergency_late_quota = user.emergency_late_quota - 1;
                deductMsg = \`\\nSisa Kuota Telat Darurat: \${updates.emergency_late_quota !== undefined ? updates.emergency_late_quota : user.emergency_late_quota}\`;
            } else if (finalStatus === 'late') {
                statusName = 'Telat';
                if (user.late_quota > 0) updates.late_quota = user.late_quota - 1;
                deductMsg = \`\\nSisa Kuota Telat: \${updates.late_quota !== undefined ? updates.late_quota : user.late_quota}\`;
            } else if (finalStatus === 'early_leave') {
                statusName = 'Pulang Cepat';
                if (user.early_leave_quota > 0) updates.early_leave_quota = user.early_leave_quota - 1;
                deductMsg = \`\\nSisa Kuota Pulang Cepat: \${updates.early_leave_quota !== undefined ? updates.early_leave_quota : user.early_leave_quota}\`;
            } else if (finalStatus === 'on_time') {
                statusName = 'Masuk/In (Luar Geofence)';
            } else if (finalStatus === 'overtime') {
                statusName = 'Pulang/Out (Luar Geofence)';
            }

            if (Object.keys(updates).length > 0) {
                await db.update(users).set(updates).where(eq(users.id, user.id));
                // fetch updated user memory
                userSyncService.syncUsers();
            }
        }

        let msg = \`Permohonan \${statusName} Anda pada tanggal \${attRecord[0].date} telah *\${status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}* oleh Admin.\\nCatatan: \${updateData.notes}\`;
        if (status === 'approved' && deductMsg) {
            msg += deductMsg;
        }
        await sendWhatsAppMessage(user.id + '@s.whatsapp.net', msg);
      }
    }`;

code = code.replace(oldApprovalBlock, newApprovalBlock);
fs.writeFileSync('src/api/api.ts', code);
