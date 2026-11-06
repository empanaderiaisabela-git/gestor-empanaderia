import { describe, expect, it } from 'vitest';
import type { OrderLine } from './order-line';
import { groupLines, lastToRemove, unitPresentationOf } from './order-groups';

const line = (id: string, presentationKey: string, flavors: OrderLine['flavors']): OrderLine => ({ id, group: 'empanadas', presentationKey, flavors, quantity: 1 });
const jyq = (units: number) => [{ menuItemId: 'jyq', units }];
const keys = (lines: OrderLine[]): string[][] => groupLines(lines).map((row) => row.lines.map((grouped) => grouped.id));

describe('gustos iguales en un solo ítem del carrito (US-64 CA-1)', () => {
  it('junta la ½ docena y la unidad del mismo gusto, en el lugar de la primera', () => {
    expect(keys([line('a', 'u6', jyq(6)), line('b', 'u6', [{ menuItemId: 'carne', units: 6 }]), line('c', 'u1', jyq(1))])).toEqual([['a', 'c'], ['b']]);
  });

  it('no junta surtidas, renglones incompletos, otro grupo ni distinto jamón extra', () => {
    const surtida = line('s', 'u6', [{ menuItemId: 'jyq', units: 3 }, { menuItemId: 'carne', units: 3 }]);
    const abierta = line('o', 'u6', jyq(2));
    const ciabatta: OrderLine = { ...line('x', 'u1', jyq(1)), group: 'ciabattas' };
    expect(keys([line('a', 'u1', jyq(1)), surtida, abierta, ciabatta])).toEqual([['a'], ['s'], ['o'], ['x']]);
    const muzza: OrderLine = { ...line('p', 'pizza_1', [{ menuItemId: 'muzza', units: 1 }]), group: 'pizzas' };
    expect(keys([muzza, { ...muzza, id: 'q', ham: true }])).toEqual([['p'], ['q']]);
  });

  it('la presentación de 1 unidad de cada grupo', () => {
    expect([unitPresentationOf('empanadas')?.key, unitPresentationOf('pizzas')?.key, unitPresentationOf('coca_cola')?.key]).toEqual(['u1', 'pizza_1', 'u1']);
  });
});

describe('"−" del ítem agrupado (US-64 CA-2, D-6)', () => {
  it('saca primero las unidades sueltas y después la presentación más grande', () => {
    expect(lastToRemove([line('a', 'u6', jyq(6)), line('c', 'u1', jyq(1))]).id).toBe('c');
    expect(lastToRemove([line('a', 'u12', jyq(12)), line('b', 'u3', jyq(3)), line('c', 'u6', jyq(6))]).id).toBe('b');
  });
});
