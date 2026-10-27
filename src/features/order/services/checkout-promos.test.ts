import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeCheckoutUnitOfWork } from '../testing/fake-checkout-unit-of-work';
import { CALLER, CARNE, checkoutOf, COCA, cokes, loadMenu, MEDIA_Y_COCA, POLLO, promoOf, stockOf } from '../testing/checkout-fixtures';
import { createCheckoutService } from './checkout.service';

const fake = createFakeCheckoutUnitOfWork();
const service = createCheckoutService({ unitOfWork: fake });
const cash = (amount: number) => [{ type: 'efectivo' as const, amount }];

async function loadPromo(): Promise<string> {
  return (await fake.promotions.read.insert(MEDIA_Y_COCA)).id;
}

describe('cobrar promos (US-9 CA-2 y CA-3)', () => {
  beforeEach(() => loadMenu(fake));

  it('cobra una promo y una línea común con el precio de la base, y guarda los gustos de la promo con su costo', async () => {
    const id = await loadPromo();
    const result = await service.checkout(CALLER, checkoutOf([cokes(1)], { promos: [promoOf(id)], payments: cash(11500) }));
    expect(result.total).toBe(11500);
    expect(fake.sales[0].lines[1]).toEqual({
      group: null,
      presentationKey: null,
      promotionId: id,
      quantity: 1,
      unitPrice: 9000,
      subtotal: 9000,
      description: 'Media + Coca: Carne · Coca 500',
      position: 1,
      items: [{ menuItemId: CARNE.id, units: 6, unitCost: 400 }, { menuItemId: COCA.id, units: 1, unitCost: 1200 }],
    });
    expect([stockOf(fake, CARNE.id), stockOf(fake, COCA.id)]).toEqual(['4.0', '3.0']);
  });

  it('un pedido sólo con promos, surtida y con cantidad 2: cobra y consume el doble', async () => {
    const id = await loadPromo();
    const promo = promoOf(id, 2);
    const surtida = { ...promo, parts: [{ ...promo.parts[0], flavors: [{ menuItemId: CARNE.id, units: 3 }, { menuItemId: POLLO.id, units: 3 }] }, promo.parts[1]] };
    expect((await service.checkout(CALLER, checkoutOf([], { promos: [surtida], payments: cash(18000) }))).total).toBe(18000);
    expect(fake.sales[0].lines[0]).toMatchObject({ quantity: 2, subtotal: 18000, description: 'Media + Coca: 3 Carne + 3 Pollo · Coca 500' });
    expect([CARNE, POLLO, COCA].map((item) => stockOf(fake, item.id))).toEqual(['4.0', '4.0', '3.0']);
  });

  it('el descuento de la venta también alcanza a las promos (decisión provisoria D-2)', async () => {
    const id = await loadPromo();
    expect((await service.checkout(CALLER, checkoutOf([], { promos: [promoOf(id)], discountPercentage: 10, payments: cash(8100) }))).total).toBe(8100);
  });

  it('NOT_FOUND: una promo desactivada o que ya no existe', async () => {
    const id = await loadPromo();
    await fake.promotions.read.update({ id, version: 1 }, { isActive: false });
    await expect(service.checkout(CALLER, checkoutOf([], { promos: [promoOf(id)], payments: cash(9000) }))).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'La promoción ya no existe.' });
    await expect(service.checkout(CALLER, checkoutOf([], { promos: [promoOf(crypto.randomUUID())], payments: cash(9000) }))).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it.each([
    { caso: 'falta un producto', change: (promo: ReturnType<typeof promoOf>) => ({ ...promo, parts: promo.parts.slice(0, 1) }) },
    { caso: 'productos en otro orden', change: (promo: ReturnType<typeof promoOf>) => ({ ...promo, parts: [...promo.parts].reverse() }) },
    { caso: 'media docena incompleta', change: (promo: ReturnType<typeof promoOf>) => ({ ...promo, parts: [{ ...promo.parts[0], flavors: [{ menuItemId: CARNE.id, units: 5 }] }, promo.parts[1]] }) },
    { caso: 'un gusto de otro grupo', change: (promo: ReturnType<typeof promoOf>) => ({ ...promo, parts: [promo.parts[0], { ...promo.parts[1], flavors: [{ menuItemId: CARNE.id, units: 1 }] }] }) },
    { caso: 'un total adulterado a la baja', change: (promo: ReturnType<typeof promoOf>) => promo, paid: 1 },
  ])('VALIDATION: $caso, sin registrar nada', async ({ change, paid }) => {
    const id = await loadPromo();
    await expect(service.checkout(CALLER, checkoutOf([], { promos: [change(promoOf(id))], payments: cash(paid ?? 9000) }))).rejects.toMatchObject({ code: 'VALIDATION' });
    expect([fake.sales.length, stockOf(fake, CARNE.id)]).toEqual([0, '10.0']);
  });

  it('INSUFFICIENT_STOCK: la promo pide más bebidas de las que hay', async () => {
    const id = await loadPromo();
    await expect(service.checkout(CALLER, checkoutOf([cokes(5)], { promos: [promoOf(id)], payments: cash(21500) }))).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK', message: 'No hay stock suficiente de Coca 500.' });
    expect(stockOf(fake, COCA.id)).toBe('5.0');
  });
});
