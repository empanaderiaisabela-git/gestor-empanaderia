import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { asUser } from '@/test/as-user';
import { fakeMenu } from '../testing/fake-menu-unit-of-work';
import { fetchMenuGroupPrices } from './fetch-menu-group-prices';
import { saveMenuGroupPricesAction } from './save-menu-group-prices';

vi.mock('@/features/menu/repository/menu-unit-of-work', async () => {
  const { fakeMenu: fake } = await import('../testing/fake-menu-unit-of-work');
  return { drizzleMenuUnitOfWork: fake };
});

const EMPANADAS = { group: 'empanadas' as const, prices: { price1: 1200, price3: 3400, price6: 6500, price12: 12000 }, version: 0 };

describe('precios del grupo: acciones (US-3 CA-7)', () => {
  beforeEach(() => {
    fakeMenu.reset();
  });

  it('el admin carga y cambia los precios de las empanadas; el vendedor los lee', async () => {
    await asUser({ role: 'admin' });
    expect(await saveMenuGroupPricesAction(EMPANADAS)).toMatchObject({ success: true, message: 'Precios del grupo guardados exitosamente', data: { group: 'empanadas', price6: 6500, version: 1 } });
    expect(await saveMenuGroupPricesAction({ ...EMPANADAS, prices: { ...EMPANADAS.prices, price1: 1300 }, version: 1 })).toMatchObject({ success: true, data: { price1: 1300, version: 2 } });
    await asUser({ role: 'vendedor' });
    expect(await fetchMenuGroupPrices()).toMatchObject([{ group: 'empanadas', price1: 1300, price12: 12000 }]);
  });

  it('FORBIDDEN: el vendedor no puede cambiar precios; UNAUTHENTICATED sin sesión', async () => {
    expect(await saveMenuGroupPricesAction(EMPANADAS)).toMatchObject({ code: 'UNAUTHENTICATED' });
    await asUser({ role: 'vendedor' });
    expect(await saveMenuGroupPricesAction(EMPANADAS)).toEqual({ success: false, code: 'FORBIDDEN', error: 'Solo los administradores pueden realizar esta acción' });
  });

  it('VALIDATION: faltan precios o el grupo no tiene precio único', async () => {
    await asUser({ role: 'admin' });
    expect(await saveMenuGroupPricesAction({ ...EMPANADAS, prices: { price1: 1200 } })).toEqual({ success: false, code: 'VALIDATION', error: MESSAGES.ERROR.VALIDATION.INVALID_DATA });
    expect(await Reflect.apply(saveMenuGroupPricesAction, undefined, [{ ...EMPANADAS, group: 'pizzas' }])).toMatchObject({ code: 'VALIDATION' });
  });

  it('STALE_VERSION: otra persona ya cambió los precios', async () => {
    await asUser({ role: 'admin' });
    await saveMenuGroupPricesAction(EMPANADAS);
    expect(await saveMenuGroupPricesAction(EMPANADAS)).toEqual({ success: false, code: 'STALE_VERSION', error: MESSAGES.ERROR.DATABASE.CONCURRENCY });
  });

  it('sin sesión, leer devuelve una lista vacía', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await fetchMenuGroupPrices()).toEqual([]);
  });

  it('fuzz: ninguna entrada hace lanzar ni devuelve un error fuera del catálogo', async () => {
    await asUser({ role: 'admin' });
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(saveMenuGroupPricesAction, undefined, [input]);
        expect(result.success || ['VALIDATION', 'STALE_VERSION'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
