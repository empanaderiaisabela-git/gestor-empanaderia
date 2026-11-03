import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { blankComponent } from './promotion-form';
import { PromotionComponentFields } from './promotion-component-fields';

const drink = (id: string, drinkName: string, isActive = true) => ({ id, group: 'coca_cola' as const, name: `${drinkName} 1 L ${id}`, isActive, drinkName, drinkSize: '1 L', liters: null });
const DRINKS = [drink('pera', 'Aquarius'), drink('manzana', 'Aquarius'), drink('fanta', 'Fanta', false)];
const optionsOf = (label: string): (string | null)[] => Array.from(screen.getByLabelText(label).querySelectorAll('option')).map((option) => option.textContent);

describe('productos de una promo en el formulario (US-8 CA-1)', () => {
  it('al cambiar el grupo vuelve a la primera presentación de ese grupo', () => {
    const onChange = vi.fn();
    render(<PromotionComponentFields components={[blankComponent()]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Grupo del producto 1'), { target: { value: 'pizzas' } });
    expect(onChange).toHaveBeenCalledWith([{ group: 'pizzas', presentationKey: 'pizza_1', quantity: '1', menuItemId: '' }]);
  });

  it('cada grupo ofrece sólo sus presentaciones', () => {
    render(<PromotionComponentFields components={[blankComponent('pizzas')]} onChange={vi.fn()} />);
    expect(optionsOf('Presentación del producto 1')).toEqual(['1 sabor', '2 sabores']);
  });

  it('en Coca-Cola y Quilmes se elige bebida y litros en lugar de la presentación (US-55, US-57)', () => {
    const onChange = vi.fn();
    render(<PromotionComponentFields components={[blankComponent('coca_cola')]} drinks={DRINKS} onChange={onChange} />);
    expect(screen.queryByLabelText('Presentación del producto 1')).toBeNull();
    expect(optionsOf('Bebida del producto 1')).toEqual(['Cualquiera', 'Aquarius 1 L']);
    fireEvent.change(screen.getByLabelText('Bebida del producto 1'), { target: { value: 'pera' } });
    expect(onChange).toHaveBeenCalledWith([{ ...blankComponent('coca_cola'), menuItemId: 'pera' }]);
  });

  it('una bebida fija que después se desactivó sigue en la lista (US-55)', () => {
    render(<PromotionComponentFields components={[{ ...blankComponent('coca_cola'), menuItemId: 'fanta' }]} drinks={DRINKS} onChange={vi.fn()} />);
    expect(optionsOf('Bebida del producto 1')).toEqual(['Cualquiera', 'Aquarius 1 L', 'Fanta 1 L']);
  });

  it('cambia la presentación y la cantidad de un producto', () => {
    const onChange = vi.fn();
    render(<PromotionComponentFields components={[blankComponent()]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Presentación del producto 1'), { target: { value: 'u12' } });
    fireEvent.change(screen.getByLabelText('Cantidad del producto 1'), { target: { value: '2' } });
    expect(onChange.mock.calls).toEqual([[[{ ...blankComponent(), presentationKey: 'u12' }]], [[{ ...blankComponent(), quantity: '2' }]]]);
  });

  it('agrega y quita productos, y muestra el error de la lista', () => {
    const onChange = vi.fn();
    const two = [blankComponent(), blankComponent('pepsi')];
    render(<PromotionComponentFields components={two} error='Agregá al menos un producto' onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Agregar producto/ }));
    fireEvent.click(screen.getAllByTitle('Quitar producto')[0]);
    expect(onChange.mock.calls).toEqual([[[...two, blankComponent()]], [[two[1]]]]);
    expect(screen.getByText('Agregá al menos un producto')).toBeDefined();
  });

  it('con 10 productos ya no deja agregar más', () => {
    render(<PromotionComponentFields components={Array.from({ length: 10 }, () => blankComponent())} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Agregar producto/ }).hasAttribute('disabled')).toBe(true);
  });
});
