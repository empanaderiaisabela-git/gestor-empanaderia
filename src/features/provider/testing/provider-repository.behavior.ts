import { beforeEach, describe, expect, it } from 'vitest';
import { databaseErrorCode } from '@/lib/db-errors';
import type { ProviderRepository } from '@/features/provider/repository/provider.repository';

export type ProviderRepositoryHarness = {
  repository: ProviderRepository;
  linkProduct(providerId: string): Promise<void>;
};

const INPUT = { name: 'Molino del Sur', phone: '1155550000', email: 'ventas@molino.com' };

async function failureCode(operation: Promise<unknown>): Promise<string | null> {
  return operation.then(
    () => 'sin error',
    (error: unknown) => databaseErrorCode(error)
  );
}

export function describeProviderRepository(label: string, setup: () => Promise<ProviderRepositoryHarness>): void {
  describe(`ProviderRepository (${label}) — T-5 CA-3`, () => {
    let harness: ProviderRepositoryHarness;

    beforeEach(async () => {
      harness = await setup();
    });

    it('inserta un proveedor activo con versión 1 y lo encuentra por id', async () => {
      const created = await harness.repository.insert(INPUT);
      expect(created).toMatchObject({ ...INPUT, isActive: true, version: 1 });
      expect(await harness.repository.findById(created.id)).toMatchObject(INPUT);
    });

    it('busca por nombre sin distinguir mayúsculas y trata % y _ como texto', async () => {
      await harness.repository.insert({ ...INPUT, name: 'Pan_100%' });
      expect(await harness.repository.findByName('pan_100%')).toMatchObject({ name: 'Pan_100%' });
      expect(await harness.repository.findByName('PanX100Y')).toBeNull();
    });

    it('rechaza un nombre exacto repetido con un error de duplicado', async () => {
      await harness.repository.insert(INPUT);
      expect(await failureCode(harness.repository.insert(INPUT))).toBe('DUPLICATE');
    });

    it('actualiza filtrando por versión y suma 1', async () => {
      const created = await harness.repository.insert(INPUT);
      const updated = await harness.repository.update({ id: created.id, version: 1 }, { phone: '1199990000', isActive: false });
      expect(updated).toMatchObject({ phone: '1199990000', isActive: false, version: 2 });
    });

    it('con una versión vieja no actualiza ni borra', async () => {
      const created = await harness.repository.insert(INPUT);
      await harness.repository.update({ id: created.id, version: 1 }, { phone: '1' });
      expect(await harness.repository.update({ id: created.id, version: 1 }, { phone: '2' })).toBeNull();
      expect(await harness.repository.remove({ id: created.id, version: 1 })).toBe(false);
    });

    it('borra con la versión actual', async () => {
      const created = await harness.repository.insert(INPUT);
      expect(await harness.repository.remove({ id: created.id, version: 1 })).toBe(true);
      expect(await harness.repository.findById(created.id)).toBeNull();
    });

    it('sabe si tiene productos y no deja borrarlo', async () => {
      const created = await harness.repository.insert(INPUT);
      expect(await harness.repository.hasProducts(created.id)).toBe(false);
      await harness.linkProduct(created.id);
      expect(await harness.repository.hasProducts(created.id)).toBe(true);
      expect(await failureCode(harness.repository.remove({ id: created.id, version: 1 }))).toBe('HAS_RELATIONS');
    });

    it('lista del más nuevo al más viejo', async () => {
      await harness.repository.insert({ ...INPUT, name: 'Primero' });
      await harness.repository.insert({ ...INPUT, name: 'Segundo' });
      expect((await harness.repository.findAll()).map((row) => row.name)).toEqual(['Segundo', 'Primero']);
    });
  });
}
