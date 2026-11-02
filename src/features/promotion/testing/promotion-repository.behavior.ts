import { beforeEach, describe, expect, it } from 'vitest';
import { databaseErrorCode } from '@/lib/db-errors';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { PromotionRepository } from '@/features/promotion/repository/promotion.repository';

const DOCENA = { group: 'empanadas' as const, presentationKey: 'u12', quantity: 1, menuItemId: null };
const COCA = { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 2, menuItemId: null };
export const PROMO_INPUT = { name: 'Docena + 2 Coca', price: 15000, components: [DOCENA, COCA] };
const read = <T extends object>(component: T): T & { menuItemName: null } => ({ ...component, menuItemName: null });

async function failureCode(operation: Promise<unknown>): Promise<string | null> {
  return operation.then(
    () => 'sin error',
    (error: unknown) => databaseErrorCode(error)
  );
}

export type PromotionRepositoryHarness = { repository: PromotionRepository; linkSale(promotionId: string): Promise<void>; addDrink(group: MenuGroup, name: string): Promise<string> };

export function describePromotionRepository(label: string, setup: () => Promise<PromotionRepositoryHarness>): void {
  describe(`PromotionRepository (${label}) — US-8 CA-1`, () => {
    let repository: PromotionRepository;
    let harness: PromotionRepositoryHarness;

    beforeEach(async () => {
      harness = await setup();
      repository = harness.repository;
    });

    it('no deja borrar una promo que ya se vendió (US-9, decisión provisoria D-1)', async () => {
      const created = await repository.insert(PROMO_INPUT);
      await harness.linkSale(created.id);
      expect(await failureCode(repository.remove({ id: created.id, version: 1 }))).toBe('HAS_RELATIONS');
    });

    it('inserta una promo activa con versión 1 y sus componentes en orden', async () => {
      const created = await repository.insert(PROMO_INPUT);
      expect(created).toMatchObject({ name: PROMO_INPUT.name, isActive: true, version: 1, components: [DOCENA, COCA] });
      expect(Number(created.price)).toBe(15000);
      expect((await repository.findById(created.id))?.components).toEqual([read(DOCENA), read(COCA)]);
    });

    it('guarda la bebida fija y la lee con su nombre (US-55)', async () => {
      const sprite = { ...COCA, menuItemId: await harness.addDrink('coca_cola', 'Sprite 1.5L') };
      const created = await repository.insert({ ...PROMO_INPUT, components: [DOCENA, sprite] });
      expect(created.components).toEqual([read(DOCENA), { ...sprite, menuItemName: 'Sprite 1.5L' }]);
      expect((await repository.findById(created.id))?.components[1]).toEqual({ ...sprite, menuItemName: 'Sprite 1.5L' });
    });

    it('RELATION_NOT_FOUND: una bebida fija de otro grupo o que no existe (US-55)', async () => {
      const quilmes = await harness.addDrink('pepsi', 'Quilmes 1L');
      for (const menuItemId of [quilmes, crypto.randomUUID()]) {
        expect(await failureCode(repository.insert({ ...PROMO_INPUT, name: menuItemId, components: [{ ...COCA, menuItemId }] }))).toBe('RELATION_NOT_FOUND');
      }
    });

    it('busca por nombre sin distinguir mayúsculas y trata % y _ como texto', async () => {
      await repository.insert({ ...PROMO_INPUT, name: 'Promo_100%' });
      expect(await repository.findByName('promo_100%')).not.toBeNull();
      expect(await repository.findByName('PromoX100Y')).toBeNull();
    });

    it('rechaza un nombre exacto repetido con un error de duplicado', async () => {
      await repository.insert(PROMO_INPUT);
      expect(await failureCode(repository.insert(PROMO_INPUT))).toBe('DUPLICATE');
    });

    it('edita filtrando por versión, suma 1 y reemplaza los componentes', async () => {
      const created = await repository.insert(PROMO_INPUT);
      const updated = await repository.update({ id: created.id, version: 1 }, { price: 14000.5, components: [COCA] });
      expect(updated).toMatchObject({ version: 2, components: [COCA] });
      expect(Number(updated?.price)).toBe(14000.5);
      expect((await repository.findById(created.id))?.components).toEqual([read(COCA)]);
    });

    it('con una versión vieja no edita ni borra', async () => {
      const created = await repository.insert(PROMO_INPUT);
      await repository.update({ id: created.id, version: 1 }, { isActive: false });
      expect(await repository.update({ id: created.id, version: 1 }, { isActive: true })).toBeNull();
      expect(await repository.remove({ id: created.id, version: 1 })).toBe(false);
    });

    it('borra con la versión actual, junto con sus componentes', async () => {
      const created = await repository.insert(PROMO_INPUT);
      expect(await repository.remove({ id: created.id, version: 1 })).toBe(true);
      expect(await repository.findById(created.id)).toBeNull();
    });

    it('lista de la más nueva a la más vieja, cada una con sus componentes', async () => {
      await repository.insert({ ...PROMO_INPUT, name: 'Primera' });
      await repository.insert({ ...PROMO_INPUT, name: 'Segunda', components: [COCA] });
      expect((await repository.findAll()).map((row) => [row.name, row.components.length])).toEqual([
        ['Segunda', 1],
        ['Primera', 2],
      ]);
    });
  });
}
