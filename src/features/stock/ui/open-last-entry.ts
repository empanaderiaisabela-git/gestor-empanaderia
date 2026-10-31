import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { fetchStockEntries } from '@/features/stock/actions/fetch-stock-entries';
import type { StockDialog } from './use-stock-panel';

export async function openLastEntry(item: MenuItemDef, setDialog: (dialog: StockDialog) => void): Promise<void> {
  const [last] = await fetchStockEntries(item.id);
  setDialog(last ? { kind: 'entry', item, entry: last } : { kind: 'history', item });
}
