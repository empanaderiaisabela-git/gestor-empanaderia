import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isStockOrder, orderStock, STOCK_ORDERS } from './stock-order';

type Kind = 'empanada' | 'gusto de pizza' | 'base';
const row = (name: string, stock: number, kind: Kind = 'empanada') => ({ name, stock, group: kind === 'empanada' ? ('empanadas' as const) : ('pizzas' as const), isBase: kind === 'base' });
const ITEMS = [row('Carne', 5), row('Muzza', 0, 'gusto de pizza'), row('Prepizza', 0, 'base'), row('Humita', 12), row('Pollo', 0)];
const names = (items: { name: string }[]): string[] => items.map((item) => item.name);

describe('ordenar la grilla de Stock (US-34)', () => {
  it('por categoría deja el orden de siempre', () => {
    expect(names(orderStock(ITEMS, 'categoria'))).toEqual(names(ITEMS));
  });

  it('creciente y decreciente ordenan por cantidad y dejan al final los gustos sin stock propio (D-16)', () => {
    expect(names(orderStock(ITEMS, 'creciente'))).toEqual(['Prepizza', 'Pollo', 'Carne', 'Humita', 'Muzza']);
    expect(names(orderStock(ITEMS, 'decreciente'))).toEqual(['Humita', 'Carne', 'Prepizza', 'Pollo', 'Muzza']);
  });

  it('"Solo sin stock" muestra lo que falta, sin los gustos de pizza; "Quitar sin stock" deja el resto', () => {
    expect(names(orderStock(ITEMS, 'sin_stock'))).toEqual(['Prepizza', 'Pollo']);
    expect(names(orderStock(ITEMS, 'con_stock'))).toEqual(['Carne', 'Muzza', 'Humita']);
  });

  it('reconoce sólo las opciones del desplegable', () => {
    expect(STOCK_ORDERS.every(isStockOrder)).toBe(true);
    expect([isStockOrder('todos'), isStockOrder('')]).toEqual([false, false]);
  });

  it('fuzz: ordenar no pierde ni inventa filas, y "sin stock" más "con stock" son todas', () => {
    const item = fc.record({ name: fc.string(), stock: fc.integer({ min: -5, max: 50 }), group: fc.constantFrom('empanadas' as const, 'pizzas' as const), isBase: fc.boolean() });
    fc.assert(
      fc.property(fc.array(item), (items) => {
        const sorted = orderStock(items, 'creciente');
        return sorted.length === items.length && orderStock(items, 'sin_stock').length + orderStock(items, 'con_stock').length === items.length;
      })
    );
  });
});
