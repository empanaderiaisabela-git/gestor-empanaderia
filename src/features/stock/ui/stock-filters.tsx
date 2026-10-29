import type { JSX } from 'react';
import { CATEGORY_LABELS, isStockCategory, STOCK_CATEGORIES, STOCKED_CATEGORIES } from '@/features/stock/domain/stock-categories';
import { isStockOrder, ORDER_LABELS, STOCK_ORDERS } from '@/features/stock/domain/stock-order';
import type { StockPanelModel } from './use-stock-panel';

const selectClass = 'h-11 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm';

function OrderFilter({ model }: { model: StockPanelModel }): JSX.Element {
  return (
    <select aria-label='Ordenar Stock' value={model.stockOrder} onChange={(event) => isStockOrder(event.target.value) && model.setStockOrder(event.target.value)} className={selectClass}>
      {STOCK_ORDERS.map((order) => (
        <option key={order} value={order}>
          {ORDER_LABELS[order]}
        </option>
      ))}
    </select>
  );
}

function CategoryFilter({ model, isAdmin }: { model: StockPanelModel; isAdmin: boolean }): JSX.Element {
  return (
    <select aria-label='Filtrar Stock' value={model.categoryFilter} onChange={(event) => model.setCategoryFilter(isStockCategory(event.target.value) ? event.target.value : 'todos')} className={selectClass}>
      <option value='todos'>Todas las categorías</option>
      {(isAdmin ? STOCK_CATEGORIES : STOCKED_CATEGORIES).map((category) => (
        <option key={category} value={category}>
          {CATEGORY_LABELS[category]}
        </option>
      ))}
    </select>
  );
}

export function StockFilters({ model, isAdmin }: { model: StockPanelModel; isAdmin: boolean }): JSX.Element {
  return (
    <>
      <OrderFilter model={model} />
      <CategoryFilter model={model} isAdmin={isAdmin} />
    </>
  );
}
