import { describe, expect, it, vi } from 'vitest';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';
import { TEST_JWT_SECRET, asUser } from './as-user';
import { cookieJar } from './cookie-jar';

describe('asUser contra verifyAuthOrAdmin (T-4 CA-4)', () => {
  it('sin sesión rechaza con UNAUTHENTICATED y el texto de siempre', async () => {
    await expect(verifyAuthOrAdmin(false)).rejects.toMatchObject({ code: 'UNAUTHENTICATED', message: 'No autorizado (Token faltante)' });
  });

  it('un admin pasa el control de admin', async () => {
    const admin = await asUser({ role: 'admin' });
    await expect(verifyAuthOrAdmin(true)).resolves.toMatchObject({ id: admin.id, role: 'admin' });
  });

  it('un vendedor pasa el control de sesión', async () => {
    await asUser({ role: 'vendedor' });
    await expect(verifyAuthOrAdmin(false)).resolves.toMatchObject({ role: 'vendedor' });
  });

  it('un vendedor no pasa el control de admin: FORBIDDEN', async () => {
    await asUser({ role: 'vendedor' });
    await expect(verifyAuthOrAdmin(true)).rejects.toMatchObject({ code: 'FORBIDDEN', message: 'Solo los administradores pueden realizar esta acción' });
  });

  it('un usuario desactivado: INACTIVE_USER', async () => {
    await asUser({ role: 'admin', isActive: false });
    await expect(verifyAuthOrAdmin(false)).rejects.toMatchObject({ code: 'INACTIVE_USER' });
  });

  it('un token que no se puede verificar: SESSION_EXPIRED', async () => {
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET);
    cookieJar.set('session', 'token-falso');
    await expect(verifyAuthOrAdmin(false)).rejects.toMatchObject({ code: 'SESSION_EXPIRED', message: 'El token es inválido o ha expirado' });
  });

  it('cada test arranca sin sesión', () => {
    expect(cookieJar.get('session')).toBeUndefined();
  });
});
