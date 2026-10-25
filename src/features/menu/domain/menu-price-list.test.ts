import { describe, expect, it } from 'vitest';
import { priceList } from './menu-price-list';

describe('priceList', () => {
  it('nombra cada precio de las empanadas con su presentación, en orden', () => {
    expect(priceList('empanadas', { price1: 1200, price3: 3400, price6: 6500, price12: 12000 }).map(({ label, value }) => `${label}: ${value}`)).toEqual([
      '1 unidad: 1200',
      '3 unidades: 3400',
      '½ docena: 6500',
      '1 docena: 12000',
    ]);
  });

  it('la pizza muestra el precio de la entera y omite los vacíos', () => {
    expect(priceList('pizzas', { price1: 11000, price3: null })).toEqual([{ field: 'price1', label: 'pizza entera', value: 11000 }]);
  });

  it('sin precios cargados devuelve una lista vacía', () => {
    expect(priceList('ciabattas', {})).toEqual([]);
  });
});
