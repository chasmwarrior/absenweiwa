const fs = require('fs');
let code = fs.readFileSync('src/api/api.ts', 'utf8');

code = code.replace(
  /apiRouter\.put\('\/attendances\/:id\/approval', async \(req, res\) => \{\n  try \{\n    const \{ status \} = req\.body;\n    await db\.update\(attendances\)\.set\(\{ approval_status: status, notes: 'Diproses melalui Pending Actions' \}\)\.where\(eq\(attendances\.id, req\.params\.id\)\);/,
  `apiRouter.put('/attendances/:id/approval', async (req, res) => {
  try {
    const { status, notes, penalty_amount, bonus_amount, attendance_status } = req.body;
    const updateData: any = {
        approval_status: status,
        notes: notes || (status === 'approved' ? 'Disetujui Admin' : 'Ditolak Admin')
    };
    if (penalty_amount !== undefined) updateData.penalty_amount = penalty_amount;
    if (bonus_amount !== undefined) updateData.bonus_amount = bonus_amount;
    if (attendance_status !== undefined) updateData.status = attendance_status;

    await db.update(attendances).set(updateData).where(eq(attendances.id, req.params.id));`
);

fs.writeFileSync('src/api/api.ts', code);
