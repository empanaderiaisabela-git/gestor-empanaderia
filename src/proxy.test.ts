import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Role } from '@/features/auth/domain/auth.schema';
import { signToken } from '@/lib/auth/jwt';
import { TEST_JWT_SECRET, TEST_USER_IDS } from '@/test/as-user';
import { proxy } from './proxy';

async function request(path: string, session?: string): Promise<NextRequest> {
  const headers = session === undefined ? undefined : { cookie: `session=${session}` };
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

async function tokenFor(role: Role): Promise<string> {
  return signToken({ id: TEST_USER_IDS[role], username: role, role });
}

async function outcome(path: string, session?: string): Promise<string> {
  const response = await proxy(await request(path, session));
  const location = response.headers.get('location');
  return location ? `→ ${new URL(location).pathname}` : 'pasa';
}

describe('proxy.ts usa el mismo menú por rol (US-2)', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET);
  });

  it('el vendedor entra a las secciones de su menú', async () => {
    const token = await tokenFor('vendedor');
    expect(await Promise.all(['/ventas', '/productos', '/clientes'].map((path) => outcome(path, token)))).toEqual(['pasa', 'pasa', 'pasa']);
  });

  it('el vendedor que entra a una sección ajena, o a Estadísticas, va a Ventas/Pedidos', async () => {
    const token = await tokenFor('vendedor');
    expect(await Promise.all(['/', '/logs', '/usuarios', '/proveedores'].map((path) => outcome(path, token)))).toEqual(['→ /ventas', '→ /ventas', '→ /ventas', '→ /ventas']);
  });

  it('con sesión, /login lleva al inicio de cada rol', async () => {
    expect(await outcome('/login', await tokenFor('admin'))).toBe('→ /');
    expect(await outcome('/login', await tokenFor('vendedor'))).toBe('→ /ventas');
  });

  it('el admin entra a todo el panel', async () => {
    const token = await tokenFor('admin');
    expect(await Promise.all(['/', '/logs', '/usuarios', '/ventas'].map((path) => outcome(path, token)))).toEqual(['pasa', 'pasa', 'pasa', 'pasa']);
  });

  it('sin sesión sólo pasan las rutas públicas y los archivos estáticos', async () => {
    expect(await outcome('/ventas')).toBe('→ /home');
    expect(await outcome('/login')).toBe('pasa');
    expect(await outcome('/home')).toBe('pasa');
    expect(await outcome('/brand/logo-isabela.png')).toBe('pasa');
  });

  it('una sesión inválida se borra y lleva al catálogo', async () => {
    const response = await proxy(await request('/ventas', 'token-falso'));
    expect(new URL(response.headers.get('location') ?? '').pathname).toBe('/home');
    expect(response.headers.get('set-cookie')).toContain('session=;');
  });
});
