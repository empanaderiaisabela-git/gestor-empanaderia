import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { createFakeSaleHistoryUnitOfWork } from '../testing/fake-sale-history';
import { CALLER, CARNE, checkoutOf, COCA, cokes, halfAndHalf, halfDozen, loadMenu, POLLO, PREPIZZA, stockOf } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';
import { createSaleHistoryService } from './sale-history.service';

const ADMIN = { id: '00000000-0000-4000-8000-00000000000a' };
const fake = createFakeCheckoutUnitOfWork();
const checkout = createCheckoutService({ unitOfWork: fake });
const history = createSaleHistoryService({ unitOfWork: createFakeSaleHistoryUnitOfWork(fake) });
const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];

describe('historial y anulación (US-7)', () => {
  beforeEach(() => {
    loadMenu(fake);
    fake.stock.state.usernames.set(CALLER.id, 'vendedora');
  });

  it('lista las ventas de la más nueva a la más vieja, con sus líneas en orden y sus pagos (CA-1)', async () => {
    const first = await checkout.checkout(CALLER, checkoutOf([cokes(1)], { payments: cash(2500) }));
    const second = await checkout.checkout(CALLER, checkoutOf([halfDozen, halfAndHalf], { buyerName: 'Marta', payments: cash(18000) }));
    const sales = await history.list();
    expect(sales.map((sale) => sale.id)).toEqual([second.saleId, first.saleId]);
    expect(sales[0]).toMatchObject({ buyerName: 'Marta', vendorName: 'vendedora', total: '18000.00', payments: [{ type: 'efectivo', amount: '18000.00' }] });
    expect(sales[0].lines.map((line) => line.description)).toEqual(['2 Carne + 4 Pollo', 'Muzza / Napolitana']);
  });

  it('anular repone el stock exacto, la prepizza de la mitad y mitad incluida, y borra la venta (CA-3; US-29 CA-4)', async () => {
    const { saleId } = await checkout.checkout(CALLER, checkoutOf([halfDozen, halfAndHalf, cokes(2)], { payments: cash(23000) }));
    const voided = await history.voidSale(ADMIN, saleId);
    expect(voided.id).toBe(saleId);
    expect([CARNE, POLLO, PREPIZZA, COCA].map((item) => stockOf(fake, item.id))).toEqual(['10.0', '10.0', '2.0', '5.0']);
    expect(await history.list()).toEqual([]);
    expect(fake.audits.at(-1)).toEqual({
      userId: ADMIN.id,
      action: 'ELIMINAR',
      entity: 'SALE',
      entityId: saleId,
      detail: { total: 23000, buyerName: null, vendorName: 'vendedora', lines: ['2 Carne + 4 Pollo', 'Muzza / Napolitana', 'Coca 500'], payments: [{ type: 'efectivo', amount: 23000 }], note: 'Venta anulada. Stock repuesto.' },
    });
  });

  it('una venta no se anula dos veces: la segunda da NOT_FOUND y no repone de nuevo', async () => {
    const { saleId } = await checkout.checkout(CALLER, checkoutOf([cokes(1)], { payments: cash(2500) }));
    await history.voidSale(ADMIN, saleId);
    await expect(history.voidSale(ADMIN, saleId)).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'La venta ya no existe.' });
    expect(stockOf(fake, COCA.id)).toBe('5.0');
  });

  it('NOT_FOUND si el gusto ya no existe, y STALE_VERSION si cambió en el medio', async () => {
    const { saleId } = await checkout.checkout(CALLER, checkoutOf([cokes(1)], { payments: cash(2500) }));
    const repository = fake.stock.read;
    fake.stock.read = { ...repository, saveItem: async () => null };
    await expect(history.voidSale(ADMIN, saleId)).rejects.toMatchObject({ code: 'STALE_VERSION' });
    fake.stock.read = { ...repository, lockItem: async () => null };
    await expect(history.voidSale(ADMIN, saleId)).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'El producto ya no existe.' });
    fake.stock.read = repository;
  });
});
