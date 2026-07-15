import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import path from 'path';

// Setup sqlite locally. We'll use local.db
const client = createClient({
  url: `file:${path.join(process.cwd(), 'local.db')}`,
});

export const db = drizzle(client, { schema });
