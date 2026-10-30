import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useOrderStore } from '@/features/order/store/order.store';
import { ITEMS, menuItem } from '../testing/board-fixtures';
import { FlavorPicker } from './flavor-picker';
import { boardModelOf } from './use-order-board';

const LARGO = menuItem({ id: 'cuchillo', group: 'empanadas', name: 'Carne cortada a cuchillo', price6: 6500 });

describe('fila de un gusto en el selector (BUG-27)', () => {
  beforeEach(() => useOrderStore.getState().clear());

  it('el largo del nombre no cambia la fila: desde sm, nombre y botones en un renglón; en el celular los botones no se salen', () => {
    act(() => useOrderStore.getState().start('empanadas', 'u6'));
    render(<FlavorPicker board={boardModelOf([...ITEMS, LARGO])} />);
    for (const name of ['Carne', 'Carne cortada a cuchillo']) {
      const nameBlock = screen.getByText(name).parentElement;
      const row = nameBlock?.closest('li');
      expect(row?.className).not.toContain('flex-wrap');
      expect(row?.className).toContain('sm:flex-row');
      expect(nameBlock?.className).toContain('sm:flex-1');
      expect(nameBlock?.nextElementSibling?.className).toContain('max-w-full flex-wrap gap-2 sm:shrink-0 sm:flex-nowrap');
    }
  });
});
