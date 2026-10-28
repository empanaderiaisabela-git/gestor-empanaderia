import { beforeEach, describe, expect, it } from 'vitest';
import type { CheckoutLine } from '@/features/order/domain/checkout.schema';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { CALLER, CARNE, checkoutOf, COCA, cokes, halfDozen, HUMITA, JYQ, loadMenu, MUZZA, stockOf } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';

const fake = createFakeCheckoutUnitOfWork();
const service = createCheckoutService({ unitOfWork: fake });
const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];
const line = (group: CheckoutLine['group'], presentationKey: string, flavors: CheckoutLine['flavors']): CheckoutLine => ({ group, presentationKey, flavors, quantity: 1 });

describe('el cobro rechaza lo que no cierra y no registra nada (US-6 CA-2 y CA-4)', () => {
  beforeEach(() => loadMenu(fake));

  it.each([
    { caso: '½ docena incompleta', lines: [line('empanadas', 'u6', [{ menuItemId: CARNE.id, units: 5 }])], paid: 8000 },
    { caso: 'un gusto de otro grupo', lines: [line('empanadas', 'u1', [{ menuItemId: MUZZA.id, units: 1 }])], paid: 1500 },
    { caso: 'un gusto dado de baja', lines: [line('empanadas', 'u1', [{ menuItemId: HUMITA.id, units: 1 }])], paid: 1500 },
    { caso: 'un gusto sin precio cargado', lines: [line('ciabattas', 'u1', [{ menuItemId: JYQ.id, units: 1 }])], paid: 3000 },
    { caso: 'pagos que no suman el total', lines: [cokes(2)], paid: 4999 },
    { caso: 'un total adulterado a la baja', lines: [halfDozen], paid: 1 },
  ])('VALIDATION: $caso', async ({ lines, paid }) => {
    await expect(service.checkout(CALLER, checkoutOf(lines, { payments: cash(paid) }))).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(fake.sales).toEqual([]);
  });

  it('VALIDATION: un descuento mayor al total', async () => {
    await expect(service.checkout(CALLER, checkoutOf([cokes(1)], { discountAmount: 3000, payments: cash(1) }))).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('NOT_FOUND: un gusto que ya no existe', async () => {
    const ghost = line('empanadas', 'u1', [{ menuItemId: '10000000-0000-4000-8000-0000000000ff', units: 1 }]);
    await expect(service.checkout(CALLER, checkoutOf([ghost], { payments: cash(1500) }))).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('INSUFFICIENT_STOCK con el nombre del gusto, sin tocar el stock de los demás', async () => {
    const order = checkoutOf([halfDozen, cokes(6)], { payments: cash(23000) });
    await expect(service.checkout(CALLER, order)).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK', message: 'No hay stock suficiente de Coca 500.' });
    expect([stockOf(fake, CARNE.id), stockOf(fake, COCA.id)]).toEqual(['10.0', '5.0']);
    expect(fake.sales).toEqual([]);
  });

  it('STALE_VERSION si el gusto cambió entre el bloqueo y el guardado', async () => {
    const repository = fake.stock.read;
    fake.stock.read = { ...repository, saveItem: async () => null };
    await expect(service.checkout(CALLER, checkoutOf([cokes(1)], { payments: cash(2500) }))).rejects.toMatchObject({ code: 'STALE_VERSION' });
    fake.stock.read = repository;
  });
});
