import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { StockBadge } from './stock-columns';
import { StockEntryFields } from './stock-entry-fields';
import { type EntryValues, parseEntry } from './stock-forms';

const ITEM = '11111111-1111-4111-8111-111111111111';
const CARNE: MenuItemDef = { id: ITEM, group: 'empanadas', name: 'Carne', unitCost: 100, stock: 4, price1: 1000, price3: 3000, price6: 5000, price12: 9000, isActive: true, isVisible: false, isBase: false, minStock: 5, version: 1, createdAt: '', updatedAt: '' };
const PREPIZZA: MenuItemDef = { ...CARNE, id: 'p', group: 'pizzas', name: 'Prepizza', unitCost: null, price1: null, price3: null, price6: null, price12: null, isBase: true, minStock: 2 };
const MUZZA: MenuItemDef = { ...CARNE, id: 'm', group: 'pizzas', name: 'Muzza', price3: null, price6: null, price12: null, minStock: null };
const BLANK: EntryValues = { category: '', menuItemId: '', quantity: '', unitCost: '', providerId: '', minStock: '', price1: '', price3: '', price6: '', price12: '' };

function renderFields(values: EntryValues): ReturnType<typeof vi.fn> {
  const onChange = vi.fn();
  render(<StockEntryFields values={values} errors={{}} items={[CARNE, PREPIZZA, MUZZA]} providers={[]} onChange={onChange} />);
  return onChange;
}

describe('stock mínimo (US-45)', () => {
  it('elegir un gusto precarga su mínimo actual (CA-2, P-5)', () => {
    const onChange = renderFields({ ...BLANK, category: 'empanadas' });
    fireEvent.change(screen.getByLabelText('Gusto o bebida'), { target: { value: ITEM } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ menuItemId: ITEM, minStock: '5' }));
  });

  it('elegir Prepizza precarga el mínimo de la base', () => {
    const onChange = renderFields(BLANK);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'prepizzas' } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ menuItemId: 'p', minStock: '2' }));
  });

  it('el campo aparece en lo que se stockea por cantidad y no en Pizzas', () => {
    renderFields({ ...BLANK, category: 'empanadas', menuItemId: ITEM, minStock: '5' });
    expect(screen.getByLabelText('Stock mínimo (opcional)')).toHaveProperty('value', '5');
    screen.getByLabelText('Stock mínimo (opcional)').remove();
    renderFields({ ...BLANK, category: 'pizzas' });
    expect(screen.queryByLabelText('Stock mínimo (opcional)')).toBeNull();
  });

  it('vacío manda "sin mínimo" y un 0 marca el error en el campo', () => {
    const values = { ...BLANK, menuItemId: ITEM, quantity: '2' };
    expect(parseEntry(values)).toMatchObject({ ok: true, input: { minStock: null } });
    expect(parseEntry({ ...values, minStock: '8' })).toMatchObject({ ok: true, input: { minStock: 8 } });
    expect(parseEntry({ ...values, minStock: '0' })).toEqual({ ok: false, errors: { minStock: 'El stock mínimo debe ser mayor a 0' } });
  });

  it('el stock se ve amarillo bajo el mínimo, verde en el mínimo y rojo sin stock (CA-3, P-4)', () => {
    const { container } = render(<div><StockBadge item={CARNE} /><StockBadge item={{ ...CARNE, stock: 5 }} /><StockBadge item={{ ...CARNE, stock: 0 }} /></div>);
    const [low, ok, empty] = [...container.querySelectorAll('span')].map((badge) => badge.className);
    expect([low.includes('amber'), ok.includes('emerald'), empty.includes('red')]).toEqual([true, true, true]);
    expect(screen.getAllByTitle('Mínimo: 5')).toHaveLength(3);
  });
});
