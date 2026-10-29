import fc from 'fast-check';
import { revalidatePath } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { asUser } from '@/test/as-user';
import { fakeStock } from '../testing/fake-stock-unit-of-work';
import { stockItem } from '../testing/stock-item';
import { setStockPricingAction } from './set-stock-pricing';

vi.mock('@/features/stock/repository/stock-unit-of-work', async () => {
  const { fakeStock: fake } = await import('../testing/fake-stock-unit-of-work');
  return { drizzleStockUnitOfWork: fake };
});

const DOZEN = { price1: '3000.00', price3: '8500.00', price6: '16500.00', price12: '32000.00' };
const CARNE = stockItem({ id: '11111111-1111-4111-8111-111111111111', name: 'Carne', ...DOZEN });
const POLLO = stockItem({ id: '22222222-2222-4222-8222-222222222222', name: 'Pollo', ...DOZEN });
const RAISED = { price1: 3200, price3: 9000, price6: 17500, price12: 34000 };
const input = (overrides = {}) => ({ menuItemId: CARNE.id, version: 1, unitCost: 420, prices: RAISED, applyToGroup: false, ...overrides });

describe('acción Costo y precio de Stock (US-28 CA-5)', () => {
  beforeEach(() => {
    fakeStock.reset();
    fakeStock.state.items.push({ ...CARNE }, { ...POLLO });
    vi.mocked(revalidatePath).mockClear();
  });

  it('el admin guarda costo y precios; la respuesta es la fila del gusto y el catálogo se regenera', async () => {
    await asUser({ role: 'admin' });
    expect(await setStockPricingAction(input())).toMatchObject({ success: true, message: 'Costo y precio guardados: Carne', data: { id: CARNE.id, unitCost: 420, price12: 34000, stock: 10, version: 2 } });
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });

  it('con la casilla, el precio se copia a los demás gustos del grupo', async () => {
    await asUser({ role: 'admin' });
    expect(await setStockPricingAction(input({ applyToGroup: true }))).toMatchObject({ success: true, message: 'Costo y precio guardados: Carne. Precio copiado a 1 gusto' });
    expect(fakeStock.state.items.find((item) => item.id === POLLO.id)).toMatchObject({ price12: '34000.00', unitCost: '400.00', version: 2 });
  });

  it('UNAUTHENTICATED: sin sesión no guarda', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await setStockPricingAction(input())).toMatchObject({ success: false, code: 'UNAUTHENTICATED' });
    expect(fakeStock.state.items[0].version).toBe(1);
  });

  it('FORBIDDEN: el vendedor no cambia costos ni precios', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await asUser({ role: 'vendedor' });
    expect(await setStockPricingAction(input())).toEqual({ success: false, code: 'FORBIDDEN', error: 'Solo los administradores pueden realizar esta acción' });
  });

  it.each([
    { caso: 'sin versión', value: input({ version: undefined }) },
    { caso: 'costo negativo', value: input({ unitCost: -1 }) },
    { caso: 'un campo de más', value: input({ quantity: 1 }) },
    { caso: 'sólo el precio de unidad en Empanadas', value: input({ prices: { price1: 3200 } }) },
  ])('VALIDATION: $caso', async ({ value }) => {
    await asUser({ role: 'admin' });
    expect(await setStockPricingAction(value)).toEqual({ success: false, code: 'VALIDATION', error: MESSAGES.ERROR.VALIDATION.INVALID_DATA });
  });

  it('STALE_VERSION y NOT_FOUND', async () => {
    await asUser({ role: 'admin' });
    expect(await setStockPricingAction(input({ version: 5 }))).toMatchObject({ success: false, code: 'STALE_VERSION' });
    expect(await setStockPricingAction(input({ menuItemId: '44444444-4444-4444-8444-444444444444' }))).toEqual({ success: false, code: 'NOT_FOUND', error: 'El producto ya no existe.' });
  });

  it('fuzz: ninguna entrada hace lanzar ni devuelve un error fuera del catálogo', async () => {
    await asUser({ role: 'admin' });
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (value) => {
        const result = await Reflect.apply(setStockPricingAction, undefined, [value]);
        expect(result.success || ['VALIDATION', 'NOT_FOUND', 'STALE_VERSION'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
