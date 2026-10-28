import { describe, expect, it } from 'vitest';
import { MENU_GROUPS } from './menu-groups';
import { costLabelOf } from './menu-terms';

describe('costo para el local', () => {
  it('va por pizza entera en las pizzas y por unidad en el resto', () => {
    expect(costLabelOf('pizzas')).toBe('Costo para el local, por pizza entera');
    expect(MENU_GROUPS.filter((group) => group !== 'pizzas').map(costLabelOf)).toEqual(Array(5).fill('Costo para el local, por unidad'));
  });

  it('sin gusto elegido, va por unidad', () => {
    expect(costLabelOf(null)).toBe('Costo para el local, por unidad');
  });
});
