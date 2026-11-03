import { describe, expect, it } from 'vitest';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import { drinkFamilies } from './drink-families';

type Fields = { id: string; name: string; drinkName: string | null; drinkSize?: string | null; isActive?: boolean; group?: MenuGroup };
const COCA: MenuGroup = 'coca_cola';
const drink = (fields: Fields) => ({ drinkSize: fields.drinkName === null ? null : '1 L', liters: null, isActive: true, group: COCA, ...fields });
const DRINKS = [
  drink({ id: 'pera', name: 'Aquarius 1 L Pera', drinkName: 'Aquarius' }),
  drink({ id: 'manzana', name: 'Aquarius 1 L Manzana', drinkName: 'Aquarius' }),
  drink({ id: 'grande', name: 'Aquarius 1.5 L Pera', drinkName: 'Aquarius', drinkSize: '1.5 L', isActive: false }),
  drink({ id: 'sprite', name: 'Sprite 1,5 L', drinkName: null }),
  drink({ id: 'quilmes', name: 'Quilmes 1L', drinkName: 'Quilmes', group: 'pepsi' }),
];

describe('opciones de "Bebida" en una promo (US-57)', () => {
  it('una opción por bebida y litros, sin repetir por sabor; una bebida vieja, por producto', () => {
    expect(drinkFamilies(DRINKS, 'coca_cola', '')).toEqual({
      value: '',
      options: [
        { id: 'pera', label: 'Aquarius 1 L' },
        { id: 'sprite', label: 'Sprite 1,5 L' },
      ],
    });
  });

  it('muestra la elegida aunque esté inactiva, y otro sabor de su familia toma el valor de la opción', () => {
    expect(drinkFamilies(DRINKS, 'coca_cola', 'grande').options).toContainEqual({ id: 'grande', label: 'Aquarius 1.5 L' });
    expect(drinkFamilies(DRINKS, 'coca_cola', 'manzana').value).toBe('pera');
    expect(drinkFamilies(DRINKS, 'pepsi', '').options).toEqual([{ id: 'quilmes', label: 'Quilmes 1 L' }]);
  });
});
