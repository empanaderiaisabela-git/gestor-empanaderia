import * as bcrypt from 'bcrypt';
import { inArray } from 'drizzle-orm';
import { db } from '..';
import { users } from '../schema';
import { SEED_USERS, usersToCreate } from './seed-missing-users';

async function seedUsers(): Promise<void> {
  const usernames = SEED_USERS.map((user) => user.username);
  const existing = await db.select({ username: users.username }).from(users).where(inArray(users.username, usernames));
  const missing = usersToCreate(existing.map((row) => row.username));
  for (const { username, password, role } of missing) {
    await db.insert(users).values({ username, passwordHash: await bcrypt.hash(password, 10), role });
    console.log(`Usuario creado: ${username} (${role})`);
  }
  console.log(missing.length === 0 ? 'Los usuarios iniciales ya existían: no se modificó ninguno.' : 'Listo.');
}

seedUsers().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error('Error al crear los usuarios iniciales:', error);
    process.exit(1);
  }
);
