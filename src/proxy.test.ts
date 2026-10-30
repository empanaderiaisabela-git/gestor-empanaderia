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
    vi.stubEnv('PUBLIC_CATALOG', 'true');
  });

  it('el vendedor entra a las secciones de su menú', async () => {
    const token = await tokenFor('vendedor');
    expect(await Promise.all(['/ventas', '/stock', '/clientes'].map((path) => outcome(path, token)))).toEqual(['pasa', 'pasa', 'pasa']);
  });

  it('el vendedor que entra a una sección ajena, o a Estadísticas, va a Ventas/Pedidos (Stock sí lo deja, US-31)', async () => {
    const token = await tokenFor('vendedor');
    expect(await Promise.all(['/', '/logs', '/usuarios', '/productos', '/gastos'].map((path) => outcome(path, token)))).toEqual(['→ /ventas', '→ /ventas', '→ /ventas', '→ /ventas', '→ /ventas']);
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

describe('sin web pública se entra por /login (US-43)', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET);
    vi.stubEnv('PUBLIC_CATALOG', 'false');
  });

  it.each([undefined, '', 'false'])('con PUBLIC_CATALOG=%s, sin sesión la raíz, el panel y todo lo público llevan a /login', async (value) => {
    vi.stubEnv('PUBLIC_CATALOG', value);
    const paths = ['/', '/ventas', '/home', '/product/abc', '/api/public/catalog'];
    expect(await Promise.all(paths.map((path) => outcome(path)))).toEqual(paths.map(() => '→ /login'));
    expect(await outcome('/login')).toBe('pasa');
  });

  it('una sesión inválida se borra y lleva a /login', async () => {
    const response = await proxy(await request('/ventas', 'token-falso'));
    expect(new URL(response.headers.get('location') ?? '').pathname).toBe('/login');
    expect(response.headers.get('set-cookie')).toContain('session=;');
  });

  it('con sesión, el admin sigue viendo /home como vista previa y el vendedor va a su inicio', async () => {
    expect(await outcome('/home', await tokenFor('admin'))).toBe('pasa');
    expect(await outcome('/home', await tokenFor('vendedor'))).toBe('→ /ventas');
  });
});
