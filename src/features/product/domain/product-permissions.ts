import type { Role } from '@/features/auth/domain/auth.schema';

const PHOTO_MANAGERS: readonly Role[] = ['admin', 'vendedor'];

export function canManagePhotos(role: string | undefined): boolean {
  return PHOTO_MANAGERS.some((allowed) => allowed === role);
}
