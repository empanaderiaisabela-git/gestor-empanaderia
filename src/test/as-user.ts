import { vi } from 'vitest';
import type { Role } from '@/features/auth/domain/auth.schema';
import { userRepository } from '@/features/user/repository/user.repository';
import { signToken } from '@/lib/auth/jwt';
import { cookieJar } from './cookie-jar';

export const TEST_JWT_SECRET = 'secreto-de-tests-no-es-real-0123456789';

export const TEST_USER_IDS: Readonly<Record<Role, string>> = {
  admin: '00000000-0000-4000-8000-00000000000a',
  vendedor: '00000000-0000-4000-8000-00000000000b',
};

type AsUserOptions = { role: Role; isActive?: boolean; username?: string };

export type TestUser = {
  id: string;
  username: string;
  role: Role;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function asUser({ role, isActive = true, username = role }: AsUserOptions): Promise<TestUser> {
  const user: TestUser = { id: TEST_USER_IDS[role], username, role, isActive, version: 1, createdAt: new Date(0), updatedAt: new Date(0) };
  vi.stubEnv('JWT_SECRET', process.env.JWT_SECRET || TEST_JWT_SECRET);
  cookieJar.set('session', await signToken({ id: user.id, username, role }));
  vi.spyOn(userRepository, 'getUserById').mockResolvedValue(user);
  return user;
}
