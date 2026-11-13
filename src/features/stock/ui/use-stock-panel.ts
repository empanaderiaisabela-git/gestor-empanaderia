import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { fetchMenuItems } from '@/features/menu/actions/fetch-menu-items';
import { setHamPriceAction } from '@/features/menu/actions/set-ham-price';
import type { HamPriceDef, HamPriceInput } from '@/features/menu/domain/pizza-extra.schema';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { fetchProviders } from '@/features/provider/actions/fetch-providers';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import { registerStockEntryAction } from '@/features/stock/actions/register-stock-entry';
import { registerStockLossAction } from '@/features/stock/actions/register-stock-loss';
import { setStockPricingAction } from '@/features/stock/actions/set-stock-pricing';
import { categoryOf, type StockCategory } from '@/features/stock/domain/stock-categories';
import { orderStock, type StockOrder } from '@/features/stock/domain/stock-order';
import { applyPriceIncreaseAction } from '@/features/stock/actions/apply-price-increase';
import { overwriteStockAction } from '@/features/stock/actions/overwrite-stock';
import type { PriceIncreaseInput } from '@/features/stock/domain/stock-increase';
import type { StockEntryDef, StockEntryInput, StockLossInput, StockOverwriteInput, StockPricingInput } from '@/features/stock/domain/stock.schema';
import { matchesAllWords } from '@/lib/utils';
import { stockSearchText } from './stock-search';
import { useHamPrice } from './use-ham-price';

export type StockDialog = { kind: 'entry' | 'loss' | 'pricing' | 'history'; item: MenuItemDef | null } | { kind: 'edit'; item: MenuItemDef; entry: StockEntryDef | null } | null;
type Message = { type: 'success' | 'error'; text: string } | null;

export type StockPanelModel = {
  loading: boolean;
  items: MenuItemDef[];
  activeItems: MenuItemDef[];
  providers: ProviderDef[];
  search: string;
  setSearch: (value: string) => void;
  categoryFilter: StockCategory | 'todos';
  setCategoryFilter: (value: StockCategory | 'todos') => void;
  stockOrder: StockOrder;
  setStockOrder: (value: StockOrder) => void;
  dialog: StockDialog;
  setDialog: (dialog: StockDialog) => void;
  message: Message;
  submitEntry: (input: StockEntryInput) => Promise<string | null>;
  submitLoss: (input: StockLossInput) => Promise<string | null>;
  submitPricing: (input: StockPricingInput) => Promise<string | null>;
  submitOverwrite: (input: StockOverwriteInput) => Promise<string | null>;
  ham: HamPriceDef;
  submitHamPrice: (input: HamPriceInput) => Promise<string | null>;
  submitIncrease: (input: PriceIncreaseInput) => Promise<string | null>;
};

function useStockData(): { loading: boolean; providers: ProviderDef[]; reload: () => Promise<void> } {
  const { isLoaded, setItems } = useMenuStore();
  const [loading, setLoading] = useState(!isLoaded);
  const [providers, setProviders] = useState<ProviderDef[]>([]);
  const reload = async (): Promise<void> => setItems(await fetchMenuItems());
  useEffect(() => {
    fetchProviders().then(setProviders);
    if (isLoaded) return setLoading(false);
    fetchMenuItems()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [isLoaded, setItems]);
  return { loading, providers, reload };
}

export function useStockPanel(): StockPanelModel {
  const allItems = useMenuStore((state) => state.items);
  const { loading, providers, reload } = useStockData();
  const { ham, setHam } = useHamPrice();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StockCategory | 'todos'>('todos');
  const [stockOrder, setStockOrder] = useState<StockOrder>('categoria');
  const [dialog, setDialog] = useState<StockDialog>(null);
  const [message, setMessage] = useState<Message>(null);
  const isAdmin = useAuthStore((state) => state.user?.role) === 'admin';
  const activeItems = useMemo(() => allItems.filter((item) => item.isActive), [allItems]);
  const items = useMemo(() => {
    const matching = activeItems.filter((item) => matchesAllWords(stockSearchText(item, isAdmin), search) && (categoryFilter === 'todos' || categoryOf(item) === categoryFilter));
    return orderStock(matching, stockOrder);
  }, [activeItems, search, categoryFilter, stockOrder, isAdmin]);
  const submit = async (result: Promise<{ success: boolean; error?: string; message?: string }>): Promise<string | null> => {
    const outcome = await result;
    if (!outcome.success) return outcome.error ?? 'No se pudo registrar el movimiento';
    await reload();
    setDialog(null);
    setMessage({ type: 'success', text: outcome.message ?? 'Listo' });
    return null;
  };
  const submitEntry = (input: StockEntryInput): Promise<string | null> => submit(registerStockEntryAction(input));
  const submitLoss = (input: StockLossInput): Promise<string | null> => submit(registerStockLossAction(input));
  const submitPricing = (input: StockPricingInput): Promise<string | null> => submit(setStockPricingAction(input));
  const submitOverwrite = (input: StockOverwriteInput): Promise<string | null> => submit(overwriteStockAction(input));
  const submitHamPrice = async (input: HamPriceInput): Promise<string | null> => {
    const result = await setHamPriceAction(input);
    if (result.success) setHam(result.data);
    return submit(Promise.resolve(result));
  };
  return { loading, items, activeItems, providers, search, setSearch, categoryFilter, setCategoryFilter, stockOrder, setStockOrder, dialog, setDialog, message, submitEntry, submitLoss, submitPricing, submitOverwrite, ham, submitHamPrice, submitIncrease: (input) => submit(applyPriceIncreaseAction(input)) };
}
