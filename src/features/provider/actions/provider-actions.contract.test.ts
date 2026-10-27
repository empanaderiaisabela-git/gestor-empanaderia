import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fakeProviders } from '../testing/fake-provider-unit-of-work';
import { createProviderAction } from './create-provider';
import { deleteProviderAction } from './delete-provider';
import { fetchProviders } from './fetch-providers';
import { toggleProviderActiveAction } from './toggle-provider-active';
import { updateProviderAction } from './update-provider';

vi.mock('@/features/provider/repository/provider-unit-of-work', async () => {
  const { fakeProviders: fake } = await import('../testing/fake-provider-unit-of-work');
  return { drizzleProviderUnitOfWork: fake };
});

const INPUT = { name: 'Molino del Sur', phone: '1155550000', email: 'ventas@molino.com' };

describe('acciones de proveedores (camino feliz)', () => {
  beforeEach(async () => {
    fakeProviders.reset();
    await asUser({ role: 'admin' });
  });

  it('crea, edita, desactiva, reactiva por nombre y borra con los mensajes de siempre', async () => {
    const created = await createProviderAction(INPUT);
    expect(created).toMatchObject({ success: true, message: 'Se registró el proveedor', data: { ...INPUT, version: 1 } });
    const id = created.success ? created.data.id : '';

    expect(await updateProviderAction(id, { phone: '1199990000', version: 1 })).toMatchObject({ success: true, message: 'Se actualizó el proveedor', data: { version: 2 } });
    expect(await toggleProviderActiveAction({ id, isActive: false, version: 2 })).toEqual({ success: true, message: 'Se desactivó el proveedor' });
    expect(await createProviderAction(INPUT)).toMatchObject({ success: true, message: 'Se reactivó el proveedor que ya existía, con los datos nuevos' });
    expect(await deleteProviderAction({ id, version: 4 })).toEqual({ success: true, message: 'Se eliminó el proveedor' });
  });

  it('activar devuelve el mensaje de activación', async () => {
    const created = await createProviderAction(INPUT);
    const id = created.success ? created.data.id : '';
    await toggleProviderActiveAction({ id, isActive: false, version: 1 });
    expect(await toggleProviderActiveAction({ id, isActive: true, version: 2 })).toEqual({ success: true, message: 'Se activó el proveedor' });
  });

  it('lista los proveedores con su fila validada; un vendedor también puede listar', async () => {
    await createProviderAction(INPUT);
    await asUser({ role: 'vendedor' });
    expect(await fetchProviders()).toMatchObject([{ ...INPUT, isActive: true }]);
  });

  it('sin sesión, listar devuelve una lista vacía', async () => {
    await createProviderAction(INPUT);
    vi.restoreAllMocks();
    const { cookieJar } = await import('@/test/cookie-jar');
    cookieJar.clear();
    expect(await fetchProviders()).toEqual([]);
  });

  it('fuzz: ninguna entrada hace lanzar a crear ni devuelve un error fuera del catálogo', async () => {
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        const result = await Reflect.apply(createProviderAction, undefined, [input]);
        expect(result.success || ['VALIDATION', 'DUPLICATE'].includes(result.code ?? '')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
