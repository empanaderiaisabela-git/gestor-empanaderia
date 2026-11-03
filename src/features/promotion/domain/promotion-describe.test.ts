import { describe, expect, it } from 'vitest';
import { describeComponents } from './promotion-describe';

describe('descripción de una promo (US-8 CA-2)', () => {
  it('lista cada componente con su grupo, su presentación y la cantidad cuando es más de 1', () => {
    const components = [
      { group: 'empanadas' as const, presentationKey: 'u12', quantity: 1, menuItemName: null, drinkName: null, drinkSize: null },
      { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 2, menuItemName: null, drinkName: null, drinkSize: null },
    ];
    expect(describeComponents(components)).toBe('Empanadas · 1 docena + Coca-Cola · 1 unidad × 2');
  });

  it('una pizza de 2 sabores se nombra por su presentación', () => {
    expect(describeComponents([{ group: 'pizzas', presentationKey: 'pizza_2', quantity: 1, menuItemName: null, drinkName: null, drinkSize: null }])).toBe('Pizzas · 2 sabores');
  });

  it('una bebida fija se nombra por bebida y litros, sin el sabor (US-55, US-57)', () => {
    const aquarius = { group: 'coca_cola' as const, presentationKey: 'u1', menuItemName: 'Aquarius 1 L Pera', drinkName: 'Aquarius', drinkSize: '1 L' };
    const legacy = { ...aquarius, quantity: 1, menuItemName: 'Sprite 1,5 L', drinkName: null, drinkSize: null };
    expect(describeComponents([{ ...aquarius, quantity: 2 }, legacy])).toBe('Aquarius 1 L × 2 + Sprite 1,5 L');
  });
});
