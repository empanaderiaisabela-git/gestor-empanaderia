import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { OrderLine } from './order-line';
import { linePrice, orderTotal, type PriceBook, type Prices, unitLinePrice } from './order-pricing';
import { availableStock, lineCost, orderUsage } from './order-usage';

const ITEMS: Record<string, Prices> = {
  muzza: { price1: 10000 },
  jyq: { price1: 5000 },
  primavera: { price1: 1600, price3: 4500, price6: 8600, price12: 16500 },
  jamon: { price1: 1400, price3: 4000, price6: 7600, price12: 14500 },
  coca: { price1: 3500 },
};
const BOOK: PriceBook = {
  item: (id) => ITEMS[id],
  group: (group) => (group === 'empanadas' ? { price1: 1200, price3: 3400, price6: 6500, price12: 12000 } : undefined),
};
const line = (group: OrderLine['group'], presentationKey: string, flavors: OrderLine['flavors']): OrderLine => ({ id: 'l', group, presentationKey, flavors, quantity: 1 });
const times = (base: OrderLine, quantity: number): OrderLine => ({ ...base, quantity });

describe('precio de cada línea (US-5 CA-2 a CA-4; specs.md)', () => {
  it('pizza mitad muzza ($10) y mitad J&Q ($5) cuesta $10: la más cara', () => {
    expect(unitLinePrice(line('pizzas', 'pizza_2', [{ menuItemId: 'muzza', units: 0.5 }, { menuItemId: 'jyq', units: 0.5 }]), BOOK)).toBe(10000);
  });

  it('la ½ docena de empanadas vale el precio del grupo, surtida o no', () => {
    expect(unitLinePrice(line('empanadas', 'u6', [{ menuItemId: 'carne', units: 2 }, { menuItemId: 'pollo', units: 4 }]), BOOK)).toBe(6500);
  });

  it('sanguches surtidos: proporcional al precio de cada gusto', () => {
    const mix = line('sanguches', 'u6', [{ menuItemId: 'primavera', units: 2 }, { menuItemId: 'jamon', units: 4 }]);
    expect(unitLinePrice(mix, BOOK)).toBe(7933.33);
  });

  it('la cantidad multiplica: 2 Coca-Cola', () => {
    expect(linePrice(times(line('coca_cola', 'u1', [{ menuItemId: 'coca', units: 1 }]), 2), BOOK)).toBe(7000);
  });

  it('sin precio cargado (grupo o gusto) la línea no tiene precio y el total tampoco', () => {
    const ciabatta = line('ciabattas', 'u1', [{ menuItemId: 'pollo', units: 1 }]);
    expect(linePrice(ciabatta, BOOK)).toBeNull();
    expect(orderTotal([ciabatta], BOOK)).toBeNull();
    expect(unitLinePrice(line('pizzas', 'pizza_1', []), BOOK)).toBeNull();
  });

  it('suma el total del pedido', () => {
    expect(orderTotal([line('empanadas', 'u12', [{ menuItemId: 'carne', units: 12 }]), line('coca_cola', 'u1', [{ menuItemId: 'coca', units: 1 }])], BOOK)).toBe(15500);
  });

  it('fuzz: si todos los gustos valen lo mismo, la surtida cuesta lo mismo que la entera', () => {
    const same: PriceBook = { item: () => ({ price1: 1000, price3: 2800, price6: 5400, price12: 10000 }), group: () => undefined };
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 6 }), (carne) => {
        const flavors = [{ menuItemId: 'a', units: carne }, { menuItemId: 'b', units: 6 - carne }].filter((flavor) => flavor.units > 0);
        return unitLinePrice(line('sanguches', 'u6', flavors), same) === 5400;
      })
    );
  });
});

describe('consumo de stock y costo (US-5 CA-5; US-6 CA-3)', () => {
  const pizza = line('pizzas', 'pizza_2', [{ menuItemId: 'muzza', units: 0.5 }, { menuItemId: 'napo', units: 0.5 }]);

  it('la mitad y mitad consume ½ de cada gusto y cuesta ½ + ½ ($2.000 + $1.500)', () => {
    expect([...orderUsage([pizza])]).toEqual([['muzza', 0.5], ['napo', 0.5]]);
    expect(lineCost(pizza, (id) => (id === 'muzza' ? 4000 : 3000))).toBe(3500);
  });

  it('el stock disponible descuenta lo que ya está en el pedido', () => {
    const lines = [times(line('empanadas', 'u6', [{ menuItemId: 'carne', units: 6 }]), 2), line('empanadas', 'u1', [{ menuItemId: 'carne', units: 1 }])];
    expect(availableStock({ id: 'carne', stock: 20 }, lines)).toBe(7);
    expect(availableStock({ id: 'pollo', stock: 20 }, lines)).toBe(20);
  });
});
