import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  radius: integer('radius').notNull().default(50), // in meters
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // WhatsApp number as ID
  name: text('name').notNull(),
  role: text('role').notNull().default('employee'), // 'admin' | 'employee'
  job_position: text('job_position'), // e.g. IT, HR, Marketing
  work_location_id: text('work_location_id').references(() => locations.id),
  password: text('password'), // bcrypt hashed for admin
  holiday_quota: integer('holiday_quota').notNull().default(4),
  late_quota: integer('late_quota').notNull().default(2),
  emergency_late_quota: integer('emergency_late_quota').notNull().default(2),
  early_leave_quota: integer('early_leave_quota').notNull().default(3),
  created_at: integer('created_at').notNull().default(Date.now()),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON string
});

export const phoneNumberRequests = sqliteTable('phone_number_requests', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  new_number: text('new_number').notNull(),
  status: text('status').notNull().default('pending'),
  created_at: integer('created_at').notNull(),
});

export const attendances = sqliteTable('attendances', {
  id: text('id').primaryKey(), // UUID
  user_id: text('user_id').notNull().references(() => users.id),
  date: text('date').notNull(), // YYYY-MM-DD
  check_in_time: text('check_in_time'), // HH:mm:ss
  check_out_time: text('check_out_time'), // HH:mm:ss
  status: text('status'), // 'on_time' | 'late' | 'early_leave' | 'absent' | 'holiday'
  location_status: text('location_status'), // 'in_geofence' | 'out_geofence' | 'returned'
  location_lat: real('location_lat'),
  location_lng: real('location_lng'),
  penalty_amount: integer('penalty_amount').default(0),
  bonus_amount: integer('bonus_amount').default(0),
  overtime_amount: integer('overtime_amount').default(0),
  approval_status: text('approval_status').default('approved'), // 'pending', 'approved', 'rejected'
  notes: text('notes'),
});
