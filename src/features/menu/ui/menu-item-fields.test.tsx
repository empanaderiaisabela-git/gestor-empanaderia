import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import { MenuItemFields } from './menu-item-fields';
import { initialValues } from './menu-item-form';

function renderFor(group: MenuGroup, isEditing = false): void {
  render(<MenuItemFields values={{ ...initialValues(null), group }} errors={{ price3: 'Ingresá un precio válido' }} isEditing={isEditing} onChange={vi.fn()} />);
}

const priceLabels = (): string[] => screen.queryAllByText(/^Precio /).map((label) => label.firstChild?.textContent ?? '');

describe('campos del alta según el grupo (US-3 CA-5)', () => {
  it('una empanada no pide precio propio: avisa que el precio de venta se carga arriba, en el del grupo', () => {
    renderFor('empanadas');
    expect(priceLabels()).toEqual([]);
    expect(screen.getByText('El precio de venta es el mismo para todos los gustos: se carga arriba, en "Precios de venta de Empanadas".')).toBeDefined();
  });

  it('un sanguche pide los precios de venta de 1, 3, 6 y 12 unidades y muestra el error de cada uno', () => {
    renderFor('sanguches');
    expect(priceLabels()).toEqual(['Precio de venta, 1 unidad', 'Precio de venta, 3 unidades', 'Precio de venta, 6 unidades', 'Precio de venta, 12 unidades']);
    expect(screen.getByText('Ingresá un precio válido')).toBeDefined();
    expect(screen.getByText('Lo que paga el cliente.')).toBeDefined();
  });

  it('una pizza pide el costo y el precio de venta de la pizza entera, sin hablar de unidades (BUG-13)', () => {
    renderFor('pizzas');
    expect(priceLabels()).toEqual(['Precio de venta, pizza entera']);
    expect(screen.getByLabelText('Costo para el local, por pizza entera')).toBeDefined();
    expect(screen.queryByText(/unidad/)).toBeNull();
  });

  it('el costo es por unidad en los demás grupos y aclara que no es el precio de venta (BUG-13)', () => {
    renderFor('ciabattas');
    expect(screen.getByLabelText('Costo para el local, por unidad')).toBeDefined();
    expect(screen.getByText('Lo que te cuesta hacerlo o comprarlo. No es el precio de venta.')).toBeDefined();
  });

  it('al editar no se puede cambiar el grupo', () => {
    renderFor('pepsi', true);
    expect(screen.getByRole('combobox').hasAttribute('disabled')).toBe(true);
  });
});
