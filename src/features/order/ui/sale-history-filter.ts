import { buyerLabel, type SaleDef } from '@/features/order/domain/sale-history.schema';
import { argentinaDay } from '@/lib/format-date-time';
import { normalizeForSearch } from '@/lib/utils';

export type SaleFilters = { search: string; startDate: string; endDate: string };

export const NO_FILTERS: SaleFilters = { search: '', startDate: '', endDate: '' };

export function filterSales(sales: SaleDef[], { search, startDate, endDate }: SaleFilters): SaleDef[] {
  const terms = normalizeForSearch(search).split(/\s+/).filter(Boolean);
  return sales.filter((sale) => {
    const text = normalizeForSearch(`${buyerLabel(sale.buyerName)} ${sale.vendorName}`);
    const day = argentinaDay(sale.createdAt);
    return terms.every((term) => text.includes(term)) && (!startDate || day >= startDate) && (!endDate || day <= endDate);
  });
}
