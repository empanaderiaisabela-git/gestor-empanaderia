import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GroupPriceCard } from './group-price-card';

const CIABATTAS = { group: 'ciabattas' as const, price1: 6000, price3: null, price6: null, price12: null, version: 2, updatedAt: '' };

describe('precios del grupo en pantalla (US-3 CA-7)', () => {
  it('sin precios cargados avisa que el grupo todavía no se puede vender', () => {
    render(<GroupPriceCard group='empanadas' current={undefined} onSave={vi.fn()} />);
    expect(screen.getByText('Sin precio: todavía no se puede vender')).toBeDefined();
    expect(screen.getAllByRole('textbox').map((input) => input.closest('label')?.textContent)).toEqual(['1 unidad', '3 unidades', '½ docena', '1 docena']);
  });

  it('aclara que son precios de venta, iguales para todos los gustos (BUG-13)', () => {
    render(<GroupPriceCard group='ciabattas' current={CIABATTAS} onSave={vi.fn()} />);
    expect(screen.getByRole('form', { name: 'Precios de venta de Ciabattas' })).toBeDefined();
    expect(screen.getByText('Lo que paga el cliente. Valen para todos los gustos del grupo.')).toBeDefined();
  });

  it('muestra los precios actuales y guarda con la versión vigente', async () => {
    const onSave = vi.fn(async () => null);
    render(<GroupPriceCard group='ciabattas' current={CIABATTAS} onSave={onSave} />);
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('value')).toBe('6000');
    fireEvent.change(input, { target: { value: '6500,50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar precios' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ group: 'ciabattas', prices: { price1: 6500.5 }, version: 2 }));
  });

  it('no guarda si falta un precio y muestra el motivo', async () => {
    const onSave = vi.fn(async () => null);
    render(<GroupPriceCard group='empanadas' current={undefined} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar precios' }));
    expect(await screen.findByText('Ingresá un precio válido')).toBeDefined();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('regression BUG-15: recargar los mismos precios no borra lo que se está escribiendo', () => {
    const { rerender } = render(<GroupPriceCard group='ciabattas' current={CIABATTAS} onSave={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '7000' } });
    rerender(<GroupPriceCard group='ciabattas' current={{ ...CIABATTAS }} onSave={vi.fn()} />);
    expect(screen.getByRole('textbox').getAttribute('value')).toBe('7000');
  });

  it('muestra el error que devuelve el servidor', async () => {
    render(<GroupPriceCard group='ciabattas' current={CIABATTAS} onSave={async () => 'Los datos en el servidor han cambiado.'} />);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar precios' }));
    expect(await screen.findByText('Los datos en el servidor han cambiado.')).toBeDefined();
  });
});
