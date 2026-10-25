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
  it('una empanada no pide precio propio: usa el del grupo', () => {
    renderFor('empanadas');
    expect(priceLabels()).toEqual([]);
    expect(screen.getByText('Este gusto usa los precios de Empanadas.')).toBeDefined();
  });

  it('un sanguche pide los precios de 1, 3, 6 y 12 unidades y muestra el error de cada uno', () => {
    renderFor('sanguches');
    expect(priceLabels()).toEqual(['Precio 1 unidad', 'Precio 3 unidades', 'Precio 6 unidades', 'Precio 12 unidades']);
    expect(screen.getByText('Ingresá un precio válido')).toBeDefined();
  });

  it('una pizza pide sólo el precio de la entera', () => {
    renderFor('pizzas');
    expect(priceLabels()).toEqual(['Precio pizza entera']);
  });

  it('al editar no se puede cambiar el grupo', () => {
    renderFor('pepsi', true);
    expect(screen.getByRole('combobox').hasAttribute('disabled')).toBe(true);
  });
});
