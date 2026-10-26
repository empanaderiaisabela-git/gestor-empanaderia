import { describe, expect, it } from 'vitest';
import { addToPromo, describePromoFlavors, expandComponents, firstOpenPart, isPromoComplete, newPromoLine, orderSubtotal, promoUsageLines } from './promo-line';

const PROMO = {
  id: 'p1',
  name: 'Docena + 2 Coca',
  price: 15000,
  components: [
    { group: 'empanadas' as const, presentationKey: 'u12', quantity: 1 },
    { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 2 },
  ],
};
const names: Record<string, string> = { carne: 'Carne', pollo: 'Pollo', coca: 'Coca 500', sprite: 'Sprite' };
const nameOf = (id: string): string => names[id] ?? '?';

describe('línea de promo en el pedido (US-9 CA-1 y CA-2)', () => {
  it('cada producto se abre en tantas partes como su cantidad, para elegir un gusto por parte', () => {
    expect(expandComponents(PROMO.components)).toEqual([
      { group: 'empanadas', presentationKey: 'u12' },
      { group: 'coca_cola', presentationKey: 'u1' },
      { group: 'coca_cola', presentationKey: 'u1' },
    ]);
  });

  it('una promo nueva tiene sus partes vacías y la primera abierta', () => {
    const promo = newPromoLine(PROMO, 'x');
    expect(promo).toMatchObject({ id: 'x', promotionId: 'p1', name: PROMO.name, price: 15000 });
    expect(promo.parts.map((part) => [part.group, part.flavors.length, part.quantity])).toEqual([
      ['empanadas', 0, 1],
      ['coca_cola', 0, 1],
      ['coca_cola', 0, 1],
    ]);
    expect([firstOpenPart(promo), isPromoComplete(promo)]).toEqual([0, false]);
  });

  it('completa las partes con "Agregar uno" y "Completar", y avisa cuál sigue', () => {
    let promo = newPromoLine(PROMO, 'x');
    promo = addToPromo(promo, { part: 0, menuItemId: 'carne', mode: 'one' }) ?? promo;
    promo = addToPromo(promo, { part: 0, menuItemId: 'pollo', mode: 'rest' }) ?? promo;
    expect([firstOpenPart(promo), describePromoFlavors(promo, nameOf)]).toEqual([1, '1 Carne + 11 Pollo']);
    promo = addToPromo(promo, { part: 1, menuItemId: 'coca', mode: 'one' }) ?? promo;
    promo = addToPromo(promo, { part: 2, menuItemId: 'sprite', mode: 'one' }) ?? promo;
    expect([firstOpenPart(promo), isPromoComplete(promo)]).toEqual([null, true]);
    expect(describePromoFlavors(promo, nameOf)).toBe('1 Carne + 11 Pollo · Coca 500 · Sprite');
  });

  it('no agrega a una parte llena ni a una parte que no existe', () => {
    const full = addToPromo(newPromoLine(PROMO, 'x'), { part: 1, menuItemId: 'coca', mode: 'one' });
    expect(full && addToPromo(full, { part: 1, menuItemId: 'sprite', mode: 'one' })).toBeNull();
    expect(addToPromo(newPromoLine(PROMO, 'x'), { part: 9, menuItemId: 'coca', mode: 'one' })).toBeNull();
  });

  it('el subtotal del pedido suma las líneas comunes y el precio de venta de cada promo', () => {
    const book = { item: () => ({ price1: 2500 }), group: () => undefined };
    const coca = { id: 'l', group: 'coca_cola' as const, presentationKey: 'u1', flavors: [{ menuItemId: 'coca', units: 1 }], quantity: 2 };
    expect(orderSubtotal([coca], [newPromoLine(PROMO, 'a'), newPromoLine(PROMO, 'b')], book)).toBe(35000);
    expect(orderSubtotal([], [], book)).toBe(0);
    expect(orderSubtotal([{ ...coca, presentationKey: 'u99' }], [], book)).toBeNull();
  });

  it('las partes de todas las promos cuentan para el stock disponible', () => {
    const promo = addToPromo(newPromoLine(PROMO, 'x'), { part: 1, menuItemId: 'coca', mode: 'one' });
    expect(promo && promoUsageLines([promo]).flatMap((part) => part.flavors)).toEqual([{ menuItemId: 'coca', units: 1 }]);
  });
});
