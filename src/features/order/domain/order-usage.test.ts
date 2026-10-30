import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { GROUPS, hasBase, MENU_GROUPS, type MenuGroup } from '@/features/menu/domain/menu-groups';
import type { OrderLine } from './order-line';
import { availableStock, canAddOne, stockUsage } from './order-usage';

const BASES: Partial<Record<MenuGroup, string>> = { pizzas: 'prepizza', ciabattas: 'pan' };
const baseOf = (group: MenuGroup): string | null => BASES[group] ?? null;
const line = (group: MenuGroup, presentationKey: string, flavors: OrderLine['flavors']): OrderLine => ({ id: 'l', group, presentationKey, flavors, quantity: 1 });
const times = (base: OrderLine, quantity: number): OrderLine => ({ ...base, quantity });
const halfAndHalf = line('pizzas', 'pizza_2', [{ menuItemId: 'muzza', units: 0.5 }, { menuItemId: 'napo', units: 0.5 }]);

describe('stockUsage: Pizzas y Ciabattas descuentan de su base (US-29 CA-3)', () => {
  it('una pizza de 1 sabor y una mitad y mitad consumen 1 prepizza cada una', () => {
    expect([...stockUsage([line('pizzas', 'pizza_1', [{ menuItemId: 'muzza', units: 1 }]), halfAndHalf], baseOf)]).toEqual([['prepizza', 2]]);
  });

  it('una ciabatta consume 1 pan, y la cantidad de la línea multiplica', () => {
    expect([...stockUsage([times(line('ciabattas', 'u1', [{ menuItemId: 'capresse', units: 1 }]), 3)], baseOf)]).toEqual([['pan', 3]]);
  });

  it('las empanadas y las bebidas siguen descontando de cada gusto', () => {
    const order = [line('empanadas', 'u6', [{ menuItemId: 'carne', units: 2 }, { menuItemId: 'pollo', units: 4 }]), times(line('coca_cola', 'u1', [{ menuItemId: 'coca', units: 1 }]), 2)];
    expect([...stockUsage(order, baseOf)]).toEqual([['carne', 2], ['pollo', 4], ['coca', 2]]);
  });

  it('fuzz: nunca da negativo y suma una base por cada unidad de Pizzas y Ciabattas', () => {
    const anyLine = fc.record({ group: fc.constantFrom(...MENU_GROUPS), quantity: fc.integer({ min: 1, max: 20 }), half: fc.boolean() }).map(({ group, quantity, half }) => {
      const presentation = GROUPS[group].presentations[half ? GROUPS[group].presentations.length - 1 : 0];
      const units = presentation.flavors === 2 ? [0.5, 0.5] : [presentation.units];
      return times(line(group, presentation.key, units.map((amount, index) => ({ menuItemId: `${group}-${index}`, units: amount }))), quantity);
    });
    fc.assert(
      fc.property(fc.array(anyLine, { maxLength: 8 }), (order) => {
        const usage = stockUsage(order, baseOf);
        expect([...usage.values()].every((units) => units >= 0)).toBe(true);
        for (const group of MENU_GROUPS.filter(hasBase)) {
          const expected = order.filter((each) => each.group === group).reduce((sum, each) => sum + each.quantity, 0);
          expect(usage.get(BASES[group] ?? '') ?? 0).toBe(expected);
        }
      })
    );
  });
});

describe('availableStock con base (US-29 CA-5, D-3)', () => {
  const prepizza = { id: 'prepizza', stock: 3 };
  const bases = (group: MenuGroup): typeof prepizza | null => (group === 'pizzas' ? prepizza : null);

  it('un gusto de pizza tiene disponible lo que queda de la prepizza, menos lo que ya está en el pedido', () => {
    expect(availableStock({ id: 'napo', group: 'pizzas', stock: 0 }, [halfAndHalf], bases)).toBe(2);
    expect(availableStock({ id: 'carne', group: 'empanadas', stock: 10 }, [halfAndHalf], bases)).toBe(10);
  });

  it('la segunda mitad de una pizza entra aunque quede media prepizza', () => {
    const firstHalf = line('pizzas', 'pizza_2', [{ menuItemId: 'muzza', units: 0.5 }]);
    expect(availableStock({ id: 'napo', group: 'pizzas', stock: 0 }, [firstHalf], () => ({ id: 'prepizza', stock: 1 }))).toBe(0.5);
  });
});

describe('canAddOne: el "+" del carrito respeta el stock (US-36)', () => {
  const items = new Map<string, { id: string; group: MenuGroup; stock: number }>([
    ['carne', { id: 'carne', group: 'empanadas', stock: 3 }],
    ['napo', { id: 'napo', group: 'pizzas', stock: 0 }],
    ['muzza', { id: 'muzza', group: 'pizzas', stock: 0 }],
  ]);
  const book = { itemOf: (id: string) => items.get(id), baseOf: (group: MenuGroup) => (group === 'pizzas' ? { id: 'prepizza', stock: 2 } : null) };

  it('suma si queda stock para una unidad más y no suma si no alcanza', () => {
    const carne = line('empanadas', 'u1', [{ menuItemId: 'carne', units: 1 }]);
    expect(canAddOne(times(carne, 2), [times(carne, 2)], book)).toBe(true);
    expect(canAddOne(times(carne, 3), [times(carne, 3)], book)).toBe(false);
  });

  it('una mitad y mitad pide una prepizza entera, y un gusto que ya no está no suma', () => {
    expect(canAddOne(halfAndHalf, [halfAndHalf], book)).toBe(true);
    expect(canAddOne(halfAndHalf, [times(halfAndHalf, 2)], book)).toBe(false);
    expect(canAddOne(line('empanadas', 'u1', [{ menuItemId: 'humita', units: 1 }]), [], book)).toBe(false);
  });

  it('fuzz: si suma, después de sumar ningún gusto queda con stock negativo', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 6 }), fc.integer({ min: 0, max: 8 }), (quantity, stock) => {
        const carne = times(line('empanadas', 'u1', [{ menuItemId: 'carne', units: 1 }]), quantity);
        const stockBook = { itemOf: () => ({ id: 'carne', group: 'empanadas' as const, stock }), baseOf: () => null };
        if (!canAddOne(carne, [carne], stockBook)) return true;
        return availableStock(stockBook.itemOf(), [times(carne, quantity + 1)]) >= 0;
      })
    );
  });
});
