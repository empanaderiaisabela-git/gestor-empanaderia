import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { StockEntryFields } from './stock-entry-fields';
import type { EntryValues } from './stock-forms';

const item = (id: string, group: MenuItemDef['group'], name: string): MenuItemDef => ({ id, group, name, unitCost: 100, stock: 3, price1: 1000, price3: null, price6: null, price12: null, isActive: true, isVisible: false, isBase: false, version: 1, createdAt: '', updatedAt: '' });
const PREPIZZA: MenuItemDef = { ...item('e', 'pizzas', 'Prepizza'), unitCost: null, price1: null, isBase: true };
const ITEMS = [item('a', 'sanguches', 'Primavera'), item('b', 'sanguches', 'Jamón y queso'), item('c', 'pepsi', 'Pepsi 1,5 L'), item('d', 'pizzas', 'Muzza'), PREPIZZA];
const BLANK: EntryValues = { category: '', menuItemId: '', quantity: '', unitCost: '', providerId: '', price1: '', price3: '', price6: '', price12: '' };

function renderFields(values: EntryValues, onChange = vi.fn()): typeof onChange {
  render(<StockEntryFields values={values} errors={{}} items={ITEMS} providers={[]} onChange={onChange} />);
  return onChange;
}

describe('Ingresar stock: primero la categoría, después el gusto (US-18)', () => {
  it('sin categoría, el gusto está deshabilitado', () => {
    renderFields(BLANK);
    expect(screen.getByLabelText('Gusto o bebida')).toHaveProperty('disabled', true);
  });

  it('con una categoría, el gusto lista sólo los de esa categoría', () => {
    renderFields({ ...BLANK, category: 'sanguches' });
    const options = within(screen.getByLabelText('Gusto o bebida')).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Elegí un gusto o bebida', 'Primavera (stock 3)', 'Jamón y queso (stock 3)']);
  });

  it('Prepizza es una categoría: no pide gusto, sólo cantidad y proveedor, sin costo ni precio (BUG-23)', () => {
    renderFields({ ...BLANK, category: 'prepizzas', menuItemId: PREPIZZA.id });
    expect(screen.queryByLabelText('Gusto o bebida')).toBeNull();
    expect(screen.queryByLabelText(/Costo para el local|Precio de venta/)).toBeNull();
    expect([screen.getByLabelText('Cantidad que entra'), screen.getByLabelText('Proveedor (opcional)')]).toHaveLength(2);
  });

  it('la categoría ofrece Prepizza y Pan de ciabatta, y no Pizzas ni Ciabattas (BUG-23)', () => {
    renderFields(BLANK);
    const options = within(screen.getByLabelText('Categoría')).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Elegí una categoría', 'Empanadas', 'Prepizza', 'Sanguches', 'Pan de ciabatta', 'Coca-Cola', 'Pepsi']);
  });

  it('elegir Prepizza toma la base; elegir otra categoría limpia el gusto', () => {
    const onChange = renderFields({ ...BLANK, category: 'sanguches', menuItemId: 'a' });
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'prepizzas' } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'prepizzas', menuItemId: PREPIZZA.id }));
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'pepsi' } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'pepsi', menuItemId: '' }));
  });
});
