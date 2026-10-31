import { describe, expect, it } from 'vitest';
import { describeFlavors } from './order-describe';
import { mergeLine, type OrderLine } from './order-line';
import { linePrice, type PriceBook } from './order-pricing';
import { isValidLine } from './order-validation';
import { orderSubtotal, type PromoLine } from './promo-line';

const PRICES: Record<string, number> = { muzza: 10000, napo: 12000, carne: 1000 };
const book = (ham: number | null): PriceBook => ({ item: (id) => ({ price1: PRICES[id] }), ham });
const pizza = (overrides: Partial<OrderLine> = {}): OrderLine => ({ id: 'a', group: 'pizzas', presentationKey: 'pizza_1', flavors: [{ menuItemId: 'muzza', units: 1 }], quantity: 1, ...overrides });
const half = pizza({ presentationKey: 'pizza_2', flavors: [{ menuItemId: 'muzza', units: 0.5 }, { menuItemId: 'napo', units: 0.5 }] });
const names = (id: string): string => ({ muzza: 'Muzza', napo: 'Napolitana' })[id] ?? id;

describe('jamón extra en una pizza del carrito (US-47)', () => {
  it('suma el precio del jamón a cada pizza del renglón (D-1), también en mitad y mitad', () => {
    expect(linePrice(pizza({ ham: true, quantity: 3 }), book(1500))).toBe(34500);
    expect(linePrice({ ...half, ham: true }, book(1500))).toBe(13500);
    expect(linePrice(pizza(), book(1500))).toBe(10000);
  });

  it('sin precio cargado, la pizza con jamón no tiene precio (P-2)', () => {
    expect(linePrice(pizza({ ham: true }), book(null))).toBeNull();
    expect(linePrice(pizza({ ham: true }), { item: book(1).item })).toBeNull();
  });

  it('el jamón sólo va en pizzas (VALIDATION)', () => {
    expect(isValidLine(pizza({ ham: true }))).toBe(true);
    expect(isValidLine({ id: 'e', group: 'empanadas', presentationKey: 'u1', flavors: [{ menuItemId: 'carne', units: 1 }], quantity: 1, ham: true })).toBe(false);
  });

  it('el renglón dice "+ Jamón extra"', () => {
    expect(describeFlavors(pizza({ ham: true }), names)).toBe('Muzza + Jamón extra');
    expect(describeFlavors({ ...half, ham: true }, names)).toBe('Muzza / Napolitana + Jamón extra');
  });

  it('una pizza nueva no se junta con un renglón con jamón (CA-3)', () => {
    const lines = [pizza({ ham: true }), pizza({ id: 'b' })];
    expect(mergeLine(lines, lines[1])).toHaveLength(2);
    expect(mergeLine([pizza(), pizza({ id: 'b' })], pizza({ id: 'b' }))).toEqual([pizza({ quantity: 2 })]);
  });

  it('cada pizza de una promo con jamón suma su precio al de la promo (D-2)', () => {
    const promo: PromoLine = { id: 'p', promotionId: 'x', name: '2 pizzas', price: 20000, parts: [pizza({ ham: true }), pizza({ id: 'c', ham: true })] };
    expect(orderSubtotal([], [promo], book(1500))).toBe(23000);
    expect(orderSubtotal([], [promo], book(null))).toBeNull();
  });
});
