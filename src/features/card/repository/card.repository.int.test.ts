import { afterAll, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { cardPlans } from '@/lib/db/card-schema';
import { salePayments, sales } from '@/lib/db/schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { CARD_INPUT, describeCardRepository } from '../testing/card-repository.behavior';
import { drizzleCardRepository } from './card.repository';

afterAll(async () => {
  await db.$client.end();
});

async function linkPayment(cardId: string): Promise<void> {
  await seedTestUser('vendedor');
  const [sale] = await db.insert(sales).values({ vendorId: TEST_USER_IDS.vendedor, total: '1100.00' }).returning({ id: sales.id });
  await db.insert(salePayments).values({ saleId: sale.id, type: 'credito', amount: '1000.00', cardId, installments: 3, surchargePct: '10.00', surchargeAmount: '100.00' });
}

describeCardRepository('Drizzle contra db-test', async () => {
  await truncateAll();
  return { repository: drizzleCardRepository(db), linkPayment };
});

describe('CHECK de card_plans y de los pagos con tarjeta (US-10 CA-1 y US-11)', () => {
  it.each([
    { caso: '2 cuotas', plan: { installments: 2, surchargePct: '0' } },
    { caso: 'recargo de 101 %', plan: { installments: 1, surchargePct: '101' } },
    { caso: 'recargo negativo', plan: { installments: 1, surchargePct: '-1' } },
  ])('un plan rechaza $caso', async ({ plan }) => {
    await truncateAll();
    const card = await drizzleCardRepository(db).insert({ ...CARD_INPUT, plans: [{ installments: 6, surchargePct: 1 }] });
    await expect(db.insert(cardPlans).values({ cardId: card.id, ...plan })).rejects.toThrow();
  });

  it('un pago con tarjeta tiene que ser de crédito y llevar cuotas y recargo', async () => {
    await truncateAll();
    await seedTestUser('vendedor');
    const card = await drizzleCardRepository(db).insert(CARD_INPUT);
    const [sale] = await db.insert(sales).values({ vendorId: TEST_USER_IDS.vendedor, total: '1.00' }).returning({ id: sales.id });
    await expect(db.insert(salePayments).values({ saleId: sale.id, type: 'debito', amount: '1.00', cardId: card.id, installments: 1, surchargePct: '0', surchargeAmount: '0' })).rejects.toThrow();
    await expect(db.insert(salePayments).values({ saleId: sale.id, type: 'credito', amount: '1.00', cardId: card.id })).rejects.toThrow();
  });
});
