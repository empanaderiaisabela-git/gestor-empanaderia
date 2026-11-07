import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { completeSalePaymentAction } from '@/features/order/actions/complete-sale-payment';
import { saleDef } from '../testing/sale-fixtures';
import { CompletePaymentModal } from './complete-payment-modal';
import { SaleButtons } from './sale-history-columns';

vi.mock('@/features/order/actions/complete-sale-payment', () => ({ completeSalePaymentAction: vi.fn() }));
vi.mock('@/features/card/actions/fetch-cards', () => ({ fetchCards: vi.fn(async () => []) }));

const PENDING = saleDef({ payments: [], total: 18500 });

describe('completar el pago desde Ventas/Pedidos (US-69 CA-1)', () => {
  beforeEach(() => {
    vi.mocked(completeSalePaymentAction).mockReset();
  });

  it('sólo las ventas sin pagos tienen el botón "Completar pago", para admin y vendedor', () => {
    const onComplete = vi.fn();
    const { unmount } = render(<SaleButtons sale={PENDING} actions={{ isAdmin: false, onReceipt: vi.fn(), onVoid: vi.fn(), onComplete }} />);
    fireEvent.click(screen.getByTitle('Completar pago'));
    expect(onComplete).toHaveBeenCalledWith(PENDING);
    unmount();
    render(<SaleButtons sale={saleDef()} actions={{ isAdmin: true, onReceipt: vi.fn(), onVoid: vi.fn(), onComplete }} />);
    expect(screen.queryByTitle('Completar pago')).toBeNull();
  });

  it('con descuento y efectivo, manda el pago por el total con el descuento (D-3)', async () => {
    vi.mocked(completeSalePaymentAction).mockResolvedValue({ success: true, message: 'Pago completado por $16.650', data: { saleId: PENDING.id, total: 16650 } });
    const onDone = vi.fn();
    render(<CompletePaymentModal sale={PENDING} onClose={vi.fn()} onDone={onDone} />);
    fireEvent.change(screen.getByLabelText('Descuento %'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Efectivo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar $16.650' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Pago completado por $16.650'));
    expect(completeSalePaymentAction).toHaveBeenCalledWith({ saleId: PENDING.id, discountPercentage: 10, discountAmount: 0, payments: [{ type: 'efectivo', amount: 16650 }] });
  });

  it('sin medio de pago no manda nada y lo avisa; un rechazo del servidor se muestra', async () => {
    vi.mocked(completeSalePaymentAction).mockResolvedValue({ success: false, code: 'STALE_VERSION', error: 'Otro usuario cambió estos datos. Ya se actualizaron; intentá de nuevo.' });
    render(<CompletePaymentModal sale={PENDING} onClose={vi.fn()} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar $18.500' }));
    expect(await screen.findByText('Elegí un medio de pago')).toBeDefined();
    expect(completeSalePaymentAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Efectivo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar $18.500' }));
    expect(await screen.findByText(/Otro usuario cambió estos datos/)).toBeDefined();
  });
});
