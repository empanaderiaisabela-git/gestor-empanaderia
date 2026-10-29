import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { menuItem } from '../testing/board-fixtures';
import { flavorPrice, visibleFlavors } from './flavor-list';
import type { OrderLine } from './order-line';

const PIZZA: OrderLine = { id: 'l1', group: 'pizzas', presentationKey: 'pizza_1', flavors: [], quantity: 1 };
const DOCENA: OrderLine = { ...PIZZA, group: 'empanadas', presentationKey: 'u12' };
const pizza = (name: string, price1: number | null) => menuItem({ id: name, group: 'pizzas', name, price1 });
const PIZZAS = [pizza('huevo y papa', 18000), pizza('nuevo gusto', 10000), pizza('Pollo', 16000), pizza('RUCULA Y JAMÓN CRUDO', 15000), pizza('Sin precio', null), pizza('Anchoas', 15000)];
const names = (items: { name: string }[]): string[] => items.map((item) => item.name);

describe('lista de gustos de Ventas (US-35)', () => {
  it('va del más barato al más caro; a igual precio, por nombre, y sin precio al final', () => {
    expect(names(visibleFlavors(PIZZAS, PIZZA, ''))).toEqual(['nuevo gusto', 'Anchoas', 'RUCULA Y JAMÓN CRUDO', 'Pollo', 'huevo y papa', 'Sin precio']);
  });

  it('usa el precio de la presentación: en la docena, el de la docena', () => {
    const carne = menuItem({ id: 'c', group: 'empanadas', name: 'Carne', price1: 1300, price12: 12000 });
    const humita = menuItem({ id: 'h', group: 'empanadas', name: 'Humita', price1: 1200, price12: 13000 });
    expect(flavorPrice(DOCENA, carne)).toBe(12000);
    expect(names(visibleFlavors([humita, carne], DOCENA, ''))).toEqual(['Carne', 'Humita']);
  });

  it.each(['rucula', 'RÚCULA', 'jamon crudo', '  Jamón '])('busca "%s" sin importar mayúsculas ni acentos', (search) => {
    expect(names(visibleFlavors(PIZZAS, PIZZA, search))).toEqual(['RUCULA Y JAMÓN CRUDO']);
  });

  it('sin coincidencias, la lista queda vacía', () => {
    expect(visibleFlavors(PIZZAS, PIZZA, 'fugazzeta')).toEqual([]);
  });

  it('fuzz: devuelve sólo gustos de la lista, ordenados por precio', () => {
    const item = fc.record({ name: fc.string(), price1: fc.option(fc.integer({ min: 1, max: 99999 }), { nil: null }) }).map(({ name, price1 }) => pizza(name, price1));
    fc.assert(
      fc.property(fc.array(item), fc.string(), (items, search) => {
        const prices = visibleFlavors(items, PIZZA, search).map((flavor) => flavor.price1 ?? Infinity);
        return prices.every((price, index) => index === 0 || (prices[index - 1] ?? 0) <= price) && prices.length <= items.length;
      })
    );
  });
});
