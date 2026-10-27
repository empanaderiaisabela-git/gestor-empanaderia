import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { CARD_INPUT } from '../testing/card-repository.behavior';
import { fakeCards } from '../testing/fake-card-unit-of-work';
import { createCardAction } from './create-card';
import { deleteCardAction } from './delete-card';
import { fetchCards } from './fetch-cards';
import { toggleCardActiveAction } from './toggle-card-active';
import { updateCardAction } from './update-card';

vi.mock('@/features/card/repository/card-unit-of-work', async () => {
  const { fakeCards: fake } = await import('../testing/fake-card-unit-of-work');
  return { drizzleCardUnitOfWork: fake };
});

describe('acciones de Tarjetas (camino feliz)', () => {
  beforeEach(async () => {
    fakeCards.reset();
    await asUser({ role: 'admin' });
  });

  it('crea, edita, desactiva, reactiva y borra con sus mensajes (CA-1 y CA-2)', async () => {
    const created = await createCardAction(CARD_INPUT);
    expect(created).toMatchObject({ success: true, message: 'Se registró la tarjeta', data: { name: 'Visa', plans: [{ installments: 1, surchargePct: 0 }, { installments: 3, surchargePct: 10.5 }] } });
    const id = created.success ? created.data.id : '';
    expect(await updateCardAction(id, { ...CARD_INPUT, version: 1 })).toMatchObject({ success: true, message: 'Se actualizó la tarjeta', data: { version: 2 } });
    expect(await toggleCardActiveAction({ id, isActive: false, version: 2 })).toEqual({ success: true, message: 'Se desactivó la tarjeta' });
    expect(await toggleCardActiveAction({ id, isActive: true, version: 3 })).toEqual({ success: true, message: 'Se activó la tarjeta' });
    expect(await deleteCardAction({ id, version: 4 })).toEqual({ success: true, message: 'Se eliminó la tarjeta' });
  });

  it('el vendedor también puede listarlas (las elige al cobrar con crédito)', async () => {
    await createCardAction(CARD_INPUT);
    await asUser({ role: 'vendedor' });
    expect(await fetchCards()).toMatchObject([{ name: 'Visa', isActive: true }]);
  });

  it('sin sesión, listar devuelve una lista vacía', async () => {
    await createCardAction(CARD_INPUT);
    const { cookieJar } = await import('@/test/cookie-jar');
    cookieJar.clear();
    expect(await fetchCards()).toEqual([]);
  });

  it('fuzz: ninguna entrada hace lanzar a crear ni devuelve un error fuera del catálogo', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(createCardAction, undefined, [input]);
        expect(result.success || ['VALIDATION', 'DUPLICATE'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
