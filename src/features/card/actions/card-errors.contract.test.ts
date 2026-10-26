import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { asUser } from '@/test/as-user';
import { CARD_INPUT } from '../testing/card-repository.behavior';
import { fakeCards } from '../testing/fake-card-unit-of-work';
import { createCardAction } from './create-card';
import { deleteCardAction } from './delete-card';
import { toggleCardActiveAction } from './toggle-card-active';
import { updateCardAction } from './update-card';

vi.mock('@/features/card/repository/card-unit-of-work', async () => {
  const { fakeCards: fake } = await import('../testing/fake-card-unit-of-work');
  return { drizzleCardUnitOfWork: fake };
});

const { DATABASE, VALIDATION } = MESSAGES.ERROR;

async function existingCard(): Promise<string> {
  return (await fakeCards.read.insert(CARD_INPUT)).id;
}

describe('tabla de errores de Tarjetas (US-10 CA-2)', () => {
  beforeEach(() => {
    fakeCards.reset();
  });

  it('UNAUTHENTICATED: sin sesión no se puede crear', async () => {
    expect(await createCardAction(CARD_INPUT)).toEqual({ success: false, code: 'UNAUTHENTICATED', error: 'No autorizado (Token faltante)' });
  });

  it('FORBIDDEN: el vendedor no puede crear, editar, activar ni borrar', async () => {
    const id = await existingCard();
    await asUser({ role: 'vendedor' });
    const results = await Promise.all([createCardAction(CARD_INPUT), updateCardAction(id, { ...CARD_INPUT, version: 1 }), toggleCardActiveAction({ id, isActive: false, version: 1 }), deleteCardAction({ id, version: 1 })]);
    expect(results.map((result) => (result.success ? 'ok' : result.code))).toEqual(['FORBIDDEN', 'FORBIDDEN', 'FORBIDDEN', 'FORBIDDEN']);
  });

  it.each([
    { caso: 'sin planes', input: { ...CARD_INPUT, plans: [] } },
    { caso: '2 cuotas', input: { ...CARD_INPUT, plans: [{ installments: 2, surchargePct: 0 }] } },
    { caso: 'recargo de 101 %', input: { ...CARD_INPUT, plans: [{ installments: 1, surchargePct: 101 }] } },
  ])('VALIDATION: $caso', async ({ input }) => {
    await asUser({ role: 'admin' });
    expect(await createCardAction(input)).toEqual({ success: false, code: 'VALIDATION', error: VALIDATION.INVALID_DATA });
  });

  it('VALIDATION: editar con un id inválido', async () => {
    await asUser({ role: 'admin' });
    expect(await updateCardAction('no-es-un-uuid', { ...CARD_INPUT, version: 1 })).toMatchObject({ code: 'VALIDATION' });
  });

  it('DUPLICATE: avisa que ya existe una tarjeta con ese nombre', async () => {
    await existingCard();
    await asUser({ role: 'admin' });
    expect(await createCardAction(CARD_INPUT)).toEqual({ success: false, code: 'DUPLICATE', error: DATABASE.UNIQUE_VIOLATION });
  });

  it('STALE_VERSION: editar, activar o borrar con una versión vieja', async () => {
    const id = await existingCard();
    await asUser({ role: 'admin' });
    const results = await Promise.all([updateCardAction(id, { ...CARD_INPUT, version: 7 }), toggleCardActiveAction({ id, isActive: false, version: 7 }), deleteCardAction({ id, version: 7 })]);
    expect(results).toEqual(Array(3).fill({ success: false, code: 'STALE_VERSION', error: DATABASE.CONCURRENCY }));
  });
});
