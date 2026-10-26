import { describe, expect, it } from 'vitest';
import { describeComponents } from './promotion-describe';

describe('descripción de una promo (US-8 CA-2)', () => {
  it('lista cada componente con su grupo, su presentación y la cantidad cuando es más de 1', () => {
    const components = [
      { group: 'empanadas' as const, presentationKey: 'u12', quantity: 1 },
      { group: 'coca_cola' as const, presentationKey: 'u1', quantity: 2 },
    ];
    expect(describeComponents(components)).toBe('Empanadas · 1 docena + Coca-Cola · 1 unidad × 2');
  });

  it('una pizza de 2 sabores se nombra por su presentación', () => {
    expect(describeComponents([{ group: 'pizzas', presentationKey: 'pizza_2', quantity: 1 }])).toBe('Pizzas · 2 sabores');
  });
});
