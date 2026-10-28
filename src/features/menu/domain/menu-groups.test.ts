import { describe, expect, it } from 'vitest';
import { allowsHalfStock, GROUPS, MENU_GROUPS, priceFieldsOf, priceLabelOf } from './menu-groups';

describe('grupos y presentaciones fijos (US-3)', () => {
  it('son los seis grupos del local, en el orden del tablero', () => {
    expect(MENU_GROUPS.map((group) => GROUPS[group].label)).toEqual(['Empanadas', 'Pizzas', 'Sanguches', 'Ciabattas', 'Coca-Cola', 'Pepsi']);
  });

  it.each([
    { group: 'empanadas' as const, units: [1, 3, 6, 12], labels: ['1 unidad', '3 unidades', '½ docena', '1 docena'] },
    { group: 'sanguches' as const, units: [1, 3, 6, 12], labels: ['1 unidad', '3 unidades', '6 unidades', '12 unidades'] },
    { group: 'ciabattas' as const, units: [1], labels: ['1 unidad'] },
    { group: 'coca_cola' as const, units: [1], labels: ['1 unidad'] },
    { group: 'pepsi' as const, units: [1], labels: ['1 unidad'] },
  ])('$group se vende en $units unidades', ({ group, units, labels }) => {
    expect(GROUPS[group].presentations.map((presentation) => presentation.units)).toEqual(units);
    expect(GROUPS[group].presentations.map((presentation) => presentation.label)).toEqual(labels);
  });

  it('la pizza es siempre entera, de 1 o 2 sabores, con el precio de la pizza entera', () => {
    expect(GROUPS.pizzas.presentations.map(({ label, units, flavors, priceField }) => ({ label, units, flavors, priceField }))).toEqual([
      { label: '1 sabor', units: 1, flavors: 1, priceField: 'price1' },
      { label: '2 sabores', units: 1, flavors: 2, priceField: 'price1' },
    ]);
  });

  it('cada gusto, de cualquier grupo, pide los precios de sus presentaciones (US-28)', () => {
    expect(priceFieldsOf('empanadas')).toEqual(['price1', 'price3', 'price6', 'price12']);
    expect(priceFieldsOf('sanguches')).toEqual(['price1', 'price3', 'price6', 'price12']);
    expect(priceFieldsOf('pizzas')).toEqual(['price1']);
    expect(priceFieldsOf('ciabattas')).toEqual(['price1']);
    expect(priceFieldsOf('pepsi')).toEqual(['price1']);
  });

  it('nombra cada precio como su presentación', () => {
    expect(priceLabelOf('empanadas', 'price12')).toBe('1 docena');
    expect(priceLabelOf('sanguches', 'price6')).toBe('6 unidades');
    expect(priceLabelOf('pizzas', 'price1')).toBe('pizza entera');
    expect(priceLabelOf('ciabattas', 'price3')).toBe('price3');
  });

  it('sólo las pizzas admiten medias en el stock', () => {
    expect(MENU_GROUPS.filter(allowsHalfStock)).toEqual(['pizzas']);
  });

  it('las bebidas son de Coca-Cola y de Pepsi; el resto es comida', () => {
    expect(MENU_GROUPS.filter((group) => GROUPS[group].kind === 'bebida')).toEqual(['coca_cola', 'pepsi']);
  });
});
