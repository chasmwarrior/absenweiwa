const fs = require('fs');
let content = fs.readFileSync('src/api/api.ts', 'utf8');

const postPhoneRequest = `
// POST Public Phone Number Request
apiRouter.post('/phone-requests', async (req, res) => {
  try {
    const { old_number, new_number } = req.body;
    
    // Basic validation
    if (!old_number || !new_number) {
      return res.status(400).json({ error: 'Nomor lama dan nomor baru harus diisi' });
    }
    
    // Check if old user exists
    const oldUser = await db.select().from(users).where(eq(users.id, old_number)).limit(1);
    if (oldUser.length === 0) {
      return res.status(404).json({ error: 'Nomor WhatsApp lama tidak terdaftar di sistem' });
    }
    
    // Check if new number already exists as a user
    const newUserCheck = await db.select().from(users).where(eq(users.id, new_number)).limit(1);
    if (newUserCheck.length > 0) {
      return res.status(400).json({ error: 'Nomor WhatsApp baru sudah terdaftar untuk pengguna lain' });
    }
    
    // Check if pending exists
    const existing = await db.select().from(phoneNumberRequests).where(and(eq(phoneNumberRequests.user_id, old_number), eq(phoneNumberRequests.status, 'pending'))).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Anda sudah memiliki pengajuan ganti nomor yang sedang diproses.' });
    }
    
    const crypto = require('crypto');
    await db.insert(phoneNumberRequests).values({
        id: crypto.randomUUID(),
        user_id: old_number,
        new_number: new_number,
        status: 'pending',
        created_at: Date.now()
    });
    
    res.json({ success: true, message: 'Pengajuan ganti nomor berhasil dikirim dan menunggu persetujuan Admin.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
`;

content = content.replace("// GET Phone Number Requests", postPhoneRequest + "\n// GET Phone Number Requests");

fs.writeFileSync('src/api/api.ts', content);
