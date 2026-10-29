import { Banknote, Briefcase, CreditCard, HandCoins, Landmark, Wallet, type LucideIcon } from 'lucide-react';
import type { PaymentType } from '@/features/order/domain/order-validation';

export type StatTheme = { icon: LucideIcon; card: string; chip: string };

export const NEUTRAL_CARD = 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50';

const PAYMENT_CHIP = 'bg-black/10 dark:bg-white/10';

export const STAT_THEME = {
  promos: { icon: HandCoins, card: `${NEUTRAL_CARD} border-stat-promos-accent dark:border-stat-promos-dark-accent`, chip: 'bg-stat-promos text-stat-promos-accent dark:bg-stat-promos-dark dark:text-stat-promos-dark-accent' },
  profit: { icon: Banknote, card: `${NEUTRAL_CARD} border-stat-profit-accent dark:border-stat-profit-dark-accent`, chip: 'bg-stat-profit text-stat-profit-accent dark:bg-stat-profit-dark dark:text-stat-profit-dark-accent' },
  sales: { icon: Briefcase, card: `${NEUTRAL_CARD} border-stat-sales-accent dark:border-stat-sales-dark-accent`, chip: 'bg-stat-sales text-stat-sales-accent dark:bg-stat-sales-dark dark:text-stat-sales-dark-accent' },
} as const satisfies Record<string, StatTheme>;

export const PAYMENT_THEME: Readonly<Record<PaymentType, StatTheme>> = {
  efectivo: { icon: Banknote, card: 'bg-pay-efectivo border-pay-efectivo-accent text-pay-efectivo-ink dark:bg-pay-efectivo-dark dark:border-pay-efectivo-dark-accent dark:text-pay-efectivo-dark-ink', chip: PAYMENT_CHIP },
  transferencia: { icon: Landmark, card: 'bg-pay-transferencia border-pay-transferencia-accent text-pay-transferencia-ink dark:bg-pay-transferencia-dark dark:border-pay-transferencia-dark-accent dark:text-pay-transferencia-dark-ink', chip: PAYMENT_CHIP },
  debito: { icon: CreditCard, card: 'bg-pay-debito border-pay-debito-accent text-pay-debito-ink dark:bg-pay-debito-dark dark:border-pay-debito-dark-accent dark:text-pay-debito-dark-ink', chip: PAYMENT_CHIP },
  credito: { icon: Wallet, card: 'bg-pay-credito border-pay-credito-accent text-pay-credito-ink dark:bg-pay-credito-dark dark:border-pay-credito-dark-accent dark:text-pay-credito-dark-ink', chip: PAYMENT_CHIP },
};
