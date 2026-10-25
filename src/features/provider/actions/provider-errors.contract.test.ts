import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { asUser } from '@/test/as-user';
import { fakeProviders } from '../testing/fake-provider-unit-of-work';
import { createProviderAction } from './create-provider';
import { deleteProviderAction } from './delete-provider';
import { toggleProviderActiveAction } from './toggle-provider-active';
import { updateProviderAction } from './update-provider';

vi.mock('@/features/provider/repository/provider-unit-of-work', async () => {
  const { fakeProviders: fake } = await import('../testing/fake-provider-unit-of-work');
  return { drizzleProviderUnitOfWork: fake };
});

const INPUT = { name: 'Molino del Sur', phone: '1155550000', email: 'ventas@molino.com' };
const { DATABASE, VALIDATION } = MESSAGES.ERROR;

async function existingProvider(): Promise<string> {
  const provider = await fakeProviders.read.insert(INPUT);
  return provider.id;
}

describe('tabla de errores de proveedores (T-5 CA-4)', () => {
  beforeEach(() => {
    fakeProviders.reset();
  });

  it('UNAUTHENTICATED: sin sesión no se puede crear', async () => {
    expect(await createProviderAction(INPUT)).toEqual({ success: false, code: 'UNAUTHENTICATED', error: 'No autorizado (Token faltante)' });
  });

  it('FORBIDDEN: un vendedor no puede crear, editar, activar ni borrar', async () => {
    const id = await existingProvider();
    await asUser({ role: 'vendedor' });
    const results = await Promise.all([
      createProviderAction(INPUT),
      updateProviderAction(id, { phone: '1', version: 1 }),
      toggleProviderActiveAction({ id, isActive: false, version: 1 }),
      deleteProviderAction({ id, version: 1 }),
    ]);
    expect(results.map((result) => (result.success ? 'ok' : result.code))).toEqual(['FORBIDDEN', 'FORBIDDEN', 'FORBIDDEN', 'FORBIDDEN']);
  });

  it('VALIDATION: datos inválidos o campos de más', async () => {
    await asUser({ role: 'admin' });
    expect(await createProviderAction({ ...INPUT, name: 'A' })).toEqual({ success: false, code: 'VALIDATION', error: VALIDATION.INVALID_DATA });
    expect(await updateProviderAction('no-es-un-uuid', { phone: '1', version: 1 })).toMatchObject({ code: 'VALIDATION' });
  });

  it('DUPLICATE: avisa que ya existe un proveedor activo con ese nombre', async () => {
    await existingProvider();
    await asUser({ role: 'admin' });
    expect(await createProviderAction(INPUT)).toEqual({ success: false, code: 'DUPLICATE', error: DATABASE.UNIQUE_VIOLATION });
  });

  it('STALE_VERSION: avisa que los datos cambiaron al editar con una versión vieja', async () => {
    const id = await existingProvider();
    await asUser({ role: 'admin' });
    expect(await updateProviderAction(id, { phone: '1', version: 7 })).toEqual({ success: false, code: 'STALE_VERSION', error: DATABASE.CONCURRENCY });
  });

  it('STALE_VERSION: activar o desactivar también filtra por versión (T-5 CA-5)', async () => {
    const id = await existingProvider();
    await asUser({ role: 'admin' });
    expect(await toggleProviderActiveAction({ id, isActive: false, version: 7 })).toMatchObject({ code: 'STALE_VERSION' });
  });

  it('HAS_RELATIONS: no deja borrar un proveedor con ingresos de stock', async () => {
    const id = await existingProvider();
    fakeProviders.state.withStockEntries.add(id);
    await asUser({ role: 'admin' });
    expect(await deleteProviderAction({ id, version: 1 })).toEqual({ success: false, code: 'HAS_RELATIONS', error: DATABASE.FOREIGN_KEY_VIOLATION });
  });
});
