import { afterAll, describe, expect, it } from 'vitest';
import { GROUPS, MENU_GROUPS } from '@/features/menu/domain/menu-groups';
import { db } from '@/lib/db';
import { promotionComponents } from '@/lib/db/promotion-schema';
import { truncateAll } from '@/test/truncate-all';
import { describePromotionRepository, PROMO_INPUT } from '../testing/promotion-repository.behavior';
import { drizzlePromotionRepository } from './promotion.repository';

afterAll(async () => {
  await db.$client.end();
});

describePromotionRepository('Drizzle contra db-test', async () => {
  await truncateAll();
  return drizzlePromotionRepository(db);
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
