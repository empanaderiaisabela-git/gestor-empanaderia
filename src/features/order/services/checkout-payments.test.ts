import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { CALLER, checkoutOf, COCA, cokes, loadMenu, stockOf } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';

const fake = createFakeCheckoutUnitOfWork();
const service = createCheckoutService({ unitOfWork: fake });
const VISA = { name: 'Visa', plans: [{ installments: 1, surchargePct: 0 }, { installments: 3, surchargePct: 10 }] };

async function visa(): Promise<string> {
  return (await fake.cards.read.insert(VISA)).id;
}

describe('cobrar con crédito en cuotas (US-11 CA-1 y CA-2)', () => {
  beforeEach(() => loadMenu(fake));

  it('el recargo va sólo sobre la parte en crédito y suma al total: $4.000 en efectivo + $6.000 al 10 % = $10.600', async () => {
    const cardId = await visa();
    const payments = [{ type: 'efectivo' as const, amount: 4000 }, { type: 'credito' as const, amount: 6000, cardId, installments: 3 }];
    const result = await service.checkout(CALLER, checkoutOf([cokes(4)], { payments }));
    expect(result.total).toBe(10600);
    expect(fake.sales[0]).toMatchObject({ total: 10600 });
    expect(fake.sales[0].payments).toEqual([
      { type: 'efectivo', amount: 4000, cardId: null, installments: null, surchargePct: null, surchargeAmount: null },
      { type: 'credito', amount: 6000, cardId, installments: 3, surchargePct: 10, surchargeAmount: 600 },
    ]);
  });

  it('en 1 cuota sin recargo el total no cambia; el débito no pide tarjeta', async () => {
    const cardId = await visa();
    expect((await service.checkout(CALLER, checkoutOf([cokes(1)], { payments: [{ type: 'credito', amount: 2500, cardId, installments: 1 }] }))).total).toBe(2500);
    expect((await service.checkout(CALLER, checkoutOf([cokes(1)], { payments: [{ type: 'debito', amount: 2500 }] }))).total).toBe(2500);
  });

  it('el recargo lo calcula el servidor con el % guardado, aunque el plan haya cambiado', async () => {
    const cardId = await visa();
    await fake.cards.read.update({ id: cardId, version: 1 }, { plans: [{ installments: 3, surchargePct: 20 }] });
    expect((await service.checkout(CALLER, checkoutOf([cokes(2)], { payments: [{ type: 'credito', amount: 5000, cardId, installments: 3 }] }))).total).toBe(6000);
  });

  it.each([
    { caso: 'tarjeta desactivada', setup: async (id: string) => void (await fake.cards.read.update({ id, version: 1 }, { isActive: false })), installments: 3, message: 'El/la tarjeta seleccionado ya no existe.' },
    { caso: 'tarjeta inexistente', setup: async () => undefined, installments: 3, message: 'El/la tarjeta seleccionado ya no existe.', ghost: true },
    { caso: 'cuotas que la tarjeta no tiene', setup: async () => undefined, installments: 12, message: 'El/la plan de cuotas seleccionado ya no existe.' },
  ])('NOT_FOUND: $caso, sin registrar la venta ni tocar el stock (CA-3)', async ({ setup, installments, message, ghost }) => {
    const cardId = await visa();
    await setup(cardId);
    const payments = [{ type: 'credito' as const, amount: 2500, cardId: ghost ? crypto.randomUUID() : cardId, installments }];
    await expect(service.checkout(CALLER, checkoutOf([cokes(1)], { payments }))).rejects.toMatchObject({ code: 'NOT_FOUND', message });
    expect([fake.sales.length, stockOf(fake, COCA.id)]).toEqual([0, '5.0']);
  });
});
