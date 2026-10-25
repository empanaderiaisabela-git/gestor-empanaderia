import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { fetchSaleHistory } from '@/features/order/actions/fetch-sale-history';
import { voidSaleAction } from '@/features/order/actions/void-sale';
import type { SaleDef } from '@/features/order/domain/sale-history.schema';
import { filterSales, NO_FILTERS, type SaleFilters } from './sale-history-filter';
import type { Notice } from './use-checkout';

export type SaleHistoryModel = {
  isAdmin: boolean;
  loading: boolean;
  sales: SaleDef[];
  filters: SaleFilters;
  setFilters: (filters: Partial<SaleFilters>) => void;
  receipt: SaleDef | null;
  setReceipt: (sale: SaleDef | null) => void;
  toVoid: SaleDef | null;
  setToVoid: (sale: SaleDef | null) => void;
  pending: boolean;
  notice: Notice | null;
  reload: () => Promise<void>;
  confirmVoid: () => Promise<void>;
};

function useSales(): { all: SaleDef[]; loading: boolean; reload: () => Promise<void> } {
  const [all, setAll] = useState<SaleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async (): Promise<void> => {
    setAll(await fetchSaleHistory());
    setLoading(false);
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { all, loading, reload };
}

function useVoidSale(reload: () => Promise<void>): Pick<SaleHistoryModel, 'toVoid' | 'setToVoid' | 'pending' | 'notice' | 'confirmVoid'> {
  const [toVoid, setToVoid] = useState<SaleDef | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const confirmVoid = async (): Promise<void> => {
    if (!toVoid) return;
    setPending(true);
    const result = await voidSaleAction({ saleId: toVoid.id });
    setPending(false);
    setToVoid(null);
    if (!result.success) return setNotice({ type: 'error', text: result.error });
    setNotice({ type: 'success', text: result.message ?? 'Venta anulada' });
    useMenuStore.getState().setLoaded(false);
    await reload();
  };
  return { toVoid, setToVoid, pending, notice, confirmVoid };
}

export function useSaleHistory(): SaleHistoryModel {
  const isAdmin = useAuthStore((state) => state.user?.role) === 'admin';
  const { all, loading, reload } = useSales();
  const [filters, setAll] = useState<SaleFilters>(NO_FILTERS);
  const [receipt, setReceipt] = useState<SaleDef | null>(null);
  const sales = useMemo(() => filterSales(all, filters), [all, filters]);
  const setFilters = (changes: Partial<SaleFilters>): void => setAll((current) => ({ ...current, ...changes }));
  return { isAdmin, loading, sales, filters, setFilters, receipt, setReceipt, reload, ...useVoidSale(reload) };
}
