import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { AppError } from '@/lib/errors';
import { type UserDef, userRowSchema } from '@/features/user/domain/user.schema';
import { userRepository } from '@/features/user/repository/user.repository';

export async function verifyAuthOrAdmin(requireAdmin = true): Promise<UserDef> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) throw new AppError('UNAUTHENTICATED');

  const sessionUser = await verifyToken(token);

  const dbUser = await userRepository.getUserById(sessionUser.id);
  if (!dbUser || !dbUser.isActive) throw new AppError('INACTIVE_USER');

  if (requireAdmin && dbUser.role !== 'admin') throw new AppError('FORBIDDEN');

  return userRowSchema.parse(dbUser);
}
