import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asUser } from '@/test/as-user';
import { fakeMenu } from '../testing/fake-menu-unit-of-work';
import { createMenuItemAction } from './create-menu-item';
import { updateMenuItemAction } from './update-menu-item';

vi.mock('@/features/menu/repository/menu-unit-of-work', async () => {
  const { fakeMenu: fake } = await import('../testing/fake-menu-unit-of-work');
  return { drizzleMenuUnitOfWork: fake };
});

describe('alta de bebidas con bebida, litros y sabor (US-51 CA-3)', () => {
  beforeEach(async () => {
    fakeMenu.reset();
    await asUser({ role: 'admin' });
  });

  it('el admin da de alta y edita una bebida con bebida, litros y sabor', async () => {
    const created = await createMenuItemAction({ group: 'coca_cola', drinkName: 'Aquarius', size: '1.5L', flavor: 'Manzana' });
    expect(created).toMatchObject({ success: true, data: { name: 'Aquarius 1.5L Manzana', drinkName: 'Aquarius', drinkSize: '1.5L', flavor: 'Manzana' } });
    const id = fakeMenu.state.rows[0].id;
    expect(await updateMenuItemAction(id, { drinkName: 'Aquarius', size: '1.5L', flavor: null, version: 1 })).toMatchObject({ success: true, data: { name: 'Aquarius 1.5L', flavor: null } });
  });

  it('VALIDATION: una bebida sin litros, una bebida con nombre suelto o una comida con litros', async () => {
    const invalid = [{ group: 'coca_cola', drinkName: 'Aquarius' }, { group: 'pepsi', name: 'Quilmes 1 L' }, { group: 'empanadas', drinkName: 'Carne', size: '1L' }];
    for (const input of invalid) expect(await Reflect.apply(createMenuItemAction, undefined, [input])).toMatchObject({ code: 'VALIDATION' });
  });

  it('FORBIDDEN para el vendedor, y cualquier entrada devuelve un ActionResult (fuzz)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await asUser({ role: 'vendedor' });
    expect(await createMenuItemAction({ group: 'coca_cola', drinkName: 'Aquarius', size: '1.5L' })).toMatchObject({ code: 'FORBIDDEN' });
    await asUser({ role: 'admin' });
    await fc.assert(
      fc.asyncProperty(fc.anything(), async (input) => {
        expect(typeof (await Reflect.apply(createMenuItemAction, undefined, [input])).success).toBe('boolean');
      }),
      { numRuns: 40 }
    );
  });
});
