import { afterEach, describe, expect, it, vi } from 'vitest';
import { signToken, verifyToken } from './jwt';

const SESSION = { id: 'usuario-1', username: 'admin', role: 'admin' } as const;
const SECRET = 'secreto-de-prueba-suficientemente-largo';
const MISSING_SECRET = 'Falta la variable de entorno JWT_SECRET.';

describe('jwt', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('firma y verifica una sesión cuando JWT_SECRET está definida', async () => {
    vi.stubEnv('JWT_SECRET', SECRET);
    const token = await signToken(SESSION);
    await expect(verifyToken(token)).resolves.toEqual(SESSION);
  });

  it('rechaza un token firmado con otro secreto', async () => {
    vi.stubEnv('JWT_SECRET', SECRET);
    const token = await signToken(SESSION);
    vi.stubEnv('JWT_SECRET', 'otro-secreto-distinto-del-original');
    await expect(verifyToken(token)).rejects.toThrow('El token es inválido o ha expirado');
  });

  it('regression BUG-2: sin JWT_SECRET no se puede firmar una sesión', async () => {
    vi.stubEnv('JWT_SECRET', undefined);
    await expect(signToken(SESSION)).rejects.toThrow(MISSING_SECRET);
  });

  it('regression BUG-2: sin JWT_SECRET no se puede verificar una sesión', async () => {
    vi.stubEnv('JWT_SECRET', SECRET);
    const token = await signToken(SESSION);
    vi.stubEnv('JWT_SECRET', undefined);
    await expect(verifyToken(token)).rejects.toThrow(MISSING_SECRET);
  });
});
