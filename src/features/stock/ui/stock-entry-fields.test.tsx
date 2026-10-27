import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { StockEntryFields } from './stock-entry-fields';
import type { EntryValues } from './stock-forms';

const item = (id: string, group: MenuItemDef['group'], name: string): MenuItemDef => ({ id, group, name, unitCost: 100, stock: 3, price1: 1000, price3: null, price6: null, price12: null, isActive: true, isVisible: false, version: 1, createdAt: '', updatedAt: '' });
const ITEMS = [item('a', 'pizzas', 'Muzza'), item('b', 'pizzas', 'Napolitana'), item('c', 'pepsi', 'Pepsi 1,5 L')];
const BLANK: EntryValues = { group: '', menuItemId: '', quantity: '', unitCost: '', providerId: '', price1: '', price3: '', price6: '', price12: '' };

function renderFields(values: EntryValues, onChange = vi.fn()): typeof onChange {
  render(<StockEntryFields values={values} errors={{}} items={ITEMS} providers={[]} groupPrices={[]} onChange={onChange} />);
  return onChange;
}

describe('Ingresar stock: primero la categoría, después el gusto (US-18)', () => {
  it('sin categoría, el gusto está deshabilitado', () => {
    renderFields(BLANK);
    expect(screen.getByLabelText('Gusto o bebida')).toHaveProperty('disabled', true);
  });

  it('con una categoría, el gusto lista sólo los de esa categoría', () => {
    renderFields({ ...BLANK, group: 'pizzas' });
    const options = within(screen.getByLabelText('Gusto o bebida')).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Elegí un gusto o bebida', 'Muzza (stock 3)', 'Napolitana (stock 3)']);
  });

  it('cambiar de categoría limpia el gusto elegido', () => {
    const onChange = renderFields({ ...BLANK, group: 'pizzas', menuItemId: 'a' });
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'pepsi' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ group: 'pepsi', menuItemId: '' }));
  });
});
