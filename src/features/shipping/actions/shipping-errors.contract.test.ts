import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { asUser } from '@/test/as-user';
import { fakeShippings } from '../testing/fake-shipping-unit-of-work';
import { createShippingAction } from './create-shipping';
import { deleteShippingAction } from './delete-shipping';
import { toggleShippingActiveAction } from './toggle-shipping-active';
import { updateShippingAction } from './update-shipping';

vi.mock('@/features/shipping/repository/shipping-unit-of-work', async () => {
  const { fakeShippings: fake } = await import('../testing/fake-shipping-unit-of-work');
  return { drizzleShippingUnitOfWork: fake };
});

const INPUT = { title: 'Centro', detail: 'Barrio A hasta Barrio B', amount: 1500 };
const { DATABASE, VALIDATION } = MESSAGES.ERROR;

async function existingShipping(): Promise<string> {
  return (await fakeShippings.read.insert(INPUT)).id;
}

describe('tabla de errores de envíos (US-58 CA-3 y CA-4)', () => {
  beforeEach(() => {
    fakeShippings.reset();
  });

  it('UNAUTHENTICATED: sin sesión no se puede crear', async () => {
    expect(await createShippingAction(INPUT)).toMatchObject({ success: false, code: 'UNAUTHENTICATED' });
  });

  it('FORBIDDEN: un vendedor no puede crear, editar, activar ni borrar (D-1)', async () => {
    const id = await existingShipping();
    await asUser({ role: 'vendedor' });
    const results = await Promise.all([
      createShippingAction(INPUT),
      updateShippingAction(id, { ...INPUT, version: 1 }),
      toggleShippingActiveAction({ id, isActive: false, version: 1 }),
      deleteShippingAction({ id, version: 1 }),
    ]);
    expect(results.map((result) => (result.success ? 'ok' : result.code))).toEqual(['FORBIDDEN', 'FORBIDDEN', 'FORBIDDEN', 'FORBIDDEN']);
  });

  it.each([
    { caso: 'título vacío', input: { ...INPUT, title: '' } },
    { caso: 'detalle de 151', input: { ...INPUT, detail: 'D'.repeat(151) } },
    { caso: 'monto negativo', input: { ...INPUT, amount: -1 } },
    { caso: 'campos de más', input: { ...INPUT, isActive: false } },
  ])('VALIDATION: $caso', async ({ input }) => {
    await asUser({ role: 'admin' });
    expect(await createShippingAction(input)).toEqual({ success: false, code: 'VALIDATION', error: VALIDATION.INVALID_DATA });
  });

  it('VALIDATION: editar con un id que no es un uuid', async () => {
    await asUser({ role: 'admin' });
    expect(await updateShippingAction('no-es-un-uuid', { ...INPUT, version: 1 })).toMatchObject({ code: 'VALIDATION' });
  });

  it('DUPLICATE: avisa que ya existe un envío con ese título', async () => {
    await existingShipping();
    await asUser({ role: 'admin' });
    expect(await createShippingAction({ ...INPUT, title: 'centro' })).toEqual({ success: false, code: 'DUPLICATE', error: DATABASE.UNIQUE_VIOLATION });
  });

  it('STALE_VERSION: avisa que los datos cambiaron al editar o desactivar con una versión vieja', async () => {
    const id = await existingShipping();
    await asUser({ role: 'admin' });
    expect(await updateShippingAction(id, { ...INPUT, version: 7 })).toEqual({ success: false, code: 'STALE_VERSION', error: DATABASE.CONCURRENCY });
    expect(await toggleShippingActiveAction({ id, isActive: false, version: 7 })).toMatchObject({ code: 'STALE_VERSION' });
  });

  it('HAS_RELATIONS: no deja borrar un envío que se usó en una venta (D-5)', async () => {
    const id = await existingShipping();
    fakeShippings.state.withSales.add(id);
    await asUser({ role: 'admin' });
    expect(await deleteShippingAction({ id, version: 1 })).toEqual({ success: false, code: 'HAS_RELATIONS', error: DATABASE.FOREIGN_KEY_VIOLATION });
  });
});
