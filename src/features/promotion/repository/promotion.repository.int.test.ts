import { afterAll, describe, expect, it } from 'vitest';
import { GROUPS, MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { db } from '@/lib/db';
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

describePromotionRepository('Drizzle contra db-test', async () => {
  await truncateAll();
  return { repository: drizzlePromotionRepository(db), linkSale };
});

describe('CHECK de presentación de promotion_components (US-8)', () => {
  it('acepta cada presentación de cada grupo, tal como las define GROUPS', async () => {
    await truncateAll();
    const components = MENU_GROUPS.flatMap((group) => GROUPS[group].presentations.map((presentation) => ({ group, presentationKey: presentation.key, quantity: 1 })));
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
