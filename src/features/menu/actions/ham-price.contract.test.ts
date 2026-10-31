import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fakePizzaExtras } from '../testing/fake-pizza-extra-unit-of-work';
import { fetchHamPrice } from './fetch-ham-price';
import { setHamPriceAction } from './set-ham-price';

vi.mock('@/features/menu/repository/pizza-extra.repository', async () => {
  const { fakePizzaExtras: fake } = await import('../testing/fake-pizza-extra-unit-of-work');
  return { drizzlePizzaExtraUnitOfWork: fake };
});

describe('precio del jamón extra por las acciones (US-47 CA-2)', () => {
  beforeEach(async () => {
    fakePizzaExtras.reset();
    await asUser({ role: 'admin' });
  });

  it('sin precio cargado, se lee "sin precio"; el admin lo guarda, queda en Auditoría y el vendedor lo lee', async () => {
    expect(await fetchHamPrice()).toEqual({ price: null, version: 0 });
    expect(await setHamPriceAction({ price: 1500, version: 0 })).toEqual({ success: true, message: 'Jamón extra: $1.500', data: { price: 1500, version: 1 } });
    expect(fakePizzaExtras.state.audits).toMatchObject([{ action: 'ACTUALIZAR', entity: 'PIZZA_EXTRA', detail: { name: 'Jamón extra para pizza', price: 1500 } }]);
    await asUser({ role: 'vendedor' });
    expect(await fetchHamPrice()).toEqual({ price: 1500, version: 1 });
  });

  it('STALE_VERSION si otro lo cambió antes; FORBIDDEN para el vendedor', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await setHamPriceAction({ price: 1500, version: 0 });
    expect(await setHamPriceAction({ price: 1800, version: 0 })).toMatchObject({ success: false, code: 'STALE_VERSION' });
    await asUser({ role: 'vendedor' });
    expect(await setHamPriceAction({ price: 1, version: 1 })).toMatchObject({ code: 'FORBIDDEN' });
  });

  it('VALIDATION con precio 0 o sin versión, y nunca lanza (fuzz)', async () => {
    expect(await setHamPriceAction({ price: 0, version: 0 })).toMatchObject({ code: 'VALIDATION' });
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(setHamPriceAction, undefined, [input]);
        expect(typeof result.success).toBe('boolean');
      }),
      { numRuns: 50 }
    );
  });
});
