import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MORNING_SALE, saleDef } from '../testing/sale-fixtures';
import { SaleReceipt } from './sale-receipt';

describe('comprobante de una venta (US-7 CA-2)', () => {
  it('tiene la marca, el comprador, el vendedor y las líneas con sus gustos, también la mitad y mitad', () => {
    render(<SaleReceipt sale={saleDef()} onClose={vi.fn()} />);
    const receipt = within(screen.getByRole('article', { name: 'Comprobante' }));
    ['Empanadería Isabela', 'Venta 20000000', '25/10/2026, 14:05', 'Marta', 'vendedora'].forEach((text) => expect(receipt.getByText(text)).toBeDefined());
    expect(receipt.getByRole('row', { name: /Empanadas · ½ docena 2 Carne \+ 4 Pollo \$6\.500/ })).toBeDefined();
    expect(receipt.getByRole('row', { name: /Pizzas · 2 sabores Muzza \/ Napolitana \$12\.000/ })).toBeDefined();
  });

  it('suma el subtotal, muestra el total y cada medio de pago con su monto', () => {
    render(<SaleReceipt sale={saleDef()} onClose={vi.fn()} />);
    expect(screen.getByText('Subtotal').nextSibling?.textContent).toBe('$18.500');
    expect(screen.getByText('Débito').nextSibling?.textContent).toBe('$8.500');
    expect(screen.queryByText('Descuento')).toBeNull();
  });

  it('muestra los descuentos en % y en $, y "Sin nombre" si no hay comprador', () => {
    render(<SaleReceipt sale={MORNING_SALE} onClose={vi.fn()} />);
    expect(screen.getByText('Sin nombre')).toBeDefined();
    expect(screen.getAllByText('Descuento').map((label) => label.nextSibling?.textContent)).toEqual(['-10%', '-$250']);
  });

  it('Volver cierra el comprobante e Imprimir abre la impresión', () => {
    const onClose = vi.fn();
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    render(<SaleReceipt sale={saleDef()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir comprobante' }));
    expect(onClose).toHaveBeenCalled();
    expect(print).toHaveBeenCalled();
  });
});
