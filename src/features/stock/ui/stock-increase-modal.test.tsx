import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { StockIncreaseModal } from './stock-increase-modal';
import type { StockPanelModel } from './use-stock-panel';

const item = (id: string, name: string, extra: Partial<MenuItemDef> = {}): MenuItemDef => ({ id, group: 'empanadas', name, unitCost: 900, stock: 1, price1: 2500, price3: 7000, price6: 13000, price12: 24000, isActive: true, isVisible: false, isBase: false, minStock: null, drinkName: null, liters: null, drinkSize: null, flavor: null, version: 1, createdAt: '', updatedAt: '', ...extra });
const [CARNE, POLLO, HUMITA] = [item('11111111-1111-4111-8111-111111111111', 'Carne'), item('22222222-2222-4222-8222-222222222222', 'Pollo'), item('33333333-3333-4333-8333-333333333333', 'Humita')];
const aquarius = (id: string, flavor: string) => item(id, `Aquarius 1.5L ${flavor}`, { group: 'coca_cola', drinkName: 'Aquarius', drinkSize: '1.5L', flavor, price3: null, price6: null, price12: null });
const [MANZANA, PERA] = [aquarius('44444444-4444-4444-8444-444444444444', 'Manzana'), aquarius('55555555-5555-4555-8555-555555555555', 'Pera')];

function renderModal(submitIncrease = vi.fn(async () => null), onClose = vi.fn()) {
  const noop = vi.fn(async () => null);
  const model: StockPanelModel = { loading: false, items: [], activeItems: [CARNE, POLLO, HUMITA, MANZANA, PERA], providers: [], search: '', setSearch: vi.fn(), categoryFilter: 'todos', setCategoryFilter: vi.fn(), stockOrder: 'categoria', setStockOrder: vi.fn(), dialog: null, setDialog: vi.fn(), message: null, submitEntry: noop, submitLoss: noop, submitPricing: noop, submitEntryUpdate: noop, ham: { price: null, version: 0 }, submitHamPrice: noop, submitIncrease };
  render(<StockIncreaseModal model={model} isOpen onClose={onClose} />);
  return { submitIncrease, onClose };
}

describe('Registrar aumento (US-50 CA-1)', () => {
  it('al elegir la categoría aparecen sus productos, todos tildados; destildar uno lo deja afuera', async () => {
    const { submitIncrease, onClose } = renderModal();
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'empanadas' } });
    const checks = screen.getAllByRole('checkbox');
    expect(checks.map((check) => (check.closest('label')?.textContent ?? '') + (check.matches(':checked') ? ' ✓' : ''))).toEqual(['Carne ✓', 'Pollo ✓', 'Humita ✓']);
    fireEvent.click(screen.getByLabelText('Pollo'));
    fireEvent.change(screen.getByLabelText('Aumento del precio de venta (%)'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar aumento' }));
    await waitFor(() => expect(submitIncrease).toHaveBeenCalledWith({ menuItemIds: [CARNE.id, HUMITA.id], costPercent: null, pricePercent: 10 }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('en bebidas, una fila por familia que manda todos sus sabores', async () => {
    const { submitIncrease } = renderModal();
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'coca_cola' } });
    expect(screen.getByLabelText('Aquarius 1.5L (2 sabores)')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Aumento del costo (%)'), { target: { value: '7,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar aumento' }));
    await waitFor(() => expect(submitIncrease).toHaveBeenCalledWith({ menuItemIds: [MANZANA.id, PERA.id], costPercent: 7.5, pricePercent: null }));
  });

  it('sin porcentajes marca el error y no manda nada; la categoría no ofrece las bases', async () => {
    const { submitIncrease } = renderModal();
    expect(screen.queryByRole('option', { name: 'Prepizza' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'empanadas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar aumento' }));
    expect(await screen.findByText('Cargá al menos un porcentaje')).toBeDefined();
    expect(submitIncrease).not.toHaveBeenCalled();
  });
});
