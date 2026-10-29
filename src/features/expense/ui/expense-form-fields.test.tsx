import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import { ExpenseFields } from './expense-form-fields';

const ACTIVE: ProviderDef = { id: 'p1', name: 'Molino', phone: '', email: '', isActive: true, version: 1, createdAt: '', updatedAt: '' };
const OFF: ProviderDef = { ...ACTIVE, id: 'p2', name: 'Viejo', isActive: false };
const VALUES = { invoiceNumber: '', title: '', amount: '', invoiceDate: '', providerId: '' };

function options(currentProviderId: string | null): string[] {
  render(<ExpenseFields values={VALUES} errors={{}} providers={[ACTIVE, OFF]} currentProviderId={currentProviderId} onChange={vi.fn()} />);
  return screen.getAllByRole('option').map((option) => option.textContent ?? '');
}

describe('selector de proveedor del gasto (US-27)', () => {
  it('ofrece sólo los proveedores activos', () => {
    expect(options(null)).toEqual(['Elegí un proveedor', 'Molino']);
  });

  it('al editar suma el proveedor del gasto aunque esté desactivado', () => {
    expect(options('p2')).toEqual(['Elegí un proveedor', 'Molino', 'Viejo']);
  });
});
