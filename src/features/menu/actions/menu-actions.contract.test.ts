import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fakeMenu } from '../testing/fake-menu-unit-of-work';
import { createMenuItemAction } from './create-menu-item';
import { deleteMenuItemAction } from './delete-menu-item';
import { fetchMenuItems } from './fetch-menu-items';
import { toggleMenuItemActiveAction } from './toggle-menu-item-active';
import { updateMenuItemAction } from './update-menu-item';

vi.mock('@/features/menu/repository/menu-unit-of-work', async () => {
  const { fakeMenu: fake } = await import('../testing/fake-menu-unit-of-work');
  return { drizzleMenuUnitOfWork: fake };
});

const SANGUCHE = { group: 'sanguches' as const, name: 'Primavera' };
const EMPANADA = { group: 'empanadas' as const, name: 'Carne suave' };

describe('acciones de Alta de productos (camino feliz)', () => {
  beforeEach(async () => {
    fakeMenu.reset();
    await asUser({ role: 'admin' });
  });

  it('crea, edita, desactiva, reactiva y borra con los mensajes de siempre', async () => {
    const created = await createMenuItemAction(SANGUCHE);
    expect(created).toMatchObject({ success: true, message: 'Se registró el producto', data: { name: 'Primavera', unitCost: null, stock: 0, price1: null, price12: null, version: 1 } });
    const id = created.success ? created.data.id : '';
    expect(await updateMenuItemAction(id, { name: 'Primavera especial', version: 1 })).toMatchObject({ success: true, message: 'Se actualizó el producto', data: { name: 'Primavera especial', version: 2 } });
    expect(await toggleMenuItemActiveAction({ id, isActive: false, version: 2 })).toEqual({ success: true, message: 'Se desactivó el producto' });
    expect(await toggleMenuItemActiveAction({ id, isActive: true, version: 3 })).toEqual({ success: true, message: 'Se activó el producto' });
    expect(await deleteMenuItemAction({ id, version: 4 })).toEqual({ success: true, message: 'Se eliminó el producto' });
  });

  it('el vendedor también lista los productos (los necesita para vender)', async () => {
    await createMenuItemAction(EMPANADA);
    await asUser({ role: 'vendedor' });
    expect(await fetchMenuItems()).toMatchObject([{ group: 'empanadas', name: 'Carne suave', price1: null }]);
  });

  it('el vendedor no recibe el costo; el admin sí (pregunta abierta de US-4 y BUG-8)', async () => {
    await fakeMenu.read.items.insert({ ...EMPANADA, unitCost: 400 });
    expect(await fetchMenuItems()).toMatchObject([{ unitCost: 400 }]);
    await asUser({ role: 'vendedor' });
    expect(await fetchMenuItems()).toMatchObject([{ unitCost: null }]);
  });

  it('VALIDATION: el alta ya no acepta costo ni precios', async () => {
    const withCost = { ...EMPANADA, unitCost: 400 };
    expect(await createMenuItemAction(withCost)).toMatchObject({ code: 'VALIDATION' });
  });

  it('sin sesión, listar devuelve una lista vacía', async () => {
    await createMenuItemAction(EMPANADA);
    const { cookieJar } = await import('@/test/cookie-jar');
    cookieJar.clear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await fetchMenuItems()).toEqual([]);
  });

  it('fuzz: ninguna entrada hace lanzar a crear ni devuelve un error fuera del catálogo', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(createMenuItemAction, undefined, [input]);
        expect(result.success || ['VALIDATION', 'DUPLICATE'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
