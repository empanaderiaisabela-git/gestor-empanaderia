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

const SANGUCHE = { group: 'sanguches' as const, name: 'Primavera', unitCost: 500, prices: { price1: 1500, price3: 4200, price6: 8000, price12: 15000 } };
const EMPANADA = { group: 'empanadas' as const, name: 'Carne suave', unitCost: 400 };

describe('acciones de Alta de productos (camino feliz)', () => {
  beforeEach(async () => {
    fakeMenu.reset();
    await asUser({ role: 'admin' });
  });

  it('crea, edita, desactiva, reactiva y borra con los mensajes de siempre', async () => {
    const created = await createMenuItemAction(SANGUCHE);
    expect(created).toMatchObject({ success: true, message: 'Producto registrado/a exitosamente', data: { name: 'Primavera', unitCost: 500, stock: 0, price12: 15000, version: 1 } });
    const id = created.success ? created.data.id : '';
    const edit = { name: 'Primavera especial', unitCost: 550, prices: { ...SANGUCHE.prices, price1: 1600 }, version: 1 };
    expect(await updateMenuItemAction(id, edit)).toMatchObject({ success: true, message: 'Producto actualizado/a exitosamente', data: { name: 'Primavera especial', price1: 1600, version: 2 } });
    expect(await toggleMenuItemActiveAction({ id, isActive: false, version: 2 })).toEqual({ success: true, message: 'Producto desactivado/a exitosamente' });
    expect(await toggleMenuItemActiveAction({ id, isActive: true, version: 3 })).toEqual({ success: true, message: 'Producto activado/a exitosamente' });
    expect(await deleteMenuItemAction({ id, version: 4 })).toEqual({ success: true, message: 'Producto eliminado/a exitosamente' });
  });

  it('el vendedor también lista los productos (los necesita para vender)', async () => {
    await createMenuItemAction(EMPANADA);
    await asUser({ role: 'vendedor' });
    expect(await fetchMenuItems()).toMatchObject([{ group: 'empanadas', name: 'Carne suave', price1: null }]);
  });

  it('el vendedor no recibe el costo; el admin sí (pregunta abierta de US-4 y BUG-8)', async () => {
    await createMenuItemAction(EMPANADA);
    expect(await fetchMenuItems()).toMatchObject([{ unitCost: 400 }]);
    await asUser({ role: 'vendedor' });
    expect(await fetchMenuItems()).toMatchObject([{ unitCost: null }]);
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
