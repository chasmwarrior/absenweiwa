const fs = require('fs');
let code = fs.readFileSync('src/api/api.ts', 'utf8');

const statsPageEndpointOld = `// GET stats-page data
apiRouter.get('/stats-page/:id', async (req, res) => {
  try {
    const { month } = req.query; // format yyyy-MM
    const userRes = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);`;

const statsPageEndpointNew = `
// POST setup PIN
apiRouter.post('/stats-page/:id/setup-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length < 4) return res.status(400).json({ error: 'PIN minimal 4 karakter' });
    await db.update(users).set({ pin }).where(eq(users.id, req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST verify PIN
apiRouter.post('/stats-page/:id/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const userRes = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (userRes.length === 0) return res.status(404).json({ error: 'Not found' });

    // allow bypass if PIN is not set yet so frontend can prompt setup
    if (!userRes[0].pin) return res.json({ success: true, needsSetup: true });

    if (userRes[0].pin === pin) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'PIN salah' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats-page data
apiRouter.get('/stats-page/:id', async (req, res) => {
  try {
    const { month, pin } = req.query; // format yyyy-MM
    const userRes = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (userRes.length > 0 && userRes[0].pin && userRes[0].pin !== pin) {
        return res.status(401).json({ error: 'Unauthorized PIN' });
    }`;

code = code.replace(statsPageEndpointOld, statsPageEndpointNew);
fs.writeFileSync('src/api/api.ts', code);
