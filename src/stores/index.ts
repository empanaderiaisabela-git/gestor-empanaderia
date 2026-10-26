import { useCardStore } from '@/features/card/store/card.store';
import { useCustomerStore } from '@/features/customer/store/customer.store';
import { useExpenseStore } from '@/features/expense/store/expense.store';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { useAuditStore } from '@/features/audit/store/audit.store';
import { usePromotionStore } from '@/features/promotion/store/promotion.store';
import { useProviderStore } from '@/features/provider/store/provider.store';
import { useStatsStore } from '@/features/stats/store/stats.store';
import { useUserStore } from '@/features/user/store/user.store';

/**
 * Centrally invalidates all data caches in the application.
 * Call this after any CRUD operation to ensure data consistency across stores.
 */
export const invalidateAllCaches = () => {
  useCardStore.getState().setLoaded(false);
  useCustomerStore.getState().setLoaded(false);
  useExpenseStore.getState().setLoaded(false);
  useMenuStore.getState().setLoaded(false);
  useAuditStore.getState().setLoaded(false);
  usePromotionStore.getState().setLoaded(false);
  useProviderStore.getState().setLoaded(false);
  useStatsStore.getState().setLoaded(false);
  useUserStore.getState().setLoaded(false);
};
