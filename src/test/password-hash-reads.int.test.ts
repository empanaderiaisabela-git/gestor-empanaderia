import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { sales, users } from '@/lib/db/schema';
import { saleRepository } from '@/features/sale/repository/sale.repository';
import { getDashboardSnapshot } from '@/features/stats/repository/stats.repository';
import { DASHBOARD_RANGE, seedDashboard } from '@/features/stats/testing/seed-dashboard';
import { userRepository } from '@/features/user/repository/user.repository';
import { truncateAll } from './truncate-all';

function expectNoPasswordHash(value: unknown): void {
  expect(JSON.stringify(value)).not.toMatch(/passwordHash|password_hash|hash-de-prueba/);
}

describe('regression BUG-6: las lecturas fuera de auth no traen password_hash', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedDashboard();
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

  it('getSaleById, que usa la anulación de ventas', async () => {
    const [sale] = await db.select({ id: sales.id }).from(sales);
    const found = await saleRepository.getSaleById(sale.id);
    expect(found?.vendor).toMatchObject({ username: 'vendedora' });
    expectNoPasswordHash(found);
  });

  it('la foto del dashboard', async () => {
    expectNoPasswordHash(await getDashboardSnapshot(DASHBOARD_RANGE));
  });

  it('el listado de usuarios', async () => {
    expectNoPasswordHash(await userRepository.getAllUsers());
  });
});
