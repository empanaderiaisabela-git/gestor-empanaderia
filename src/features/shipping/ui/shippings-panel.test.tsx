import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { JSX } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShippingDef } from '@/features/shipping/domain/shipping.schema';
import { useShippingStore } from '@/features/shipping/store/shipping.store';
import { ShippingFormModal } from './shipping-form-modal';
import { ShippingsPanel } from './shippings-panel';
import { useShippingsPanel } from './use-shippings-panel';

const actions = vi.hoisted(() => ({ fetch: vi.fn(), create: vi.fn(), update: vi.fn() }));

vi.mock('@/features/shipping/actions/fetch-shipping-options', () => ({ fetchShippingOptions: actions.fetch }));
vi.mock('@/features/shipping/actions/create-shipping', () => ({ createShippingAction: actions.create }));
vi.mock('@/features/shipping/actions/update-shipping', () => ({ updateShippingAction: actions.update }));
vi.mock('@/features/shipping/actions/toggle-shipping-active', () => ({ toggleShippingActiveAction: vi.fn() }));
vi.mock('@/features/shipping/actions/delete-shipping', () => ({ deleteShippingAction: vi.fn() }));

const CENTRO: ShippingDef = { id: 's1', title: 'Centro', detail: 'Barrio A hasta Barrio B', amount: 1500, isActive: true, version: 1, createdAt: '', updatedAt: '' };
const NORTE: ShippingDef = { ...CENTRO, id: 's2', title: 'Norte', detail: 'Ruta 8', isActive: false };

function EditHarness(): JSX.Element {
  const model = useShippingsPanel();
  return (
    <>
      <button onClick={() => model.manager.openFormModal(CENTRO)}>Editar Centro</button>
      <ShippingFormModal model={model} />
    </>
  );
}

describe('pantalla de Envíos (US-58 CA-3)', () => {
  beforeEach(() => {
    useShippingStore.setState({ shippings: [], isLoaded: false });
    actions.fetch.mockResolvedValue([CENTRO, NORTE]);
    actions.create.mockResolvedValue({ success: true, message: 'Se registró el envío' });
    actions.update.mockResolvedValue({ success: true, message: 'Se actualizó el envío' });
  });

  it('lista los activos; con "Ver Inactivos" también los desactivados, y busca por título o detalle', async () => {
    const { result } = renderHook(() => useShippingsPanel());
    await waitFor(() => expect(result.current.initialLoading).toBe(false));
    expect(result.current.visibleShippings.map((shipping) => shipping.id)).toEqual(['s1']);
    act(() => result.current.setShowInactive(true));
    expect(result.current.visibleShippings.map((shipping) => shipping.id)).toEqual(['s1', 's2']);
    act(() => result.current.manager.setSearch('ruta'));
    expect(result.current.visibleShippings.map((shipping) => shipping.id)).toEqual(['s2']);
  });

  it('da de alta un envío con título, detalle y monto, también de $0 (D-6)', async () => {
    render(<ShippingsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo envío' }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Retira en el local' } });
    fireEvent.change(screen.getByLabelText('Detalle'), { target: { value: 'Sin cargo' } });
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar envío' }));
    await waitFor(() => expect(actions.create).toHaveBeenCalledWith({ title: 'Retira en el local', detail: 'Sin cargo', amount: 0 }), { timeout: 5000 });
  });

  it('edita un envío con sus datos precargados y la versión', async () => {
    render(<EditHarness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Centro' }));
    expect(screen.getByLabelText('Título').getAttribute('value')).toBe('Centro');
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1800,50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(actions.update).toHaveBeenCalledWith('s1', { title: 'Centro', detail: CENTRO.detail, amount: 1800.5, version: 1 }), { timeout: 5000 });
  });

  it('no manda un envío sin título ni monto y muestra los errores', async () => {
    render(<ShippingsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo envío' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar envío' }));
    expect(await screen.findByText('El título es obligatorio')).toBeDefined();
    expect(screen.getByText('Ingresá un monto válido')).toBeDefined();
    expect(actions.create).not.toHaveBeenCalled();
  });
});
