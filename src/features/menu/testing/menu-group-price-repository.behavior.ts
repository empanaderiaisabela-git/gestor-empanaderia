import { beforeEach, describe, expect, it } from 'vitest';
import type { MenuGroupPriceRepository } from '@/features/menu/repository/menu-group-price.repository';

const EMPANADAS = { group: 'empanadas' as const, prices: { price1: 1200, price3: 3400, price6: 6500, price12: 12000 } };

export function describeMenuGroupPriceRepository(label: string, setup: () => Promise<MenuGroupPriceRepository>): void {
  describe(`MenuGroupPriceRepository (${label}) — US-3 CA-7`, () => {
    let repository: MenuGroupPriceRepository;

    beforeEach(async () => {
      repository = await setup();
    });

    it('con versión 0 carga los precios por primera vez, con versión 1', async () => {
      expect(await repository.save({ ...EMPANADAS, version: 0 })).toMatchObject({ group: 'empanadas', price1: '1200.00', price12: '12000.00', version: 1 });
      expect((await repository.findAll()).map((row) => row.group)).toEqual(['empanadas']);
    });

    it('con versión 0 no pisa precios que ya existen', async () => {
      await repository.save({ ...EMPANADAS, version: 0 });
      expect(await repository.save({ ...EMPANADAS, version: 0 })).toBeNull();
    });

    it('cambia los precios filtrando por versión y suma 1; con una versión vieja no cambia nada', async () => {
      await repository.save({ ...EMPANADAS, version: 0 });
      expect(await repository.save({ ...EMPANADAS, prices: { ...EMPANADAS.prices, price1: 1300 }, version: 1 })).toMatchObject({ price1: '1300.00', version: 2 });
      expect(await repository.save({ ...EMPANADAS, version: 1 })).toBeNull();
    });

    it('guarda las ciabattas sólo con el precio de la unidad', async () => {
      expect(await repository.save({ group: 'ciabattas', prices: { price1: 6000 }, version: 0 })).toMatchObject({ price1: '6000.00', price3: null, price12: null });
    });
  });
}
