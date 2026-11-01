import { render, screen } from '@testing-library/react';
import { useEffect, type ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { MenuItemFormModal } from './menu-item-form-modal';
import { useMenuPanel } from './use-menu-panel';

vi.mock('@/features/menu/actions/fetch-menu-items', () => ({ fetchMenuItems: vi.fn(async () => []) }));
vi.mock('@/features/menu/actions/create-menu-item', () => ({ createMenuItemAction: vi.fn() }));
vi.mock('@/features/menu/actions/update-menu-item', () => ({ updateMenuItemAction: vi.fn() }));
vi.mock('@/features/menu/actions/delete-menu-item', () => ({ deleteMenuItemAction: vi.fn() }));
vi.mock('@/features/menu/actions/toggle-menu-item-active', () => ({ toggleMenuItemActiveAction: vi.fn() }));

const ITEM: MenuItemDef = { id: 'x', group: 'coca_cola', name: 'Coca-Cola 1.5L Manzana', unitCost: null, stock: 0, price1: null, price3: null, price6: null, price12: null, isActive: true, isVisible: false, isBase: false, minStock: null, drinkName: 'Coca-Cola', liters: null, drinkSize: '1.5L', flavor: 'Manzana', version: 1, createdAt: '', updatedAt: '' };

function Harness(): ReactElement {
  const model = useMenuPanel();
  const { openFormModal } = model.manager;
  useEffect(() => openFormModal(ITEM));
  return <MenuItemFormModal model={model} />;
}

describe('formulario de producto (US-51 CA-1)', () => {
  beforeEach(() => useMenuStore.setState({ items: [ITEM], isLoaded: true }));

  it('al editar muestra arriba del formulario el nombre completo de lo editado', () => {
    render(<Harness />);
    expect(screen.getByText('Coca-Cola 1.5L Manzana').tagName).toBe('P');
    expect(screen.getByText('Editar producto')).toBeDefined();
  });
});
