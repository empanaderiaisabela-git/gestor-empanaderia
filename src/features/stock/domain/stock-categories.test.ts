import { describe, expect, it } from 'vitest';
import { CATEGORY_LABELS, categoryOf, hasOwnStock, isBaseCategory, isStockCategory, STOCKED_CATEGORIES } from './stock-categories';

describe('categorías de Stock (BUG-23)', () => {
  it('la prepizza y el pan de ciabatta son categorías propias', () => {
    expect(categoryOf({ group: 'pizzas', isBase: true })).toBe('prepizzas');
    expect(categoryOf({ group: 'ciabattas', isBase: true })).toBe('panes_ciabatta');
    expect([CATEGORY_LABELS.prepizzas, CATEGORY_LABELS.panes_ciabatta]).toEqual(['Prepizza', 'Pan de ciabatta']);
  });

  it('un gusto queda en la categoría de su grupo', () => {
    expect(categoryOf({ group: 'pizzas', isBase: false })).toBe('pizzas');
    expect(categoryOf({ group: 'empanadas', isBase: false })).toBe('empanadas');
  });

  it('se ingresa stock en todas las categorías menos Pizzas y Ciabattas', () => {
    expect(STOCKED_CATEGORIES).toEqual(['empanadas', 'prepizzas', 'sanguches', 'panes_ciabatta', 'coca_cola', 'pepsi']);
  });

  it('los gustos de pizza y ciabatta no tienen stock propio', () => {
    expect(hasOwnStock({ group: 'pizzas', isBase: false })).toBe(false);
    expect(hasOwnStock({ group: 'ciabattas', isBase: true })).toBe(true);
    expect(hasOwnStock({ group: 'sanguches', isBase: false })).toBe(true);
  });

  it('reconoce las categorías y las bases', () => {
    expect([isStockCategory('prepizzas'), isStockCategory('todos'), isStockCategory('')]).toEqual([true, false, false]);
    expect([isBaseCategory('panes_ciabatta'), isBaseCategory('pizzas'), isBaseCategory('')]).toEqual([true, false, false]);
  });
});
