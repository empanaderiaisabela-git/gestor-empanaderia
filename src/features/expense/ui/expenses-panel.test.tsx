import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExpenseDef } from '@/features/expense/domain/expense.schema';
import { useExpenseStore } from '@/features/expense/store/expense.store';
import { argentinaDay } from '@/lib/format-date-time';
import { ExpensesPanel } from './expenses-panel';
import { useExpensesPanel } from './use-expenses-panel';

const actions = vi.hoisted(() => ({ fetch: vi.fn(), create: vi.fn(), providers: vi.fn() }));

vi.mock('@/features/expense/actions/fetch-expenses', () => ({ fetchExpenses: actions.fetch }));
vi.mock('@/features/expense/actions/create-expense', () => ({ createExpenseAction: actions.create }));
vi.mock('@/features/expense/actions/update-expense', () => ({ updateExpenseAction: vi.fn() }));
vi.mock('@/features/provider/actions/fetch-providers', () => ({ fetchProviders: actions.providers }));
vi.mock('@/features/expense/actions/delete-expense', () => ({ deleteExpenseAction: vi.fn() }));

const MOLINO = { id: '00000000-0000-4000-8000-0000000000b1', name: 'Molino del Sur', phone: '', email: '', isActive: true, version: 1, createdAt: '', updatedAt: '' };
const HARINA: ExpenseDef = { id: 'e1', invoiceNumber: 'A-0001', title: 'Harina 25 kg', amount: 18500, invoiceDate: argentinaDay(new Date()), providerId: MOLINO.id, providerName: MOLINO.name, version: 1, createdAt: '', updatedAt: '' };
const GAS: ExpenseDef = { ...HARINA, id: 'e2', invoiceNumber: 'B-77', title: 'Gas', amount: 9000, providerName: 'Gasera' };
const VIEJO: ExpenseDef = { ...HARINA, id: 'e3', invoiceNumber: 'Z-1', title: 'Luz', invoiceDate: '2020-03-15' };

describe('pantalla de Gastos (US-14)', () => {
  beforeEach(() => {
    useExpenseStore.setState({ expenses: [], isLoaded: false });
    actions.fetch.mockResolvedValue([HARINA, GAS, VIEJO]);
    actions.providers.mockResolvedValue([MOLINO, { ...MOLINO, id: '00000000-0000-4000-8000-0000000000b2', name: 'Viejo', isActive: false }]);
    actions.create.mockResolvedValue({ success: true, message: 'Se registró el gasto' });
  });

  it('busca por número de factura o por título (CA-2)', async () => {
    const { result } = renderHook(() => useExpensesPanel());
    await waitFor(() => expect(result.current.initialLoading).toBe(false));
    expect(result.current.visibleExpenses.map((expense) => expense.id)).toEqual(['e1', 'e2']);
    act(() => result.current.manager.setSearch('b-77'));
    expect(result.current.visibleExpenses.map((expense) => expense.id)).toEqual(['e2']);
    act(() => result.current.manager.setSearch('molino'));
    expect(result.current.visibleExpenses.map((expense) => expense.id)).toEqual(['e1']);
  });

  it('muestra los gastos del mes en curso; con otras fechas o sin filtro, los demás (US-33)', async () => {
    const { result } = renderHook(() => useExpensesPanel());
    await waitFor(() => expect(result.current.initialLoading).toBe(false));
    const month = argentinaDay(new Date()).slice(0, 8);
    expect(result.current.dates.start).toBe(`${month}01`);
    expect(result.current.visibleExpenses.map((expense) => expense.id)).toEqual(['e1', 'e2']);
    act(() => result.current.setDates({ start: '2020-03-15', end: '2020-03-15' }));
    expect(result.current.visibleExpenses.map((expense) => expense.id)).toEqual(['e3']);
    act(() => result.current.setDates({ start: '', end: '' }));
    expect(result.current.visibleExpenses).toHaveLength(3);
  });

  it('la X limpia las fechas', async () => {
    render(<ExpensesPanel />);
    fireEvent.click(await screen.findByTitle('Limpiar Filtro'));
    expect([screen.getByLabelText('Desde'), screen.getByLabelText('Hasta')].map((input) => input.getAttribute('value'))).toEqual(['', '']);
  });

  it('anota un gasto con número, título, proveedor, monto y fecha de la factura (CA-1)', async () => {
    render(<ExpensesPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo gasto' }));
    fireEvent.change(screen.getByLabelText('Número de factura'), { target: { value: 'C-12' } });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Aceite' } });
    fireEvent.change(await screen.findByLabelText('Proveedor'), { target: { value: MOLINO.id } });
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '12500,75' } });
    fireEvent.change(screen.getByLabelText('Fecha de la factura'), { target: { value: '2026-10-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Anotar gasto' }));
    await waitFor(() => expect(actions.create).toHaveBeenCalledWith({ invoiceNumber: 'C-12', title: 'Aceite', amount: 12500.75, invoiceDate: '2026-10-20', providerId: MOLINO.id }), { timeout: 5000 });
  });

  it('no manda un gasto sin monto y muestra el error', async () => {
    render(<ExpensesPanel />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo gasto' }));
    fireEvent.change(screen.getByLabelText('Número de factura'), { target: { value: 'C-12' } });
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Aceite' } });
    fireEvent.click(screen.getByRole('button', { name: 'Anotar gasto' }));
    expect(await screen.findByText('Ingresá un monto válido')).toBeDefined();
    expect(actions.create).not.toHaveBeenCalled();
  });
});
