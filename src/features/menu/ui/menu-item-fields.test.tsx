import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import { MenuItemFields } from './menu-item-fields';
import { initialValues } from './menu-item-form';

function renderFor(group: MenuGroup, isEditing = false): void {
  render(<MenuItemFields values={{ ...initialValues(null), group }} errors={{ name: 'El nombre es obligatorio' }} isEditing={isEditing} onChange={vi.fn()} />);
}

describe('campos del alta', () => {
  it('pide sólo grupo y nombre, y muestra el error del nombre', () => {
    renderFor('sanguches');
    expect(screen.getByLabelText('Grupo')).toBeDefined();
    expect(screen.getByLabelText(/Nombre del gusto o bebida/)).toBeDefined();
    expect(screen.getByText('El nombre es obligatorio')).toBeDefined();
    expect(screen.queryByText(/Costo|Precio/)).toBeNull();
  });

  it('al editar no se puede cambiar el grupo', () => {
    renderFor('pepsi', true);
    expect(screen.getByLabelText('Grupo').hasAttribute('disabled')).toBe(true);
  });

  it('en Coca-Cola y Quilmes pide bebida, litros o mililitros y sabor en lugar del nombre (US-51)', () => {
    render(<MenuItemFields values={{ ...initialValues(null), group: 'pepsi' }} errors={{}} isEditing={false} onChange={vi.fn()} drinkNames={['Quilmes']} />);
    expect([screen.getByLabelText('Bebida'), screen.getByLabelText('Litros o mililitros'), screen.getByLabelText('Sabor (opcional)')]).toHaveLength(3);
    expect(screen.queryByLabelText('Nombre del gusto o bebida')).toBeNull();
  });
});
