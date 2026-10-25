import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { createDeviceAction, deleteDeviceAction, toggleDeviceActiveAction, updateDeviceAction } from '@/features/device/actions/device.actions';
import { createSaleAction, deleteSaleAction } from '@/features/sale/actions/sale.actions';
import { asUser } from './as-user';
import { seedLegacyProduct, seedTestUser } from './seed-legacy-catalog';
import { truncateAll } from './truncate-all';

const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({ revalidatePath }));

async function expectRevalidated<T extends { success: boolean }>(result: Promise<T>): Promise<T> {
  revalidatePath.mockClear();
  const resolved = await result;
  expect(resolved).toMatchObject({ success: true });
  expect(revalidatePath).toHaveBeenCalledExactlyOnceWith('/home');
  return resolved;
}

describe('T-11 CA-2: categorías y ventas invalidan el catálogo', () => {
  beforeEach(async () => {
    await truncateAll();
    await seedTestUser('admin');
    await asUser({ role: 'admin' });
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('alta, edición, activación y borrado de una categoría', async () => {
    const created = await expectRevalidated(createDeviceAction({ name: 'Empanadas' }));
    const id = created.success ? created.data.id : '';
    await expectRevalidated(updateDeviceAction(id, { name: 'Empanadas al horno', version: 1 }));
    await expectRevalidated(toggleDeviceActiveAction(id, false));
    await expectRevalidated(deleteDeviceAction(id));
  });

  it('registrar y anular una venta cambian el stock que muestra el catálogo', async () => {
    const { productId } = await seedLegacyProduct();
    const item = { productId, quantity: 1, unitPrice: 2, unitCost: 1, subtotal: 2 };
    const input = { total: 2, discountAmount: 0, discountPercentage: 0, items: [item], payments: [{ type: 'efectivo' as const, amount: 2 }] };
    const sale = await expectRevalidated(createSaleAction(input));
    await expectRevalidated(deleteSaleAction(sale.success && sale.data ? sale.data.id : ''));
  });
});
