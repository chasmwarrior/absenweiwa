import { db } from './src/db/index.ts';
import { users, attendances } from './src/db/schema.ts';
import crypto from 'crypto';
import { format } from 'date-fns';

async function seed() {
    const today = format(new Date(), 'yyyy-MM-dd');
    await db.insert(users).values({
        id: 'user_dummy',
        name: 'Dummy Employee',
        role: 'employee',
        holiday_quota: 4,
        late_quota: 2,
        emergency_late_quota: 2,
        early_leave_quota: 3,
        created_at: Date.now()
    });

    await db.insert(attendances).values({
        id: crypto.randomUUID(),
        user_id: 'user_dummy',
        date: today,
        check_in_time: '14:30:00',
        status: 'late',
        penalty_amount: 0,
        bonus_amount: 0,
        approval_status: 'pending',
        notes: 'Telat (Luar Geofence)'
    });
    console.log("Pending actions seeded.");
}
seed().catch(console.error);
