import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SidebarNav } from './sidebar-nav';

const linkNames = (): string[] => screen.getAllByRole('link').map((link) => link.textContent ?? '');

describe('SidebarNav (US-2 CA-1)', () => {
  it('el vendedor ve sólo Ventas/Pedidos, Productos y Clientes', () => {
    render(<SidebarNav role='vendedor' pathname='/ventas' onNavigate={vi.fn()} />);
    expect(linkNames()).toEqual(['Ventas/Pedidos', 'Productos', 'Clientes']);
    expect(screen.queryByText('Auditoría')).toBeNull();
  });

  it('el admin ve el menú completo, con Estadísticas primero', () => {
    render(<SidebarNav role='admin' pathname='/' onNavigate={vi.fn()} />);
    expect(linkNames()).toEqual(['Estadísticas', 'Productos', 'Ventas/Pedidos', 'Clientes', 'Proveedores', 'Categorías', 'Usuarios', 'Auditoría']);
  });

  it('marca la sección actual con aria-current', () => {
    render(<SidebarNav role='admin' pathname='/clientes' onNavigate={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Clientes' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Estadísticas' }).getAttribute('aria-current')).toBeNull();
  });
});
