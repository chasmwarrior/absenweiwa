import { db } from '../db/index.js';
import { users } from '../db/schema.js';

class UserSyncService {
  private userCache: Map<string, any> = new Map();
  private isInitialized = false;

  async initialize() {
    const allUsers = await db.select().from(users);
    this.userCache.clear();
    for (const u of allUsers) {
      this.userCache.set(u.id, u);
    }
    this.isInitialized = true;
    console.log(`UserSyncService initialized with ${this.userCache.size} users.`);
  }

  async syncUser(userId: string) {
    const { eq } = await import('drizzle-orm');
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userResult.length > 0) {
      this.userCache.set(userId, userResult[0]);
    } else {
      this.userCache.delete(userId);
    }
    console.log(`UserSyncService synced user ${userId}`);
  }

  async syncAll() {
    await this.initialize();
  }

  getUser(userId: string) {
    if (!this.isInitialized) {
      console.warn("UserSyncService accessed before initialization!");
    }
    return this.userCache.get(userId) || null;
  }
  
  deleteUser(userId: string) {
      this.userCache.delete(userId);
  }
}

export const userSyncService = new UserSyncService();
