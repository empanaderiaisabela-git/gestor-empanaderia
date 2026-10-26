import { describe, expect, it } from 'vitest';
import { canVisit, homeFor, navigationFor } from './navigation';

const labels = (role: 'admin' | 'vendedor'): string[] => navigationFor(role).map((item) => item.label);

describe('menú por rol (US-2 CA-1)', () => {
  it('el vendedor ve Ventas/Pedidos, Stock y Clientes, en ese orden; nunca Auditoría', () => {
    expect(labels('vendedor')).toEqual(['Ventas/Pedidos', 'Stock', 'Clientes']);
  });

  it('el admin ve las secciones que ya existen en el orden del local', () => {
    expect(labels('admin')).toEqual(['Estadísticas', 'Stock', 'Ventas/Pedidos', 'Promociones', 'Clientes', 'Proveedores', 'Alta de productos', 'Tarjetas', 'Usuarios', 'Auditoría']);
  });

  it('"Dashboard" pasó a llamarse "Estadísticas" (CA-2)', () => {
    expect(navigationFor('admin')[0]).toMatchObject({ href: '/', label: 'Estadísticas' });
  });
});

describe('a dónde entra y a dónde puede ir cada rol (US-2 CA-4)', () => {
  it('después del login el admin va a Estadísticas y el vendedor a Ventas/Pedidos', () => {
    expect(homeFor('admin')).toBe('/');
    expect(homeFor('vendedor')).toBe('/ventas');
  });

  it.each(['/ventas', '/stock', '/clientes', '/clientes/123'])('el vendedor puede entrar a %s', (path) => {
    expect(canVisit('vendedor', path)).toBe(true);
  });

  it.each(['/', '/logs', '/usuarios', '/proveedores', '/categorias', '/alta-de-productos', '/productos', '/ventasx', '/promociones', '/tarjetas'])('el vendedor no puede entrar a %s', (path) => {
    expect(canVisit('vendedor', path)).toBe(false);
  });

  it('el admin puede entrar a todas las secciones del menú', () => {
    expect(navigationFor('admin').every((item) => canVisit('admin', item.href))).toBe(true);
  });
});
