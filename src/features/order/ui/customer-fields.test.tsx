import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CustomerDef } from '@/features/customer/domain/customer.schema';
import { useCustomerStore } from '@/features/customer/store/customer.store';
import { useOrderStore } from '@/features/order/store/order.store';
import { CustomerFields } from './customer-fields';

const marta: CustomerDef = { id: 'c1', name: 'Marta Gómez', phone: '11 5555-1234', email: '', address: 'Mitre 123', documentNumber: null, isActive: true, version: 1, createdAt: '', updatedAt: '' };
vi.mock('@/features/customer/actions/customer.actions', () => ({ fetchCustomers: vi.fn(async () => [marta]) }));

const buyer = () => useOrderStore.getState().buyer;

describe('datos del cliente en el carrito (US-37)', () => {
  beforeEach(() => {
    useOrderStore.getState().clear();
    act(() => useCustomerStore.getState().setLoaded(false));
  });

  it('al escribir aparecen los clientes que coinciden y al elegir uno se completan sus datos', async () => {
    render(<CustomerFields />);
    fireEvent.change(screen.getByLabelText('Nombre del cliente'), { target: { value: 'marta' } });
    const sugeridos = await screen.findByRole('list', { name: 'Clientes sugeridos' });
    fireEvent.click(within(sugeridos).getByRole('button', { name: /Marta Gómez/ }));
    expect(buyer()).toEqual({ customerId: 'c1', name: 'Marta Gómez', phone: '11 5555-1234', address: 'Mitre 123' });
    expect(screen.getByText('Cliente registrado')).toBeDefined();
    expect(screen.queryByRole('list', { name: 'Clientes sugeridos' })).toBeNull();
  });

  it('cambiar el teléfono mantiene el cliente; cambiar el nombre lo vuelve un cliente nuevo', async () => {
    act(() => useOrderStore.getState().setBuyer({ customerId: 'c1', name: 'Marta Gómez', phone: '11 5555-1234', address: 'Mitre 123' }));
    render(<CustomerFields />);
    fireEvent.change(screen.getByLabelText('Teléfono (opcional)'), { target: { value: '11 4444-0000' } });
    expect(buyer().customerId).toBe('c1');
    fireEvent.change(screen.getByLabelText('Nombre del cliente'), { target: { value: 'Marta López' } });
    expect(buyer()).toMatchObject({ customerId: null, name: 'Marta López', phone: '11 4444-0000' });
  });
});
