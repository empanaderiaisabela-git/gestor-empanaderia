import { describe, expect, it } from 'vitest';
import { useAuditStore } from '@/features/audit/store/audit.store';
import { useCardStore } from '@/features/card/store/card.store';
import { useCustomerStore } from '@/features/customer/store/customer.store';
import { useExpenseStore } from '@/features/expense/store/expense.store';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { usePromotionStore } from '@/features/promotion/store/promotion.store';
import { useProviderStore } from '@/features/provider/store/provider.store';
import { useStatsStore } from '@/features/stats/store/stats.store';
import { useUserStore } from '@/features/user/store/user.store';
import { invalidateAllCaches } from './index';

const STORES = [useAuditStore, useCardStore, useCustomerStore, useExpenseStore, useMenuStore, usePromotionStore, useProviderStore, useStatsStore, useUserStore];

const FILL = [
  () => useAuditStore.getState().setLogs([]),
  () => useCardStore.getState().setCards([]),
  () => useCustomerStore.getState().setCustomers([]),
  () => useExpenseStore.getState().setExpenses([]),
  () => useMenuStore.getState().setItems([]),
  () => usePromotionStore.getState().setPromotions([]),
  () => useProviderStore.getState().setProviders([]),
  () => useStatsStore.getState().setStats(null),
  () => useUserStore.getState().setUsers([]),
];

describe('cachés de los stores', () => {
  it('cada store queda cargado al recibir sus datos', () => {
    FILL.forEach((fill) => fill());
    expect(STORES.map((store) => store.getState().isLoaded)).toEqual(STORES.map(() => true));
  });

  it('después de una mutación, todos los stores (también el del menú) vuelven a pedir sus datos', () => {
    STORES.forEach((store) => store.getState().setLoaded(true));
    invalidateAllCaches();
    expect(STORES.map((store) => store.getState().isLoaded)).toEqual(STORES.map(() => false));
  });
});
