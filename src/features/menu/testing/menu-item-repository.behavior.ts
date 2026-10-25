import { beforeEach, describe, expect, it } from 'vitest';
import { databaseErrorCode } from '@/lib/db-errors';
import type { MenuItemData, MenuItemRepository } from '@/features/menu/repository/menu-item.repository';

export type MenuItemRepositoryHarness = {
  repository: MenuItemRepository;
  linkMovement?(menuItemId: string): Promise<void>;
};

type SuiteOptions = { withMovements: boolean };

const EMPANADA: MenuItemData = { group: 'empanadas', name: 'Carne suave', unitCost: 400 };
const SANGUCHE: MenuItemData = { group: 'sanguches', name: 'Primavera', unitCost: 500, prices: { price1: 1500, price3: 4200, price6: 8000, price12: 15000 } };
const PIZZA: MenuItemData = { group: 'pizzas', name: 'Mozzarella', unitCost: 3000, prices: { price1: 11000 } };

async function failureCode(operation: Promise<unknown>): Promise<string | null> {
  return operation.then(
    () => 'sin error',
    (error: unknown) => databaseErrorCode(error)
  );
}

export function describeMenuItemRepository(label: string, setup: () => Promise<MenuItemRepositoryHarness>, { withMovements }: SuiteOptions): void {
  describe(`MenuItemRepository (${label}) — US-3`, () => {
    let harness: MenuItemRepositoryHarness;

    beforeEach(async () => {
      harness = await setup();
    });

    it('inserta un gusto activo, sin stock, con versión 1 y sus precios como texto de 2 decimales', async () => {
      const created = await harness.repository.insert(SANGUCHE);
      expect(created).toMatchObject({ group: 'sanguches', name: 'Primavera', unitCost: '500.00', price1: '1500.00', price12: '15000.00', isActive: true, version: 1 });
      expect(Number(created.stock)).toBe(0);
      expect(await harness.repository.findById(created.id)).toMatchObject({ name: 'Primavera' });
    });

    it('guarda sin precio propio a las empanadas y sólo el de la entera a las pizzas', async () => {
      expect(await harness.repository.insert(EMPANADA)).toMatchObject({ price1: null, price3: null, price6: null, price12: null });
      expect(await harness.repository.insert(PIZZA)).toMatchObject({ price1: '11000.00', price3: null, price6: null, price12: null });
    });

    it('busca por nombre dentro del grupo, sin distinguir mayúsculas y con % y _ como texto', async () => {
      await harness.repository.insert({ ...PIZZA, name: 'Fuga_100%' });
      expect(await harness.repository.findByName('pizzas', 'fuga_100%')).toMatchObject({ name: 'Fuga_100%' });
      expect(await harness.repository.findByName('pizzas', 'FugaX100Y')).toBeNull();
      expect(await harness.repository.findByName('empanadas', 'Fuga_100%')).toBeNull();
    });

    it('rechaza el mismo nombre en el mismo grupo, pero lo permite en otro grupo', async () => {
      await harness.repository.insert(PIZZA);
      expect(await failureCode(harness.repository.insert(PIZZA))).toBe('DUPLICATE');
      await expect(harness.repository.insert({ ...EMPANADA, name: 'Mozzarella' })).resolves.toMatchObject({ group: 'empanadas' });
    });

    it('actualiza nombre, costo y precios filtrando por versión; con una versión vieja no cambia nada', async () => {
      const created = await harness.repository.insert(PIZZA);
      const updated = await harness.repository.update({ id: created.id, version: 1 }, { name: 'Muzza', unitCost: 3100, prices: { price1: 11500 } });
      expect(updated).toMatchObject({ name: 'Muzza', unitCost: '3100.00', price1: '11500.00', version: 2 });
      expect(await harness.repository.update({ id: created.id, version: 1 }, { isActive: false })).toBeNull();
    });

    it('borra con la versión actual y no con una vieja', async () => {
      const created = await harness.repository.insert(PIZZA);
      expect(await harness.repository.remove({ id: created.id, version: 9 })).toBe(false);
      expect(await harness.repository.remove({ id: created.id, version: 1 })).toBe(true);
      expect(await harness.repository.findById(created.id)).toBeNull();
    });

    it.runIf(withMovements)('no deja borrar un gusto con movimientos', async () => {
      const created = await harness.repository.insert(PIZZA);
      await harness.linkMovement?.(created.id);
      expect(await failureCode(harness.repository.remove({ id: created.id, version: 1 }))).toBe('HAS_RELATIONS');
    });

    it('lista por grupo, en el orden del tablero, y por nombre', async () => {
      await harness.repository.insert({ ...PIZZA, name: 'Napolitana' });
      await harness.repository.insert(EMPANADA);
      await harness.repository.insert(PIZZA);
      expect((await harness.repository.findAll()).map((row) => row.name)).toEqual(['Carne suave', 'Mozzarella', 'Napolitana']);
    });
  });
}
