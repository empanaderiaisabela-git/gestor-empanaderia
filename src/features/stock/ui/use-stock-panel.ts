import { useEffect, useMemo, useState } from 'react';
import { fetchMenuItems } from '@/features/menu/actions/fetch-menu-items';
import type { MenuGroup } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { useMenuStore } from '@/features/menu/store/menu.store';
import { fetchProviders } from '@/features/provider/actions/fetch-providers';
import type { ProviderDef } from '@/features/provider/domain/provider.schema';
import { registerStockEntryAction } from '@/features/stock/actions/register-stock-entry';
import { registerStockLossAction } from '@/features/stock/actions/register-stock-loss';
import type { StockEntryInput, StockLossInput } from '@/features/stock/domain/stock.schema';
import { normalizeForSearch } from '@/lib/utils';

export type StockDialog = { kind: 'entry' | 'loss' | 'history'; item: MenuItemDef | null } | null;
type Message = { type: 'success' | 'error'; text: string } | null;

export type StockPanelModel = {
  loading: boolean;
  items: MenuItemDef[];
  activeItems: MenuItemDef[];
  providers: ProviderDef[];
  search: string;
  setSearch: (value: string) => void;
  groupFilter: MenuGroup | 'todos';
  setGroupFilter: (value: MenuGroup | 'todos') => void;
  dialog: StockDialog;
  setDialog: (dialog: StockDialog) => void;
  message: Message;
  submitEntry: (input: StockEntryInput) => Promise<string | null>;
  submitLoss: (input: StockLossInput) => Promise<string | null>;
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
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<MenuGroup | 'todos'>('todos');
  const [dialog, setDialog] = useState<StockDialog>(null);
  const [message, setMessage] = useState<Message>(null);
  const activeItems = useMemo(() => allItems.filter((item) => item.isActive), [allItems]);
  const items = useMemo(() => {
    const term = normalizeForSearch(search);
    return activeItems.filter((item) => normalizeForSearch(item.name).includes(term) && (groupFilter === 'todos' || item.group === groupFilter));
  }, [activeItems, search, groupFilter]);
  const submit = async (result: Promise<{ success: boolean; error?: string; message?: string }>): Promise<string | null> => {
    const outcome = await result;
    if (!outcome.success) return outcome.error ?? 'No se pudo registrar el movimiento';
    setDialog(null);
    setMessage({ type: 'success', text: outcome.message ?? 'Listo' });
    await reload();
    return null;
  };
  const submitEntry = (input: StockEntryInput): Promise<string | null> => submit(registerStockEntryAction(input));
  const submitLoss = (input: StockLossInput): Promise<string | null> => submit(registerStockLossAction(input));
  return { loading, items, activeItems, providers, search, setSearch, groupFilter, setGroupFilter, dialog, setDialog, message, submitEntry, submitLoss };
}
