import { describe, expect, it } from 'vitest';
import { describeComponents } from './promotion-describe';

describe('descripción de una promo (US-8 CA-2)', () => {
  it('lista cada componente con su grupo, su presentación y la cantidad cuando es más de 1', () => {
    const components = [
      { group: 'empanadas' as const, presentationKey: 'u12', quantity: 1, menuItemName: null },
      { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 2, menuItemName: null },
    ];
    expect(describeComponents(components)).toBe('Empanadas · 1 docena + Coca-Cola · 1 unidad × 2');
  });

  it('una pizza de 2 sabores se nombra por su presentación', () => {
    expect(describeComponents([{ group: 'pizzas', presentationKey: 'pizza_2', quantity: 1, menuItemName: null }])).toBe('Pizzas · 2 sabores');
  });

  it('una bebida fija se nombra por la bebida (US-55)', () => {
    const coca = { group: 'coca_cola' as const, presentationKey: 'u1', menuItemName: 'Coca-Cola 1.5L' };
    expect(describeComponents([{ ...coca, quantity: 2 }, { ...coca, quantity: 1, menuItemName: 'Sprite' }])).toBe('Coca-Cola 1.5L × 2 + Sprite');
  });
});
