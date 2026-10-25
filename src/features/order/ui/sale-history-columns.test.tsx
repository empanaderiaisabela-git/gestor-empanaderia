import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MORNING_SALE, saleDef } from '../testing/sale-fixtures';
import { getSaleHistoryColumns, renderSaleCard, SaleButtons } from './sale-history-columns';

const SALE = saleDef();
const actions = (isAdmin: boolean) => ({ isAdmin, onReceipt: vi.fn(), onVoid: vi.fn() });

describe('grilla de Ventas/Pedidos (US-7 CA-1)', () => {
  it('tiene toda la información de la grilla de historial', () => {
    expect(getSaleHistoryColumns(actions(true)).map((column) => column.header)).toEqual(['Fecha y hora', 'Comprador', 'Vendedor', 'Pedido', 'Pago', 'Desc.', 'Total', 'Acciones']);
  });

  it('muestra fecha y hora de Argentina, comprador, vendedor, pedido, medios de pago y total', () => {
    const columns = getSaleHistoryColumns(actions(false));
    render(<div>{columns.slice(0, 7).map((column, index) => <span key={index}>{column.cell(SALE)}</span>)}</div>);
    ['25/10/2026, 14:05', 'Marta', 'vendedora', 'Efectivo', 'Débito', '—', '$18.500'].forEach((text) => expect(screen.getByText(text)).toBeDefined());
    expect(screen.getByText('Empanadas · ½ docena: 2 Carne + 4 Pollo · Pizzas · 2 sabores: Muzza / Napolitana')).toBeDefined();
  });

  it('muestra los descuentos y "Sin nombre" cuando no hay comprador', () => {
    const columns = getSaleHistoryColumns(actions(false));
    render(<div>{[1, 5].map((index) => <span key={index}>{columns[index].cell(MORNING_SALE)}</span>)}</div>);
    expect(screen.getByText('Sin nombre')).toBeDefined();
    expect(screen.getByText('-10% -$250')).toBeDefined();
  });

  it('todos ven el comprobante; sólo el admin puede anular (CA-4)', () => {
    const seller = actions(false);
    const { unmount } = render(<SaleButtons sale={SALE} actions={seller} />);
    expect(screen.queryByTitle('Anular venta')).toBeNull();
    fireEvent.click(screen.getByTitle('Ver comprobante'));
    expect(seller.onReceipt).toHaveBeenCalledWith(SALE);
    unmount();
    const admin = actions(true);
    render(<SaleButtons sale={SALE} actions={admin} />);
    fireEvent.click(screen.getByTitle('Anular venta'));
    expect(admin.onVoid).toHaveBeenCalledWith(SALE);
  });

  it('en el celular, cada venta es una tarjeta con comprador, fecha, vendedor e importe', () => {
    render(renderSaleCard(actions(true))(MORNING_SALE));
    expect(screen.getByText('Sin nombre')).toBeDefined();
    expect(screen.getByText('24/10/2026, 10:00 · admin')).toBeDefined();
    expect(screen.getByText('$2.500')).toBeDefined();
  });
});
