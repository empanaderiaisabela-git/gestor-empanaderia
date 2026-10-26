import { afterAll, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { cardPlans } from '@/lib/db/card-schema';
import { truncateAll } from '@/test/truncate-all';
import { CARD_INPUT, describeCardRepository } from '../testing/card-repository.behavior';
import { drizzleCardRepository } from './card.repository';

afterAll(async () => {
  await db.$client.end();
});

describeCardRepository('Drizzle contra db-test', async () => {
  await truncateAll();
  return { repository: drizzleCardRepository(db) };
});

describe('CHECK de card_plans (US-10 CA-1)', () => {
  it.each([
    { caso: '2 cuotas', plan: { installments: 2, surchargePct: '0' } },
    { caso: 'recargo de 101 %', plan: { installments: 1, surchargePct: '101' } },
    { caso: 'recargo negativo', plan: { installments: 1, surchargePct: '-1' } },
  ])('rechaza $caso', async ({ plan }) => {
    await truncateAll();
    const card = await drizzleCardRepository(db).insert({ ...CARD_INPUT, plans: [{ installments: 6, surchargePct: 1 }] });
    await expect(db.insert(cardPlans).values({ cardId: card.id, ...plan })).rejects.toThrow();
  });
});
