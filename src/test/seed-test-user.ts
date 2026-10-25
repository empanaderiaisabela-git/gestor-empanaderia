import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import type { Role } from '@/features/auth/domain/auth.schema';
import { TEST_USER_IDS } from './as-user';

export async function seedTestUser(role: Role): Promise<void> {
  await db.insert(users).values({ id: TEST_USER_IDS[role], username: role, passwordHash: 'sin-uso', role });
}
