import { beforeEach, describe, expect, it } from 'vitest';
import type { StockRepository } from '@/features/stock/repository/stock.repository';

export type StockRepositoryHarness = { repository: StockRepository; itemId: string; siblingId: string; userId: string; providerId: string };

export function describeStockRepository(label: string, setup: () => Promise<StockRepositoryHarness>): void {
  describe(`StockRepository (${label}) — US-4`, () => {
    let harness: StockRepositoryHarness;

    beforeEach(async () => {
      harness = await setup();
    });

    it('bloquea y devuelve el gusto; uno inexistente da null', async () => {
      expect(await harness.repository.lockItem(harness.itemId)).toMatchObject({ id: harness.itemId, version: 1 });
      expect(await harness.repository.lockItem('44444444-4444-4444-8444-444444444444')).toBeNull();
    });

    it('guarda el stock y el costo nuevos sumando 1 a la versión; con una versión vieja no guarda', async () => {
      expect(await harness.repository.saveItem({ id: harness.itemId, version: 1 }, { stock: 12.5, unitCost: 450 })).toMatchObject({ stock: '12.5', unitCost: '450.00', version: 2 });
      expect(await harness.repository.saveItem({ id: harness.itemId, version: 1 }, { stock: 1 })).toBeNull();
    });

    it('guarda también los precios del gusto, y sin precios nuevos los conserva (US-17)', async () => {
      const { repository, itemId } = harness;
      expect(await repository.saveItem({ id: itemId, version: 1 }, { stock: 3, prices: { price1: 12000 } })).toMatchObject({ price1: '12000.00', price3: null, version: 2 });
      expect(await repository.saveItem({ id: itemId, version: 2 }, { stock: 4 })).toMatchObject({ price1: '12000.00', version: 3 });
    });

    it('bloquea todos los gustos de un grupo, ordenados por id (US-28)', async () => {
      const { repository, itemId, siblingId } = harness;
      expect((await repository.lockGroup('pizzas')).map((item) => item.id)).toEqual([itemId, siblingId].sort());
      expect(await repository.lockGroup('pepsi')).toEqual([]);
    });

    it('guarda sólo costo y precios, sin tocar el stock (US-28 CA-5)', async () => {
      expect(await harness.repository.saveItem({ id: harness.itemId, version: 1 }, { unitCost: 3100, prices: { price1: 12500 } })).toMatchObject({ stock: '2.5', unitCost: '3100.00', price1: '12500.00', version: 2 });
    });

    it('sin costo nuevo, conserva el costo', async () => {
      const before = await harness.repository.lockItem(harness.itemId);
      expect(await harness.repository.saveItem({ id: harness.itemId, version: 1 }, { stock: 3 })).toMatchObject({ unitCost: before?.unitCost });
    });

    it('registra ingresos y los lista del más nuevo al más viejo, con proveedor y usuario', async () => {
      const { repository, itemId, userId, providerId } = harness;
      await repository.insertEntry({ menuItemId: itemId, quantity: 12, unitCost: 400, providerId, userId });
      await new Promise((resolve) => setTimeout(resolve, 5));
      await repository.insertEntry({ menuItemId: itemId, quantity: 6, unitCost: 420, providerId: null, userId });
      expect(await repository.entriesOf(itemId)).toMatchObject([
        { quantity: 6, unitCost: '420.00', providerName: null, username: 'admin' },
        { quantity: 12, unitCost: '400.00', providerName: 'Molino del Sur', username: 'admin' },
      ]);
    });

    it('registra una merma con media unidad y el costo del momento', async () => {
      const { repository, itemId, userId } = harness;
      expect(await repository.insertLoss({ menuItemId: itemId, quantity: 0.5, unitCost: 3000, reason: 'Se quemó', userId })).toMatchObject({ quantity: '0.5', unitCost: '3000.00', reason: 'Se quemó' });
    });
  });
}
