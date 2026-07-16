const fs = require('fs');
let content = fs.readFileSync('src/api/api.ts', 'utf8');

content = content.replace(
  "import { settings, users, locations, attendances } from '../db/schema.js';",
  "import { settings, users, locations, attendances, phoneNumberRequests } from '../db/schema.js';"
);

const phoneRequestEndpoints = `
// GET Phone Number Requests
apiRouter.get('/phone-requests', async (req, res) => {
  try {
    const requests = await db.select({
      id: phoneNumberRequests.id,
      user_id: phoneNumberRequests.user_id,
      new_number: phoneNumberRequests.new_number,
      status: phoneNumberRequests.status,
      created_at: phoneNumberRequests.created_at,
      user_name: users.name
    }).from(phoneNumberRequests)
      .leftJoin(users, eq(phoneNumberRequests.user_id, users.id))
      .orderBy(desc(phoneNumberRequests.created_at));
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST Approve/Reject Phone Request
apiRouter.post('/phone-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const request = await db.select().from(phoneNumberRequests).where(eq(phoneNumberRequests.id, id)).limit(1);
    if (request.length === 0) return res.status(404).json({ error: 'Request not found' });
    
    if (status === 'rejected') {
      await db.update(phoneNumberRequests).set({ status: 'rejected' }).where(eq(phoneNumberRequests.id, id));
      return res.json({ success: true });
    }

    if (status === 'approved') {
      const oldNumber = request[0].user_id;
      const newNumber = request[0].new_number;

      // Check if new number already exists
      const existingUser = await db.select().from(users).where(eq(users.id, newNumber)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'New number already registered to another user' });
      }

      await db.transaction(async (tx) => {
        const oldUser = await tx.select().from(users).where(eq(users.id, oldNumber)).limit(1);
        if (oldUser.length > 0) {
          // Insert new user
          await tx.insert(users).values({
            ...oldUser[0],
            id: newNumber
          });
          // Update attendances
          await tx.update(attendances).set({ user_id: newNumber }).where(eq(attendances.user_id, oldNumber));
          // Update requests
          await tx.update(phoneNumberRequests).set({ user_id: newNumber, status: 'approved' }).where(eq(phoneNumberRequests.id, id));
          await tx.update(phoneNumberRequests).set({ user_id: newNumber }).where(eq(phoneNumberRequests.user_id, oldNumber));
          // Delete old user
          await tx.delete(users).where(eq(users.id, oldNumber));
        }
      });
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Invalid status' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
`;

content = content.replace(
  "export const apiRouter = Router();",
  "export const apiRouter = Router();\n" + phoneRequestEndpoints
);

fs.writeFileSync('src/api/api.ts', content);
