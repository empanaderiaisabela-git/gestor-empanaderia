import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { TEST_USER_IDS, asUser } from '@/test/as-user';
import { truncateAll } from '@/test/truncate-all';
import { createUserAction, updateUserAction } from './user.actions';

const HASH_LEAK = /passwordHash|password_hash|\$2[aby]\$/;

async function insertUser(values: { username: string; isActive?: boolean; id?: string }): Promise<string> {
  const [user] = await db.insert(users).values({ role: 'vendedor', passwordHash: '$2b$10$hash-de-prueba', ...values }).returning({ id: users.id });
  return user.id;
}

describe('regression BUG-7: crear y editar usuarios no devuelven el password_hash', () => {
  beforeEach(async () => {
    await truncateAll();
    await db.insert(users).values({ id: TEST_USER_IDS.admin, username: 'admin-de-tests', passwordHash: 'x', role: 'admin' });
    await asUser({ role: 'admin' });
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('crear un usuario', async () => {
    const result = await createUserAction({ username: 'nuevo', role: 'vendedor', password: 'secreta123' });
    expect(result).toMatchObject({ success: true, data: { username: 'nuevo', role: 'vendedor', isActive: true } });
    expect(JSON.stringify(result)).not.toMatch(HASH_LEAK);
  });

  it('reactivar un usuario inactivo al crearlo de nuevo', async () => {
    await insertUser({ username: 'inactivo', isActive: false });
    const result = await createUserAction({ username: 'inactivo', role: 'vendedor', password: 'secreta123' });
    expect(result).toMatchObject({ success: true, data: { username: 'inactivo', isActive: true } });
    expect(JSON.stringify(result)).not.toMatch(HASH_LEAK);
  });

  it('editar un usuario', async () => {
    const id = await insertUser({ username: 'original' });
    const result = await updateUserAction(id, { username: 'renombrado', version: 1 });
    expect(result).toMatchObject({ success: true, data: { id, username: 'renombrado', version: 2 } });
    expect(JSON.stringify(result)).not.toMatch(HASH_LEAK);
    const [stored] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, id));
    expect(stored.passwordHash).toBe('$2b$10$hash-de-prueba');
  });
});
