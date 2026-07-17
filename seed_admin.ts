import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import bcrypt from 'bcryptjs';

async function seed() {
    const password = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
        id: 'admin',
        name: 'Super Admin',
        role: 'admin',
        password
    });
    console.log("Admin created.");
}
seed().catch(console.error);
