import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fakePromotions } from '../testing/fake-promotion-unit-of-work';
import { PROMO_INPUT } from '../testing/promotion-repository.behavior';
import { createPromotionAction } from './create-promotion';
import { deletePromotionAction } from './delete-promotion';
import { fetchPromotions } from './fetch-promotions';
import { togglePromotionActiveAction } from './toggle-promotion-active';
import { updatePromotionAction } from './update-promotion';

vi.mock('@/features/promotion/repository/promotion-unit-of-work', async () => {
  const { fakePromotions: fake } = await import('../testing/fake-promotion-unit-of-work');
  return { drizzlePromotionUnitOfWork: fake };
});

describe('acciones de Promociones (camino feliz)', () => {
  beforeEach(async () => {
    fakePromotions.reset();
    await asUser({ role: 'admin' });
  });

  it('crea, edita, desactiva, reactiva y borra con sus mensajes (CA-1 a CA-3)', async () => {
    const created = await createPromotionAction(PROMO_INPUT);
    expect(created).toMatchObject({ success: true, message: 'Se registró la promoción', data: { name: PROMO_INPUT.name, price: 15000, isActive: true, version: 1 } });
    const id = created.success ? created.data.id : '';

    expect(await updatePromotionAction(id, { ...PROMO_INPUT, price: 14000, version: 1 })).toMatchObject({ success: true, message: 'Se actualizó la promoción', data: { price: 14000, version: 2 } });
    expect(await togglePromotionActiveAction({ id, isActive: false, version: 2 })).toEqual({ success: true, message: 'Se desactivó la promoción' });
    expect(await togglePromotionActiveAction({ id, isActive: true, version: 3 })).toEqual({ success: true, message: 'Se activó la promoción' });
    expect(await deletePromotionAction({ id, version: 4 })).toEqual({ success: true, message: 'Se eliminó la promoción' });
  });

  it('el vendedor también puede listarlas (las usa al vender), con sus componentes', async () => {
    await createPromotionAction(PROMO_INPUT);
    await asUser({ role: 'vendedor' });
    expect(await fetchPromotions()).toMatchObject([{ name: PROMO_INPUT.name, price: 15000, components: PROMO_INPUT.components }]);
  });

  it('sin sesión, listar devuelve una lista vacía', async () => {
    await createPromotionAction(PROMO_INPUT);
    const { cookieJar } = await import('@/test/cookie-jar');
    cookieJar.clear();
    expect(await fetchPromotions()).toEqual([]);
  });

  it('fuzz: ninguna entrada hace lanzar a crear ni devuelve un error fuera del catálogo', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(createPromotionAction, undefined, [input]);
        expect(result.success || ['VALIDATION', 'DUPLICATE'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
