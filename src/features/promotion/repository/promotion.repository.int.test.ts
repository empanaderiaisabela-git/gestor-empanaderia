import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { GROUPS, MENU_GROUPS, type MenuGroup } from '@/features/menu/domain/menu-groups';
import { db } from '@/lib/db';
import { databaseErrorCode } from '@/lib/db-errors';
import { menuItems } from '@/lib/db/menu-schema';
import { saleLines } from '@/lib/db/order-schema';
import { promotionComponents } from '@/lib/db/promotion-schema';
import { sales } from '@/lib/db/schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { describePromotionRepository, PROMO_INPUT } from '../testing/promotion-repository.behavior';
import { drizzlePromotionRepository } from './promotion.repository';

afterAll(async () => {
  await db.$client.end();
});

async function linkSale(promotionId: string): Promise<void> {
  await seedTestUser('vendedor');
  const [sale] = await db.insert(sales).values({ vendorId: TEST_USER_IDS.vendedor, total: '15000.00' }).returning({ id: sales.id });
  await db.insert(saleLines).values({ saleId: sale.id, promotionId, quantity: 1, unitPrice: '15000.00', subtotal: '15000.00', description: 'Docena + 2 Coca: Carne · Coca · Coca' });
}

async function addDrink(group: MenuGroup, name: string): Promise<string> {
  const [item] = await db.insert(menuItems).values({ group, name, drinkName: name, drinkSize: '1.5L' }).returning({ id: menuItems.id });
  return item.id;
}

const failure = (operation: Promise<unknown>): Promise<string | null> => operation.then(() => 'sin error', databaseErrorCode);

describePromotionRepository('Drizzle contra db-test', async () => {
  await truncateAll();
  return { repository: drizzlePromotionRepository(db), linkSale, addDrink };
});

describe('bebida fija en promotion_components (US-55)', () => {
  const coca = (menuItemId: string | null) => ({ group: 'coca_cola' as const, presentationKey: 'u1', quantity: 1, menuItemId });

  it('no deja borrar una bebida fija en una promo', async () => {
    await truncateAll();
    const sprite = await addDrink('coca_cola', 'Sprite 1.5L');
    await drizzlePromotionRepository(db).insert({ ...PROMO_INPUT, components: [coca(sprite)] });
    expect(await failure(db.delete(menuItems).where(eq(menuItems.id, sprite)))).toBe('HAS_RELATIONS');
  });

  it('repite el grupo sólo con bebidas distintas, y nunca fija comida', async () => {
    await truncateAll();
    const [sprite, fanta] = [await addDrink('coca_cola', 'Sprite 1.5L'), await addDrink('coca_cola', 'Fanta 1.5L')];
    const repository = drizzlePromotionRepository(db);
    expect((await repository.insert({ ...PROMO_INPUT, components: [coca(sprite), coca(fanta), coca(null)] })).components).toHaveLength(3);
    expect(await failure(repository.insert({ ...PROMO_INPUT, name: 'B', components: [coca(null), coca(null)] }))).toBe('DUPLICATE');
    const [carne] = await db.insert(menuItems).values({ group: 'empanadas', name: 'Carne' }).returning({ id: menuItems.id });
    const food = { group: 'empanadas' as const, presentationKey: 'u1', quantity: 1, menuItemId: carne.id };
    await expect(repository.insert({ ...PROMO_INPUT, name: 'C', components: [food] })).rejects.toThrow();
  });
});

describe('CHECK de presentación de promotion_components (US-8)', () => {
  it('acepta cada presentación de cada grupo, tal como las define GROUPS', async () => {
    await truncateAll();
    const components = MENU_GROUPS.flatMap((group) => GROUPS[group].presentations.map((presentation) => ({ group, presentationKey: presentation.key, quantity: 1, menuItemId: null })));
    const created = await drizzlePromotionRepository(db).insert({ ...PROMO_INPUT, components });
    expect(created.components).toHaveLength(components.length);
  });

  it('rechaza una presentación que no es del grupo', async () => {
    await truncateAll();
    const created = await drizzlePromotionRepository(db).insert(PROMO_INPUT);
    const insert = db.insert(promotionComponents).values({ promotionId: created.id, group: 'pizzas', presentationKey: 'u12', quantity: 1 });
    await expect(insert).rejects.toThrow();
  });
});

describe('CHECK de tipo de sale_lines (US-9)', () => {
  it('una línea no puede ser a la vez de un grupo y de una promo', async () => {
    await truncateAll();
    await seedTestUser('vendedor');
    const created = await drizzlePromotionRepository(db).insert(PROMO_INPUT);
    const [sale] = await db.insert(sales).values({ vendorId: TEST_USER_IDS.vendedor, total: '1.00' }).returning({ id: sales.id });
    const both = db.insert(saleLines).values({ saleId: sale.id, promotionId: created.id, group: 'empanadas', presentationKey: 'u1', quantity: 1, unitPrice: '1.00', subtotal: '1.00', description: 'x' });
    await expect(both).rejects.toThrow();
  });
});
