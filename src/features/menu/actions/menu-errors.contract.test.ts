import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '@/config/messages';
import { asUser } from '@/test/as-user';
import { fakeMenu } from '../testing/fake-menu-unit-of-work';
import { createMenuItemAction } from './create-menu-item';
import { deleteMenuItemAction } from './delete-menu-item';
import { toggleMenuItemActiveAction } from './toggle-menu-item-active';
import { updateMenuItemAction } from './update-menu-item';

vi.mock('@/features/menu/repository/menu-unit-of-work', async () => {
  const { fakeMenu: fake } = await import('../testing/fake-menu-unit-of-work');
  return { drizzleMenuUnitOfWork: fake };
});

const PIZZA = { group: 'pizzas' as const, name: 'Mozzarella' };
const EDIT = { name: 'Mozzarella', version: 1 };
const { DATABASE, VALIDATION } = MESSAGES.ERROR;

async function existingItem(): Promise<string> {
  return (await fakeMenu.read.items.insert(PIZZA)).id;
}

describe('tabla de errores de Alta de productos (US-3 CA-2 a CA-4)', () => {
  beforeEach(() => {
    fakeMenu.reset();
  });

  it('UNAUTHENTICATED: sin sesión no se puede crear', async () => {
    expect(await createMenuItemAction(PIZZA)).toEqual({ success: false, code: 'UNAUTHENTICATED', error: 'No autorizado (Token faltante)' });
  });

  it('FORBIDDEN: el vendedor no puede crear, editar, activar ni borrar', async () => {
    const id = await existingItem();
    await asUser({ role: 'vendedor' });
    const results = await Promise.all([
      createMenuItemAction(PIZZA),
      updateMenuItemAction(id, EDIT),
      toggleMenuItemActiveAction({ id, isActive: false, version: 1 }),
      deleteMenuItemAction({ id, version: 1 }),
    ]);
    expect(results.map((result) => (result.success ? 'ok' : result.code))).toEqual(['FORBIDDEN', 'FORBIDDEN', 'FORBIDDEN', 'FORBIDDEN']);
  });

  it.each([
    { caso: 'nombre de 61 caracteres', input: { ...PIZZA, name: 'A'.repeat(61) } },
  ])('VALIDATION: $caso', async ({ input }) => {
    await asUser({ role: 'admin' });
    expect(await createMenuItemAction(input)).toEqual({ success: false, code: 'VALIDATION', error: VALIDATION.INVALID_DATA });
  });

  it('VALIDATION: editar con un id inválido o con campos de más', async () => {
    const id = await existingItem();
    await asUser({ role: 'admin' });
    const withCost = { ...EDIT, unitCost: 1 };
    expect(await updateMenuItemAction(id, withCost)).toMatchObject({ code: 'VALIDATION' });
    expect(await updateMenuItemAction('no-es-un-uuid', EDIT)).toMatchObject({ code: 'VALIDATION' });
  });

  it('DUPLICATE: ya existe un producto con ese nombre en el grupo', async () => {
    await existingItem();
    await asUser({ role: 'admin' });
    expect(await createMenuItemAction({ ...PIZZA, name: 'mozzarella' })).toEqual({ success: false, code: 'DUPLICATE', error: DATABASE.UNIQUE_VIOLATION });
  });

  it('STALE_VERSION: editar, activar o borrar con una versión vieja', async () => {
    const id = await existingItem();
    await asUser({ role: 'admin' });
    expect(await updateMenuItemAction(id, { ...EDIT, version: 7 })).toEqual({ success: false, code: 'STALE_VERSION', error: DATABASE.CONCURRENCY });
    expect(await toggleMenuItemActiveAction({ id, isActive: false, version: 7 })).toMatchObject({ code: 'STALE_VERSION' });
    expect(await deleteMenuItemAction({ id, version: 7 })).toMatchObject({ code: 'STALE_VERSION' });
  });

  it('NOT_FOUND: editar un producto que ya no existe', async () => {
    await asUser({ role: 'admin' });
    const result = await updateMenuItemAction('11111111-1111-4111-8111-111111111111', EDIT);
    expect(result).toEqual({ success: false, code: 'NOT_FOUND', error: 'El producto ya no existe.' });
  });

  it('HAS_RELATIONS: no deja borrar un producto con movimientos', async () => {
    const id = await existingItem();
    fakeMenu.state.withMovements.add(id);
    await asUser({ role: 'admin' });
    expect(await deleteMenuItemAction({ id, version: 1 })).toEqual({ success: false, code: 'HAS_RELATIONS', error: DATABASE.FOREIGN_KEY_VIOLATION });
  });
});
