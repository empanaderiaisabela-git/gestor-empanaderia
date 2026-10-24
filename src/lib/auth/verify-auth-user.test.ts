import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { userRepository } from '@/features/user/repository/user.repository';
import { asUser } from '@/test/as-user';
import { verifyAuthOrAdmin } from './utils';

type AuthenticatedUser = Awaited<ReturnType<typeof verifyAuthOrAdmin>>;

describe('el usuario que devuelve verifyAuthOrAdmin (BUG-7 CA-3)', () => {
  it('su tipo no tiene passwordHash', () => {
    expectTypeOf<AuthenticatedUser>().not.toHaveProperty('passwordHash');
    expectTypeOf<AuthenticatedUser>().toHaveProperty('role');
  });

  it('regression BUG-7: aunque el repositorio traiga el hash, no lo devuelve', async () => {
    const user = await asUser({ role: 'admin' });
    vi.spyOn(userRepository, 'getUserById').mockResolvedValue({ ...user, passwordHash: '$2b$10$hash' });
    const authenticated = await verifyAuthOrAdmin(true);
    expect(authenticated).toMatchObject({ id: user.id, role: 'admin' });
    expect(authenticated).not.toHaveProperty('passwordHash');
  });
});
