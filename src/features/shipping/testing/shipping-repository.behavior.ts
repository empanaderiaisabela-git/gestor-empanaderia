import { beforeEach, describe, expect, it } from 'vitest';
import { databaseErrorCode } from '@/lib/db-errors';
import type { ShippingRepository } from '@/features/shipping/repository/shipping.repository';

export type ShippingRepositoryHarness = {
  repository: ShippingRepository;
  linkSale(shippingId: string): Promise<void>;
};

const INPUT = { title: 'Centro', detail: 'Barrio A hasta Barrio B', amount: 1500 };

async function failureCode(operation: Promise<unknown>): Promise<string | null> {
  return operation.then(
    () => 'sin error',
    (error: unknown) => databaseErrorCode(error)
  );
}

export function describeShippingRepository(label: string, setup: () => Promise<ShippingRepositoryHarness>): void {
  describe(`ShippingRepository (${label}) — US-58`, () => {
    let harness: ShippingRepositoryHarness;

    beforeEach(async () => {
      harness = await setup();
    });

    it('inserta un envío activo con versión 1, el monto con 2 decimales, y lo encuentra por id', async () => {
      const created = await harness.repository.insert(INPUT);
      expect(created).toMatchObject({ title: 'Centro', detail: INPUT.detail, amount: '1500.00', isActive: true, version: 1 });
      expect(await harness.repository.findById(created.id)).toMatchObject({ title: 'Centro' });
    });

    it('acepta un envío gratis ($0)', async () => {
      expect(await harness.repository.insert({ ...INPUT, amount: 0 })).toMatchObject({ amount: '0.00' });
    });

    it('busca por título sin distinguir mayúsculas y trata % y _ como texto', async () => {
      await harness.repository.insert({ ...INPUT, title: 'Zona_100%' });
      expect(await harness.repository.findByTitle('zona_100%')).toMatchObject({ title: 'Zona_100%' });
      expect(await harness.repository.findByTitle('ZonaX100Y')).toBeNull();
    });

    it('rechaza un título exacto repetido con un error de duplicado', async () => {
      await harness.repository.insert(INPUT);
      expect(await failureCode(harness.repository.insert(INPUT))).toBe('DUPLICATE');
    });

    it('actualiza filtrando por versión y suma 1', async () => {
      const created = await harness.repository.insert(INPUT);
      const updated = await harness.repository.update({ id: created.id, version: 1 }, { amount: 1800.5, isActive: false });
      expect(updated).toMatchObject({ amount: '1800.50', isActive: false, version: 2 });
    });

    it('con una versión vieja no actualiza ni borra', async () => {
      const created = await harness.repository.insert(INPUT);
      await harness.repository.update({ id: created.id, version: 1 }, { detail: 'Otro' });
      expect(await harness.repository.update({ id: created.id, version: 1 }, { detail: 'Más' })).toBeNull();
      expect(await harness.repository.remove({ id: created.id, version: 1 })).toBe(false);
    });

    it('borra con la versión actual', async () => {
      const created = await harness.repository.insert(INPUT);
      expect(await harness.repository.remove({ id: created.id, version: 1 })).toBe(true);
      expect(await harness.repository.findById(created.id)).toBeNull();
    });

    it('sabe si se usó en una venta y no deja borrarlo', async () => {
      const created = await harness.repository.insert(INPUT);
      expect(await harness.repository.hasSales(created.id)).toBe(false);
      await harness.linkSale(created.id);
      expect(await harness.repository.hasSales(created.id)).toBe(true);
      expect(await failureCode(harness.repository.remove({ id: created.id, version: 1 }))).toBe('HAS_RELATIONS');
    });

    it('lista del más nuevo al más viejo', async () => {
      await harness.repository.insert({ ...INPUT, title: 'Primero' });
      await harness.repository.insert({ ...INPUT, title: 'Segundo' });
      expect((await harness.repository.findAll()).map((row) => row.title)).toEqual(['Segundo', 'Primero']);
    });
  });
}
