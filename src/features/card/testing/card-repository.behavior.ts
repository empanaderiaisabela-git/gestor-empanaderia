import { beforeEach, describe, expect, it } from 'vitest';
import { databaseErrorCode } from '@/lib/db-errors';
import type { CardRepository } from '@/features/card/repository/card.repository';

export const CARD_INPUT = { name: 'Visa', plans: [{ installments: 3, surchargePct: 10.5 }, { installments: 1, surchargePct: 0 }] };
export type CardRepositoryHarness = { repository: CardRepository };

async function failureCode(operation: Promise<unknown>): Promise<string | null> {
  return operation.then(
    () => 'sin error',
    (error: unknown) => databaseErrorCode(error)
  );
}

export function describeCardRepository(label: string, setup: () => Promise<CardRepositoryHarness>): void {
  describe(`CardRepository (${label}) — US-10 CA-1`, () => {
    let harness: CardRepositoryHarness;

    beforeEach(async () => {
      harness = await setup();
    });

    it('inserta una tarjeta activa con versión 1 y sus planes ordenados por cuotas', async () => {
      const created = await harness.repository.insert(CARD_INPUT);
      expect(created).toMatchObject({ name: 'Visa', isActive: true, version: 1 });
      expect(created.plans).toEqual([{ installments: 1, surchargePct: '0.00' }, { installments: 3, surchargePct: '10.50' }]);
      expect((await harness.repository.findById(created.id))?.plans).toEqual(created.plans);
    });

    it('busca por nombre sin distinguir mayúsculas y rechaza un nombre exacto repetido', async () => {
      await harness.repository.insert(CARD_INPUT);
      expect(await harness.repository.findByName('VISA')).not.toBeNull();
      expect(await failureCode(harness.repository.insert(CARD_INPUT))).toBe('DUPLICATE');
    });

    it('edita filtrando por versión, suma 1 y reemplaza los planes', async () => {
      const created = await harness.repository.insert(CARD_INPUT);
      const updated = await harness.repository.update({ id: created.id, version: 1 }, { plans: [{ installments: 12, surchargePct: 40 }] });
      expect(updated).toMatchObject({ version: 2, plans: [{ installments: 12, surchargePct: '40.00' }] });
      expect(await harness.repository.update({ id: created.id, version: 1 }, { isActive: false })).toBeNull();
    });

    it('borra con la versión actual; con una vieja no', async () => {
      const created = await harness.repository.insert(CARD_INPUT);
      expect(await harness.repository.remove({ id: created.id, version: 9 })).toBe(false);
      expect(await harness.repository.remove({ id: created.id, version: 1 })).toBe(true);
      expect(await harness.repository.findById(created.id)).toBeNull();
    });

    it('lista por nombre', async () => {
      await harness.repository.insert({ ...CARD_INPUT, name: 'Visa' });
      await harness.repository.insert({ ...CARD_INPUT, name: 'Mastercard' });
      expect((await harness.repository.findAll()).map((row) => row.name)).toEqual(['Mastercard', 'Visa']);
    });
  });
}
