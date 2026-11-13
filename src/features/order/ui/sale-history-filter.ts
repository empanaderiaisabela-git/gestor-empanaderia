import { describeSaleLine } from '@/features/order/domain/order-describe';
import { describePayment } from '@/features/order/domain/payment-describe';
import { buyerLabel, type SaleDef } from '@/features/order/domain/sale-history.schema';
import { argentinaDay } from '@/lib/format-date-time';
import { formatMoney } from '@/lib/format-money';
import { matchesAllWords } from '@/lib/utils';

export type SaleFilters = { search: string; startDate: string; endDate: string };

export const NO_FILTERS: SaleFilters = { search: '', startDate: '', endDate: '' };

function saleText(sale: SaleDef): string {
  const payments = sale.payments.length === 0 ? ['Pendiente'] : sale.payments.map(describePayment);
  const discounts = [sale.discountPercentage > 0 ? `-${sale.discountPercentage}%` : '', sale.discountAmount > 0 ? `-${formatMoney(sale.discountAmount)}` : ''];
  return [buyerLabel(sale.buyerName), sale.vendorName, ...sale.lines.map(describeSaleLine), ...payments, ...discounts, formatMoney(sale.total)].join(' ');
}

export function filterSales(sales: SaleDef[], { search, startDate, endDate }: SaleFilters): SaleDef[] {
  return sales.filter((sale) => {
    const day = argentinaDay(sale.createdAt);
    return matchesAllWords(saleText(sale), search) && (!startDate || day >= startDate) && (!endDate || day <= endDate);
  });
}
