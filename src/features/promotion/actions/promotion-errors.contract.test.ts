import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { asUser } from '@/test/as-user';
import { fakePromotions } from '../testing/fake-promotion-unit-of-work';
import { PROMO_INPUT } from '../testing/promotion-repository.behavior';
import { createPromotionAction } from './create-promotion';
import { deletePromotionAction } from './delete-promotion';
import { togglePromotionActiveAction } from './toggle-promotion-active';
import { updatePromotionAction } from './update-promotion';

vi.mock('@/features/promotion/repository/promotion-unit-of-work', async () => {
  const { fakePromotions: fake } = await import('../testing/fake-promotion-unit-of-work');
  return { drizzlePromotionUnitOfWork: fake };
});

const { DATABASE, VALIDATION } = MESSAGES.ERROR;

async function existingPromotion(): Promise<string> {
  return (await fakePromotions.read.insert(PROMO_INPUT)).id;
}

describe('tabla de errores de Promociones (US-8 CA-4)', () => {
  beforeEach(() => {
    fakePromotions.reset();
  });

  it('UNAUTHENTICATED: sin sesión no se puede crear', async () => {
    expect(await createPromotionAction(PROMO_INPUT)).toEqual({ success: false, code: 'UNAUTHENTICATED', error: 'No autorizado (Token faltante)' });
  });

  it('FORBIDDEN: el vendedor no puede crear, editar, activar ni borrar', async () => {
    const id = await existingPromotion();
    await asUser({ role: 'vendedor' });
    const results = await Promise.all([
      createPromotionAction(PROMO_INPUT),
      updatePromotionAction(id, { ...PROMO_INPUT, version: 1 }),
      togglePromotionActiveAction({ id, isActive: false, version: 1 }),
      deletePromotionAction({ id, version: 1 }),
    ]);
    expect(results.map((result) => (result.success ? 'ok' : result.code))).toEqual(['FORBIDDEN', 'FORBIDDEN', 'FORBIDDEN', 'FORBIDDEN']);
  });

  it.each([
    { caso: 'sin componentes', input: { ...PROMO_INPUT, components: [] } },
    { caso: 'precio 0', input: { ...PROMO_INPUT, price: 0 } },
    { caso: 'presentación que no es del grupo', input: { ...PROMO_INPUT, components: [{ group: 'pizzas' as const, presentationKey: 'u12', quantity: 1 }] } },
  ])('VALIDATION: $caso', async ({ input }) => {
    await asUser({ role: 'admin' });
    expect(await createPromotionAction(input)).toEqual({ success: false, code: 'VALIDATION', error: VALIDATION.INVALID_DATA });
  });

  it('VALIDATION: editar con un id inválido', async () => {
    await asUser({ role: 'admin' });
    expect(await updatePromotionAction('no-es-un-uuid', { ...PROMO_INPUT, version: 1 })).toMatchObject({ code: 'VALIDATION' });
  });

  it('DUPLICATE: avisa que ya existe una promo con ese nombre', async () => {
    await existingPromotion();
    await asUser({ role: 'admin' });
    expect(await createPromotionAction(PROMO_INPUT)).toEqual({ success: false, code: 'DUPLICATE', error: DATABASE.UNIQUE_VIOLATION });
  });

  it('STALE_VERSION: editar, activar o borrar con una versión vieja', async () => {
    const id = await existingPromotion();
    await asUser({ role: 'admin' });
    const results = await Promise.all([
      updatePromotionAction(id, { ...PROMO_INPUT, version: 7 }),
      togglePromotionActiveAction({ id, isActive: false, version: 7 }),
      deletePromotionAction({ id, version: 7 }),
    ]);
    expect(results).toEqual(Array(3).fill({ success: false, code: 'STALE_VERSION', error: DATABASE.CONCURRENCY }));
  });
});
