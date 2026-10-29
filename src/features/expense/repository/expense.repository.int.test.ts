import { afterAll, describe, expect, it } from 'vitest';
import { getWorkdayStats } from '@/features/stats/services/workday-stats.service';
import { SEEDED_WORKDAY, seedWorkday } from '@/features/stats/testing/seed-workday';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/expense-schema';
import { providers } from '@/lib/db/schema';
import { TEST_USER_IDS } from '@/test/as-user';
import { seedTestUser } from '@/test/seed-test-user';
import { truncateAll } from '@/test/truncate-all';
import { EXPENSE_PROVIDER } from '../testing/expense-provider';
import { describeExpenseRepository, EXPENSE_INPUT } from '../testing/expense-repository.behavior';
import { drizzleExpenseRepository } from './expense.repository';

afterAll(async () => {
  await db.$client.end();
});

describeExpenseRepository('Drizzle contra db-test', async () => {
  await truncateAll();
  await seedTestUser('admin');
  await db.insert(providers).values(EXPENSE_PROVIDER);
  return { repository: drizzleExpenseRepository(db), userId: TEST_USER_IDS.admin };
});

describe('los gastos no tocan Estadísticas (US-14 CA-3)', () => {
  it('cargar un gasto en la jornada no cambia ningún número', async () => {
    await truncateAll();
    await seedWorkday();
    await seedTestUser('admin');
    await db.insert(providers).values(EXPENSE_PROVIDER);
    const before = await getWorkdayStats({ from: SEEDED_WORKDAY, to: SEEDED_WORKDAY });
    await drizzleExpenseRepository(db).insert({ ...EXPENSE_INPUT, invoiceDate: SEEDED_WORKDAY, userId: TEST_USER_IDS.admin });
    expect(await getWorkdayStats({ from: SEEDED_WORKDAY, to: SEEDED_WORKDAY })).toEqual(before);
  });

  it('el CHECK rechaza un monto de 0', async () => {
    await truncateAll();
    await seedTestUser('admin');
    await expect(db.insert(expenses).values({ ...EXPENSE_INPUT, amount: '0', userId: TEST_USER_IDS.admin })).rejects.toThrow();
  });
});

describe('gastos viejos sin proveedor', () => {
  it('se leen con proveedor null', async () => {
    await truncateAll();
    await seedTestUser('admin');
    const { invoiceNumber, title, invoiceDate } = EXPENSE_INPUT;
    await db.insert(expenses).values({ invoiceNumber, title, invoiceDate, amount: '10.00', userId: TEST_USER_IDS.admin });
    expect(await drizzleExpenseRepository(db).findAll()).toMatchObject([{ providerId: null, providerName: null }]);
  });
});
