const dbSetup = require('./src/db/index.js');
const schema = require('./src/db/schema.js');
const drizzle = require('drizzle-orm');
const bcrypt = require('bcryptjs');

async function seed() {
    const password = await bcrypt.hash('admin123', 10);
    await dbSetup.db.insert(schema.users).values({
        id: 'admin',
        name: 'Super Admin',
        role: 'admin',
        password
    });
    console.log("Admin created.");
}
seed().catch(console.error);
