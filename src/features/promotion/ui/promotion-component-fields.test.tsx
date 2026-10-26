import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { blankComponent } from './promotion-form';
import { PromotionComponentFields } from './promotion-component-fields';

describe('productos de una promo en el formulario (US-8 CA-1)', () => {
  it('al cambiar el grupo vuelve a la primera presentación de ese grupo', () => {
    const onChange = vi.fn();
    render(<PromotionComponentFields components={[blankComponent()]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Grupo del producto 1'), { target: { value: 'pizzas' } });
    expect(onChange).toHaveBeenCalledWith([{ group: 'pizzas', presentationKey: 'pizza_1', quantity: '1' }]);
  });

  it('cada grupo ofrece sólo sus presentaciones', () => {
    render(<PromotionComponentFields components={[blankComponent('pizzas')]} onChange={vi.fn()} />);
    const options = Array.from(screen.getByLabelText('Presentación del producto 1').querySelectorAll('option')).map((option) => option.textContent);
    expect(options).toEqual(['1 sabor', '2 sabores']);
  });

  it('cambia la presentación y la cantidad de un producto', () => {
    const onChange = vi.fn();
    render(<PromotionComponentFields components={[blankComponent()]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Presentación del producto 1'), { target: { value: 'u12' } });
    fireEvent.change(screen.getByLabelText('Cantidad del producto 1'), { target: { value: '2' } });
    expect(onChange.mock.calls).toEqual([[[{ group: 'empanadas', presentationKey: 'u12', quantity: '1' }]], [[{ group: 'empanadas', presentationKey: 'u1', quantity: '2' }]]]);
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
