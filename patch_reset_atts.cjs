const fs = require('fs');
let code = fs.readFileSync('src/api/api.ts', 'utf8');

const resetAllBlock = `// POST reset all data`;
const resetAttsBlock = `// POST reset attendance data only
apiRouter.post('/data/reset-attendances', async (req, res) => {
  try {
    await db.delete(attendances);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST reset all data`;

code = code.replace(resetAllBlock, resetAttsBlock);
fs.writeFileSync('src/api/api.ts', code);
