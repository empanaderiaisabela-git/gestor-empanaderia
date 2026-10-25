import { describe, expect, it } from 'vitest';
import { useAuditStore } from '@/features/audit/store/audit.store';
import { useCustomerStore } from '@/features/customer/store/customer.store';
import { useDeviceStore } from '@/features/device/store/device.store';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useProductStore } from '@/features/product/store/product.store';
import { useProviderStore } from '@/features/provider/store/provider.store';
import { useSaleStore } from '@/features/sale/store/sale.store';
import { useStatsStore } from '@/features/stats/store/stats.store';
import { useUserStore } from '@/features/user/store/user.store';
import { invalidateAllCaches } from './index';

const STORES = [useAuditStore, useCustomerStore, useDeviceStore, useMenuStore, useProductStore, useProviderStore, useSaleStore, useStatsStore, useUserStore];

describe('invalidateAllCaches', () => {
  it('después de una mutación, todos los stores (también el del menú) vuelven a pedir sus datos', () => {
    STORES.forEach((store) => store.getState().setLoaded(true));
    invalidateAllCaches();
    expect(STORES.map((store) => store.getState().isLoaded)).toEqual(STORES.map(() => false));
  });
});
