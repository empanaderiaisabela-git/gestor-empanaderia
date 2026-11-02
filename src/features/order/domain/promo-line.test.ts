import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isComplete } from './order-line';
import { addToPromo, describePromoFlavors, expandComponents, firstOpenPart, isPromoComplete, newPromoLine, nextOpenPart, orderSubtotal, promoUsageLines } from './promo-line';

const PROMO = {
  id: 'p1',
  name: 'Docena + 2 Coca',
  price: 15000,
  components: [
    { group: 'empanadas' as const, presentationKey: 'u12', quantity: 1, menuItemId: null },
    { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 2, menuItemId: null },
  ],
};
const SPRITE = { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 1, menuItemId: 'sprite' };
const names: Record<string, string> = { carne: 'Carne', pollo: 'Pollo', coca: 'Coca 500', sprite: 'Sprite' };
const nameOf = (id: string): string => names[id] ?? '?';

describe('línea de promo en el pedido (US-9 CA-1 y CA-2)', () => {
  it('cada producto se abre en tantas partes como su cantidad, para elegir un gusto por parte', () => {
    expect(expandComponents(PROMO.components)).toEqual([
      { group: 'empanadas', presentationKey: 'u12', menuItemId: null },
      { group: 'coca_cola', presentationKey: 'u1', menuItemId: null },
      { group: 'coca_cola', presentationKey: 'u1', menuItemId: null },
    ]);
  });

  it('la bebida fija ya viene puesta y el próximo producto abierto la saltea (US-55)', () => {
    const promo = newPromoLine({ ...PROMO, components: [PROMO.components[0], SPRITE, { ...SPRITE, menuItemId: null }] }, 'x');
    expect(promo.parts[1].flavors).toEqual([{ menuItemId: 'sprite', units: 1 }]);
    expect([firstOpenPart(promo), nextOpenPart(promo, 0), nextOpenPart(promo, 2)]).toEqual([0, 2, null]);
    expect(firstOpenPart(newPromoLine({ ...PROMO, components: [SPRITE] }, 'y'))).toBeNull();
  });

  it('fuzz: una promo nueva arranca completa justo en las partes con bebida fija (US-55)', () => {
    const component = fc.record({ fixed: fc.boolean(), quantity: fc.integer({ min: 1, max: 3 }) });
    fc.assert(
      fc.property(fc.array(component, { minLength: 1, maxLength: 5 }), (list) => {
        const components = list.map(({ fixed, quantity }) => ({ ...SPRITE, quantity, menuItemId: fixed ? 'sprite' : null }));
        const promo = newPromoLine({ ...PROMO, components }, 'x');
        expect(promo.parts.map(isComplete)).toEqual(expandComponents(components).map((key) => key.menuItemId !== null));
      })
    );
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
