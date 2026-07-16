const fs = require('fs');
let content = fs.readFileSync('src/db/schema.ts', 'utf8');
content = content.replace(
  "export const attendances = sqliteTable('attendances', {",
  `export const phoneNumberRequests = sqliteTable('phone_number_requests', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  new_number: text('new_number').notNull(),
  status: text('status').notNull().default('pending'),
  created_at: integer('created_at').notNull(),
});

export const attendances = sqliteTable('attendances', {`
);
fs.writeFileSync('src/db/schema.ts', content);
