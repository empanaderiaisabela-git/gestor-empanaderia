import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fakeShippings } from '../testing/fake-shipping-unit-of-work';
import { createShippingAction } from './create-shipping';
import { deleteShippingAction } from './delete-shipping';
import { fetchShippingOptions } from './fetch-shipping-options';
import { toggleShippingActiveAction } from './toggle-shipping-active';
import { updateShippingAction } from './update-shipping';

vi.mock('@/features/shipping/repository/shipping-unit-of-work', async () => {
  const { fakeShippings: fake } = await import('../testing/fake-shipping-unit-of-work');
  return { drizzleShippingUnitOfWork: fake };
});

const INPUT = { title: 'Centro', detail: 'Barrio A hasta Barrio B', amount: 1500 };

describe('acciones de envíos (US-58 CA-3 y CA-4)', () => {
  beforeEach(async () => {
    fakeShippings.reset();
    await asUser({ role: 'admin' });
  });

  it('crea, edita, desactiva, reactiva y borra con sus mensajes', async () => {
    const created = await createShippingAction(INPUT);
    expect(created).toMatchObject({ success: true, message: 'Se registró el envío', data: { ...INPUT, isActive: true, version: 1 } });
    const id = created.success ? created.data.id : '';

    expect(await updateShippingAction(id, { ...INPUT, amount: 1800, version: 1 })).toMatchObject({ success: true, message: 'Se actualizó el envío', data: { amount: 1800, version: 2 } });
    expect(await toggleShippingActiveAction({ id, isActive: false, version: 2 })).toEqual({ success: true, message: 'Se desactivó el envío' });
    expect(await toggleShippingActiveAction({ id, isActive: true, version: 3 })).toEqual({ success: true, message: 'Se activó el envío' });
    expect(await deleteShippingAction({ id, version: 4 })).toEqual({ success: true, message: 'Se eliminó el envío' });
  });

  it('crea un envío gratis y sin detalle (D-6)', async () => {
    expect(await createShippingAction({ title: 'Retira en el local', detail: '', amount: 0 })).toMatchObject({ success: true, data: { amount: 0, detail: '' } });
  });

  it('lista los envíos con su fila validada; el vendedor también puede listar para el carrito (D-1)', async () => {
    await createShippingAction(INPUT);
    await asUser({ role: 'vendedor' });
    expect(await fetchShippingOptions()).toMatchObject([{ ...INPUT, isActive: true }]);
  });

  it('sin sesión, listar devuelve una lista vacía', async () => {
    await createShippingAction(INPUT);
    vi.restoreAllMocks();
    const { cookieJar } = await import('@/test/cookie-jar');
    cookieJar.clear();
    expect(await fetchShippingOptions()).toEqual([]);
  });

  it('fuzz: ninguna entrada hace lanzar a crear ni devuelve un error fuera del catálogo', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(createShippingAction, undefined, [input]);
        expect(result.success || ['VALIDATION', 'DUPLICATE'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
