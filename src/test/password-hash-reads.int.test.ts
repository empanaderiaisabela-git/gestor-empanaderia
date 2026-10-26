import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { sales, users } from '@/lib/db/schema';
import { drizzleSaleHistoryRepository } from '@/features/order/repository/sale-history.repository';
import { workdayRange } from '@/features/stats/domain/workday';
import { getWorkdaySnapshot } from '@/features/stats/repository/stats.repository';
import { SEEDED_WORKDAY, seedWorkday } from '@/features/stats/testing/seed-workday';
import { userRepository } from '@/features/user/repository/user.repository';
import { truncateAll } from './truncate-all';

function expectNoPasswordHash(value: unknown): void {
  expect(JSON.stringify(value)).not.toMatch(/passwordHash|password_hash|hash-de-prueba/);
}

describe('regression BUG-6: las lecturas fuera de auth no traen password_hash', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedWorkday();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('getUserById, que usa verifyAuthOrAdmin', async () => {
    const [user] = await db.select({ id: users.id }).from(users);
    const found = await userRepository.getUserById(user.id);
    expect(found).toMatchObject({ username: 'vendedora', isActive: true });
    expectNoPasswordHash(found);
  });

  it('el historial de ventas y la venta que se anula', async () => {
    const [sale] = await db.select({ id: sales.id }).from(sales);
    const history = drizzleSaleHistoryRepository();
    const listed = await history.list();
    expect(listed.map((row) => row.vendorName)).toEqual(['vendedora', 'vendedora', 'vendedora', 'vendedora']);
    expectNoPasswordHash(listed);
    expectNoPasswordHash(await history.lockSale(sale.id));
  });

  it('la foto de la jornada de Estadísticas', async () => {
    expectNoPasswordHash(await getWorkdaySnapshot(workdayRange(SEEDED_WORKDAY)));
  });

  it('el listado de usuarios', async () => {
    expectNoPasswordHash(await userRepository.getAllUsers());
  });
});
